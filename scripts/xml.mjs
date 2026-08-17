// 최소 XML 파서. 응답이 <item> 반복의 평평한 구조라 정규식으로 충분하다.
// 외부 의존을 하나도 두지 않기 위해 직접 만든다.

export function parseItems(xml) {
  const items = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const obj = {};
    const fieldRe = /<([A-Za-z0-9_]+)>([\s\S]*?)<\/\1>/g;
    let f;
    while ((f = fieldRe.exec(m[1])) !== null) obj[f[1]] = decode(f[2].trim());
    items.push(obj);
  }
  return items;
}

export function parseHeader(xml) {
  const code = /<resultCode>([\s\S]*?)<\/resultCode>/.exec(xml)?.[1]?.trim();
  const msg = /<resultMsg>([\s\S]*?)<\/resultMsg>/.exec(xml)?.[1]?.trim();
  const total = /<totalCount>([\s\S]*?)<\/totalCount>/.exec(xml)?.[1]?.trim();
  const err = /<errMsg>([\s\S]*?)<\/errMsg>/.exec(xml)?.[1]?.trim();
  return { code, msg, totalCount: total ? Number(total) : null, err };
}

function decode(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}
