// 1단계 — 학교 마스터 수집. 이 파일이 만드는 것이 모든 조인의 기준이 된다.
// 대학알리미는 소스마다 학교코드 체계가 다르므로(대학재정알리미 schCd와 불일치)
// 반드시 이 API의 schlId 하나만 정본으로 쓴다.
import { writeFile, mkdir } from 'node:fs/promises';
import { API, BASE_YEAR, PATHS } from './config.mjs';
import { call } from './api.mjs';

export async function fetchSchools(year = BASE_YEAR) {
  // svyYr을 빼면 totalCount 0이 조용히 온다. 에러가 아니라 빈 응답이라 반드시 넣는다.
  const { items, totalCount } = await call(API.basic, 'getUniversityCode', {
    svyYr: year, numOfRows: '1000',
  });
  if (!items.length) throw new Error(`학교 목록이 비어 있다. svyYr=${year} 확인 필요.`);

  const schools = items.map(i => ({
    id: i.schlId,
    name: i.schlKrnNm,
    fullName: i.schlFullNm,
    campus: i.clgcpDivNm,          // 본교 / 제2캠퍼스 / 분교
    campusCd: i.clgcpDivCd,
    estb: i.estbDivNm,             // 국립 / 공립 / 사립 / 국립대법인 / 특별법법인 / 특별법국립
    estbGroup: ['사립'].includes(i.estbDivNm) ? '사립' : '국공립',
    div: i.schlDivNm,              // 대학 / 전문대학
    kind: i.schlKndNm,
    region: i.znNm,
    regionCd: i.znCd,
    baseYear: i.svyYr,
  }));

  await mkdir(PATHS.raw, { recursive: true });
  await writeFile(`${PATHS.raw}/schools-${year}.json`, JSON.stringify(schools, null, 2));
  console.log(`학교 마스터 ${schools.length}건 수집 (totalCount ${totalCount})`);
  return schools;
}

if (import.meta.url === `file://${process.argv[1]}`) fetchSchools();
