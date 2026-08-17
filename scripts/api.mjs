// 공통 호출 계층. 속도 제어·재시도·에러 표면화를 여기 한곳에 둔다.
//
// 두 가지가 이 파일의 존재 이유다.
// 1) data.go.kr 게이트웨이는 초당 요청 수를 제한한다. 넘기면 HTTP 429가 나고,
//    계속 때리면 차단이 길어진다. 그래서 전역 게이트로 요청 간격을 강제한다.
// 2) API 오류를 '미공시'로 기록하면 안 된다. 없는 사실을 만드는 것과 같다.
//    실패는 삼키지 않고 사유를 그대로 위로 올린다.
import { SERVICE_KEY, CONCURRENCY, MIN_INTERVAL_MS, RATE_LIMIT_COOLDOWN_MS, USER_AGENT } from './config.mjs';
import { parseItems, parseHeader } from './xml.mjs';

export class ApiError extends Error {
  constructor(message, { kind, ep, status } = {}) {
    super(message);
    this.kind = kind;   // 'RATE' | 'QUOTA' | 'AUTH' | 'HTTP' | 'SERVICE' | 'NETWORK'
    this.ep = ep;
    this.status = status;
  }
}

function classify(errMsg = '', code = '') {
  const s = `${errMsg} ${code}`.toUpperCase();
  if (s.includes('LIMITED_NUMBER_OF_SERVICE_REQUESTS')) return 'QUOTA';
  if (s.includes('SERVICE_KEY_IS_NOT_REGISTERED') || s.includes('SERVICE_ACCESS_DENIED')) return 'AUTH';
  return 'SERVICE';
}

// ── 전역 속도 제어 ──────────────────────────────────────────────
// 동시성과 무관하게 '요청 시작 간격'을 프로세스 전체에서 강제한다.
// 429가 뜨면 모든 워커가 함께 쉰다. 혼자 쉬면 나머지가 계속 때려서 차단이 안 풀린다.
let nextSlot = 0;
let pauseUntil = 0;
let rateHits = 0;

async function gate() {
  while (true) {
    const now = Date.now();
    if (pauseUntil > now) { await sleep(pauseUntil - now + 50); continue; }
    const slot = Math.max(now, nextSlot);
    nextSlot = slot + MIN_INTERVAL_MS;
    const wait = slot - now;
    if (wait > 0) await sleep(wait);
    return;
  }
}

function tripRateLimit() {
  rateHits++;
  // 연속으로 맞을수록 더 길게 쉰다. 최대 5분.
  const cooldown = Math.min(RATE_LIMIT_COOLDOWN_MS * Math.min(rateHits, 6), 300_000);
  const until = Date.now() + cooldown;
  if (until > pauseUntil) {
    pauseUntil = until;
    process.stdout.write(`\n   [429] 호출 제한. ${Math.round(cooldown / 1000)}초 대기 후 재개\n   `);
  }
}

export function rateLimitHits() { return rateHits; }

export async function call(base, ep, params = {}, { retries = 5 } = {}) {
  const qs = new URLSearchParams({ pageNo: '1', numOfRows: '10', ...params });
  // serviceKey는 이미 URL 인코딩된 값이라 URLSearchParams에 넣으면 이중 인코딩된다. 직접 붙인다.
  const url = `${base}/${ep}?serviceKey=${SERVICE_KEY}&${qs.toString()}`;

  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    await gate();
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/xml' },
        signal: AbortSignal.timeout(20000),
      });

      const xml = await res.text();

      // 429는 두 가지를 뜻한다. 본문을 반드시 읽고 구분해야 한다.
      //  - LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR = 일일 한도 소진 → 기다려도 소용없다
      //  - 그 외 = 순간 호출량 초과 → 잠깐 쉬면 풀린다
      if (res.status === 429) {
        const msg = /<errMsg>([\s\S]*?)<\/errMsg>/.exec(xml)?.[1]?.trim() ?? '';
        if (classify(msg) === 'QUOTA') {
          throw new ApiError(
            `일일 서비스 요청제한 횟수 초과 (${ep}). 한도는 자정(KST)에 리셋된다.`,
            { kind: 'QUOTA', ep, status: 429 }
          );
        }
        tripRateLimit();
        throw new ApiError('HTTP 429 (순간 호출량 초과)', { kind: 'RATE', ep, status: 429 });
      }

      if (!res.ok) throw new ApiError(`HTTP ${res.status}`, { kind: 'HTTP', ep, status: res.status });

      const header = parseHeader(xml);
      if (header.err) throw new ApiError(header.err, { kind: classify(header.err), ep });
      if (header.code && header.code !== '00') {
        throw new ApiError(`resultCode ${header.code} ${header.msg ?? ''}`, { kind: classify(header.msg, header.code), ep });
      }
      if (!header.code && !xml.includes('<items')) {
        throw new ApiError(`예상치 못한 응답: ${xml.slice(0, 160)}`, { kind: 'SERVICE', ep });
      }

      // 성공하면 연속 카운터를 천천히 되돌린다
      if (rateHits > 0) rateHits = Math.max(0, rateHits - 0.2);
      return { items: parseItems(xml), totalCount: header.totalCount, url };
    } catch (err) {
      lastErr = err instanceof ApiError ? err : new ApiError(String(err.message ?? err), { kind: 'NETWORK', ep });
      // 인증·쿼터는 재시도해도 소용없다. 바로 올린다.
      if (lastErr.kind === 'AUTH' || lastErr.kind === 'QUOTA') throw lastErr;
      if (attempt === retries) throw lastErr;
      // 429는 위에서 이미 전역 대기를 걸었으므로 추가 백오프는 짧게
      if (lastErr.kind !== 'RATE') await sleep(600 * (attempt + 1));
    }
  }
  throw lastErr;
}

/** 동시성 제한 실행기. 실제 속도는 api.mjs의 전역 게이트가 결정한다. */
export async function mapLimit(list, fn, limit = CONCURRENCY, onProgress) {
  const out = new Array(list.length);
  let cursor = 0, done = 0;
  const workers = Array.from({ length: Math.min(limit, list.length) }, async () => {
    while (cursor < list.length) {
      const i = cursor++;
      out[i] = await fn(list[i], i);
      done++;
      if (onProgress) onProgress(done, list.length);
    }
  });
  await Promise.all(workers);
  return out;
}

export const sleep = ms => new Promise(r => setTimeout(r, ms));
