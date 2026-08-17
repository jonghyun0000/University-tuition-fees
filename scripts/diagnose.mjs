// 진단용. 학교 3곳을 순차 호출하고 응답을 그대로 보여준다.
// 수집이 대량으로 실패할 때 원인이 인증인지, 호출 제한인지, 네트워크인지 10초 안에 가른다.
import { API, BASE_YEAR, SERVICE_KEY, USER_AGENT } from './config.mjs';

const targets = [
  ['세종대학교', '0000138'],
  ['한양대학교', '0000203'],
  ['강원대학교', '0000003'],
];

console.log(`인증키 길이 ${SERVICE_KEY.length} · 앞 12자 ${SERVICE_KEY.slice(0, 12)} · 끝 6자 ${SERVICE_KEY.slice(-6)}`);
console.log(`Node ${process.version}\n`);

for (const [name, id] of targets) {
  const url = `${API.finance}/getComparisonTuitionCrntSt?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=3&svyYr=${BASE_YEAR}&schlId=${id}`;
  try {
    const t0 = Date.now();
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/xml' } });
    const xml = await res.text();
    console.log(`[${name}] HTTP ${res.status} · ${Date.now() - t0}ms`);
    console.log(xml.replace(/\s+/g, ' ').slice(0, 420));
    console.log('');
  } catch (err) {
    console.log(`[${name}] 예외: ${err.message}\n`);
  }
}
