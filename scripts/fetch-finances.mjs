// 2단계 — 학교별 재정 지표 수집.
// 대학비교통계 엔드포인트는 svyYr + schlId 가 둘 다 있어야 응답한다. 하나라도 빠지면 totalCount 0.
//
// 이 단계의 규칙 두 가지
// 1) API 오류와 '값 없음'을 절대 같은 것으로 기록하지 않는다. 오류를 미공시로 저장하면
//    화면에 없는 사실이 실린다.
// 2) 이어받기를 지원한다. 호출 제한에 걸려 중단돼도 이미 확정된 값은 다시 받지 않는다.
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { API, BASE_YEAR, PATHS, FINANCE_ENDPOINTS, DAILY_QUOTA_PER_ENDPOINT, ERROR_ABORT_RATIO } from './config.mjs';
import { call, mapLimit, ApiError } from './api.mjs';

/** 이미 확정된 결과인가. 값이 있거나 '값 없음'이 확인된 건 다시 받을 필요가 없다. */
const settled = row => row && (row.value != null || row.reason === 'EMPTY' || row.reason === 'NAN');

async function loadPrevious(year) {
  try {
    return JSON.parse(await readFile(`${PATHS.raw}/finances-${year}.json`, 'utf8'));
  } catch {
    return {};
  }
}

export async function fetchFinances(schools, year = BASE_YEAR) {
  const keys = Object.keys(FINANCE_ENDPOINTS);
  const previous = await loadPrevious(year);
  const result = {};

  console.log(`엔드포인트당 ${schools.length}건 호출 / 한도 ${DAILY_QUOTA_PER_ENDPOINT}건`);

  for (const key of keys) {
    const { ep, label } = FINANCE_ENDPOINTS[key];
    const prevRows = new Map((previous[key] ?? []).map(r => [r.schlId, r]));
    const todo = schools.filter(s => !settled(prevRows.get(s.id)));
    const reused = schools.length - todo.length;

    const errors = [];
    let ok = 0, empty = 0;

    process.stdout.write(`${label} ${reused ? `(이어받기 ${reused}건 재사용) ` : ''}`);

    const fetched = await mapLimit(todo, async school => {
      try {
        const { items } = await call(API.finance, ep, { svyYr: year, schlId: school.id, numOfRows: '5' });
        const it = items[0];
        if (!it) { empty++; return { schlId: school.id, value: null, reason: 'EMPTY' }; }
        const value = Number(it.indctVal1);
        if (!Number.isFinite(value)) { empty++; return { schlId: school.id, value: null, reason: 'NAN' }; }
        ok++;
        return {
          schlId: school.id, value, indctId: it.indctId, reason: null,
          // 응답이 요청한 학교와 일치하는지 확인한다. 조인 사고를 여기서 잡는다.
          echoedId: it.schlId, echoedName: it.schlKrnNm,
        };
      } catch (err) {
        errors.push(err);
        // 인증·쿼터는 즉시 중단. 계속 돌면 전 학교가 '미공시'로 저장된다.
        if (err instanceof ApiError && (err.kind === 'AUTH' || err.kind === 'QUOTA')) {
          if (err.kind === 'QUOTA') {
            console.log(`\n\n[중단] ${err.message}`);
            console.log('  받은 데이터는 저장돼 있다. 내일 같은 명령을 실행하면 남은 것만 이어받는다.');
            console.log('  더 빨리 풀려면 공공데이터포털에서 운영계정으로 트래픽 증량을 신청할 것.');
          }
          throw err;
        }
        return { schlId: school.id, value: null, reason: 'ERROR', errorKind: err.kind ?? 'NETWORK', error: err.message };
      }
    }, undefined, (d, t) => { if (d % 25 === 0 || d === t) process.stdout.write('.'); });

    // 이전 결과와 병합
    const merged = new Map(prevRows);
    fetched.forEach(r => merged.set(r.schlId, r));
    result[key] = schools.map(s => merged.get(s.id) ?? { schlId: s.id, value: null, reason: 'ERROR', error: '미수집' });

    const stillError = result[key].filter(r => r.reason === 'ERROR').length;
    console.log(` 성공 ${ok} · 값없음 ${empty} · 오류 ${errors.length} · 누적미해결 ${stillError}`);

    if (errors.length) {
      const kinds = errors.reduce((a, e) => { const k = e.kind ?? 'NETWORK'; a[k] = (a[k] || 0) + 1; return a; }, {});
      console.log(`   오류 내역: ${Object.entries(kinds).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
    }

    // 중간 저장. 여기서 끊겨도 다음 실행이 이어받는다.
    await mkdir(PATHS.raw, { recursive: true });
    await writeFile(`${PATHS.raw}/finances-${year}.json`, JSON.stringify(result, null, 2));

    const ratio = stillError / schools.length;
    if (ratio > ERROR_ABORT_RATIO) {
      throw new Error(
        `${label}: 미해결 ${stillError}건 (${(ratio * 100).toFixed(1)}%) — 여기서 멈춘다.\n` +
        `  받은 데이터는 ${PATHS.raw}/finances-${year}.json 에 저장했다.\n` +
        `  호출 제한(429)이라면 10~30분 뒤 같은 명령을 다시 실행하면 남은 것만 이어받는다.`
      );
    }
  }

  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const schools = JSON.parse(await readFile(`${PATHS.raw}/schools-${BASE_YEAR}.json`, 'utf8'));
  await fetchFinances(schools);
}
