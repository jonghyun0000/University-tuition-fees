// 3단계 — 정규화. 결측을 0으로 채우지 않고, 결측 '사유'를 구분해 남기는 것이 이 파일의 핵심이다.
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { BASE_YEAR, PATHS, FINANCE_ENDPOINTS, MISSING } from './config.mjs';

// 교육비를 공시하지 않는 학교 유형. 회계 체계가 달라 애초에 공시 대상이 아니다.
// "미공시"로 적으면 이 학교들이 부당하게 깎이므로 "해당 없음"으로 구분한다.
const EDU_EXPENSE_EXEMPT = /과학기술원$|^한국과학기술원$/;

export function normalize(schools, finances, year = BASE_YEAR) {
  const idx = {};
  for (const [key, rows] of Object.entries(finances)) {
    idx[key] = Object.fromEntries(rows.map(r => [r.schlId, r]));
  }

  return schools.map(s => {
    const metrics = {};
    for (const key of Object.keys(FINANCE_ENDPOINTS)) {
      const row = idx[key]?.[s.id];
      const { label, unit } = FINANCE_ENDPOINTS[key];
      if (row && row.value != null) {
        metrics[key] = { value: row.value, unit, label, indctId: row.indctId, baseYear: year, status: 'ok' };
      } else {
        const exempt = key === 'eduExpense' && EDU_EXPENSE_EXEMPT.test(s.name);
        metrics[key] = {
          value: null, unit, label, baseYear: year,
          status: exempt ? MISSING.NOT_APPLICABLE : MISSING.NOT_DISCLOSED,
          reason: exempt ? '회계 체계가 달라 해당 항목의 공시 대상이 아니다' : '해당 연도 공시 자료에 값이 없다',
        };
      }
    }

    // 환원율은 공시 지표가 아니다. 우리가 계산하는 유일한 값이므로 derived 표시와 산식을 반드시 붙인다.
    const t = metrics.tuition.value, e = metrics.eduExpense.value;
    const returnRate = (t > 0 && e != null)
      ? { value: +(e / t * 100).toFixed(1), derived: true, unit: 'PERCENT',
          formula: '학생 1인당 교육비 ÷ 평균등록금 × 100',
          basedOn: ['tuition', 'eduExpense'], baseYear: year, status: 'ok' }
      : { value: null, derived: true, status: MISSING.NOT_DERIVABLE,
          formula: '학생 1인당 교육비 ÷ 평균등록금 × 100',
          reason: t > 0 ? '분자인 교육비가 비어 있다' : '분모인 등록금이 비어 있다' };

    const missing = Object.entries(metrics).filter(([, m]) => m.value == null).map(([k]) => k);
    // 캠퍼스 레코드는 재정 지표가 본교에만 공시된다. 개별 페이지를 만들면 빈 페이지가 된다.
    const isCampusRecord = s.campus !== '본교' && missing.length === Object.keys(metrics).length;

    return {
      ...s,
      metrics,
      returnRate,
      completeness: missing.length === 0 ? 'full' : missing.length === Object.keys(metrics).length ? 'none' : 'partial',
      missing,
      publishable: !isCampusRecord && missing.length < Object.keys(metrics).length,
      mergeInto: isCampusRecord ? (schools.find(x => x.name === s.name && x.campus === '본교')?.id ?? null) : null,
    };
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const schools = JSON.parse(await readFile(`${PATHS.raw}/schools-${BASE_YEAR}.json`, 'utf8'));
  const finances = JSON.parse(await readFile(`${PATHS.raw}/finances-${BASE_YEAR}.json`, 'utf8'));
  const universities = normalize(schools, finances);

  await mkdir(PATHS.univDir, { recursive: true });
  await writeFile(PATHS.universities, JSON.stringify(universities, null, 2));
  for (const u of universities) {
    await writeFile(`${PATHS.univDir}/${u.id}.json`, JSON.stringify(withSources(u, universities), null, 2));
  }
  console.log(`정규화 완료 — 전체 ${universities.length}건, 페이지 생성 대상 ${universities.filter(u => u.publishable).length}건`);
}

// 학교별 파일에는 출처 목록과 내부링크용 관련 학교를 함께 넣는다. 빌드 때 다시 계산하지 않기 위함.
export function withSources(u, all) {
  const related = all
    .filter(x => x.publishable && x.id !== u.id && (x.region === u.region || x.div === u.div))
    .sort((a, b) => (a.region === u.region ? -1 : 1) - (b.region === u.region ? -1 : 1))
    .slice(0, 5)
    .map(x => ({ id: x.id, name: x.name, region: x.region, estb: x.estb }));

  const sources = Object.values(u.metrics).map(m => ({
    item: m.label, baseYear: m.baseYear,
    provider: '대학알리미 재정 현황 (한국대학교육협의회)',
    url: 'https://www.academyinfo.go.kr',
  }));

  return { ...u, related, sources, license: '이용허락범위 제한 없음 · 출처표시' };
}
