// 4단계 — 검증. 통과 못 한 학교를 '제외'하지 않는다. 부분 공시 상태로 남기고 목록만 뽑는다.
import { readFile } from 'node:fs/promises';
import { PATHS, FINANCE_ENDPOINTS } from './config.mjs';

const RETURN_RATE_MIN = 0;      // 이하면 이상치
const RETURN_RATE_MAX = 1000;   // 초과면 이상치 — 실제로 정상인 경우가 많으니 '검토 대상'으로만 쓴다

export function validate(universities) {
  const n = universities.length;
  const keys = Object.keys(FINANCE_ENDPOINTS);
  const lines = [];
  const p = s => lines.push(s);

  p('='.repeat(64));
  p(`검증 리포트 — 전체 ${n}건`);
  p('='.repeat(64));

  const byDiv = tally(universities, u => u.div);
  const byEstb = tally(universities, u => u.estbGroup);
  p(`\n[학교 구성]`);
  p(`  학제   ${fmtTally(byDiv)}`);
  p(`  설립   ${fmtTally(byEstb)}`);

  p(`\n[필수 필드 결측률]`);
  for (const k of keys) {
    const miss = universities.filter(u => u.metrics[k].value == null);
    const na = miss.filter(u => u.metrics[k].status === '해당 없음').length;
    p(`  ${FINANCE_ENDPOINTS[k].label.padEnd(22)} ${String(miss.length).padStart(3)}건  ${pct(miss.length, n)}` +
      (na ? `  (그중 해당 없음 ${na}건)` : ''));
  }

  const full = universities.filter(u => u.completeness === 'full').length;
  const partial = universities.filter(u => u.completeness === 'partial').length;
  const none = universities.filter(u => u.completeness === 'none').length;
  p(`\n[공시 완전성]`);
  p(`  완전 공시   ${String(full).padStart(3)}건  ${pct(full, n)}`);
  p(`  부분 공시   ${String(partial).padStart(3)}건  ${pct(partial, n)}`);
  p(`  전부 결측   ${String(none).padStart(3)}건  ${pct(none, n)}   (캠퍼스 레코드 ${universities.filter(u => u.mergeInto).length}건 포함)`);
  p(`  페이지 생성 대상 ${universities.filter(u => u.publishable).length}건`);

  const rr = universities.filter(u => u.returnRate.value != null).map(u => u.returnRate.value).sort((a, b) => a - b);
  p(`\n[교육비 환원율 — 계산값]`);
  p(`  산출 가능 ${rr.length}건 / 산출 불가 ${n - rr.length}건`);
  p(`  최소 ${rr[0]}%  ·  중앙값 ${q(rr, .5)}%  ·  최대 ${rr[rr.length - 1]}%`);

  const outliers = universities.filter(u => u.returnRate.value != null &&
    (u.returnRate.value <= RETURN_RATE_MIN || u.returnRate.value > RETURN_RATE_MAX));
  p(`\n[이상치 — 환원율 ${RETURN_RATE_MIN}% 이하 또는 ${RETURN_RATE_MAX}% 초과] ${outliers.length}건`);
  for (const u of outliers) {
    p(`  ${u.name}(${u.id}, ${u.estb}, ${u.div}) 등록금 ${fmtWon(u.metrics.tuition.value)} / ` +
      `교육비 ${fmtWon(u.metrics.eduExpense.value)} → ${u.returnRate.value}%`);
  }
  p(`  주의: 이 목록은 오류 목록이 아니라 검토 대상 목록이다. 소규모 특수목적대·도립대는 구조적으로 높게 나온다.`);

  const joinFail = universities.filter(u => u.metrics.tuition.value == null && u.metrics.eduExpense.value == null
    && u.metrics.scholarship.value == null && u.metrics.loanRatio.value == null && !u.mergeInto);
  p(`\n[조인 실패 후보] ${joinFail.length}건`);
  for (const u of joinFail.slice(0, 20)) p(`  ${u.name}(${u.id}, ${u.campus}, ${u.estb})`);
  if (joinFail.length > 20) p(`  ... 외 ${joinFail.length - 20}건`);

  const dup = Object.entries(tally(universities, u => u.name)).filter(([, c]) => c > 1);
  p(`\n[동일 학교명 복수 레코드] ${dup.length}개 이름`);
  p(`  본교·분교·캠퍼스가 각각 schlId를 갖는다. 이름만으로 조인하면 안 되는 이유다.`);

  p('\n' + '='.repeat(64));
  const fatal = joinFail.length > n * 0.1;
  p(fatal ? '판정: 실패 — 조인 실패가 10%를 넘는다. 파이프라인을 고칠 것.' : '판정: 통과');
  p('='.repeat(64));

  return { report: lines.join('\n'), outliers, joinFail, ok: !fatal };
}

const tally = (arr, fn) => arr.reduce((a, x) => { const k = fn(x); a[k] = (a[k] || 0) + 1; return a; }, {});
const fmtTally = o => Object.entries(o).map(([k, v]) => `${k} ${v}`).join(' · ');
const pct = (a, b) => `(${(a / b * 100).toFixed(1)}%)`;
const q = (sorted, p) => sorted[Math.floor(sorted.length * p)];
const fmtWon = v => v == null ? '없음' : Math.round(v).toLocaleString('ko-KR') + '원';

if (import.meta.url === `file://${process.argv[1]}`) {
  const universities = JSON.parse(await readFile(PATHS.universities, 'utf8'));
  const { report, ok } = validate(universities);
  console.log(report);
  process.exit(ok ? 0 : 1);
}
