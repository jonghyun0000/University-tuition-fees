// 전체 파이프라인. fetch → normalize → validate 순서로 돌린다.
// 검증에 실패하면 0이 아닌 코드로 종료한다. 실패한 단계를 넘기지 않기 위함이다.
import { writeFile, mkdir } from 'node:fs/promises';
import { BASE_YEAR, PATHS } from './config.mjs';
import { fetchSchools } from './fetch-schools.mjs';
import { fetchFinances } from './fetch-finances.mjs';
import { normalize, withSources } from './normalize.mjs';
import { validate } from './validate.mjs';

const t0 = Date.now();
console.log(`기준연도 ${BASE_YEAR}\n`);

const schools = await fetchSchools();
const finances = await fetchFinances(schools);
const universities = normalize(schools, finances);

await mkdir(PATHS.univDir, { recursive: true });
await writeFile(PATHS.universities, JSON.stringify(universities, null, 2));
for (const u of universities) {
  await writeFile(`${PATHS.univDir}/${u.id}.json`, JSON.stringify(withSources(u, universities), null, 2));
}
console.log(`\n${PATHS.universities} 및 학교별 ${universities.length}개 파일 생성`);

const { report, ok } = validate(universities);
console.log('\n' + report);
await writeFile('data/validation-report.txt', report);

console.log(`\n소요 ${((Date.now() - t0) / 1000).toFixed(1)}초`);
process.exit(ok ? 0 : 1);
