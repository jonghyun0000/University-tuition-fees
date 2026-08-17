import raw from '@/data/universities.json';
import type { University, MetricKey } from './types';

const ALL = raw as unknown as University[];

/** 페이지를 만들 대상. 캠퍼스 레코드와 전부 결측(폐교 포함)은 제외된다. */
export const universities: University[] = ALL.filter(u => u.publishable);

const byId = new Map(universities.map(u => [u.id, u]));
export const getUniversity = (id: string) => byId.get(id) ?? null;

export const BASE_YEAR = ALL[0]?.baseYear ?? '2025';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com';

export const METRIC_ORDER: MetricKey[] = ['tuition', 'eduExpense', 'scholarship', 'loanRatio'];

/** 내부링크용. 같은 지역을 우선하고, 모자라면 같은 학제로 채운다. 색인 속도가 여기에 달려 있다. */
export function relatedOf(u: University, limit = 5): University[] {
  const sameRegion = universities.filter(x => x.id !== u.id && x.region === u.region);
  const sameDiv = universities.filter(x => x.id !== u.id && x.region !== u.region && x.div === u.div);
  return [...sameRegion, ...sameDiv].slice(0, limit);
}

/** 비교 페이지 URL. /compare/{a}-vs-{b} — 항상 작은 id가 앞에 오게 해서 중복 URL을 막는다. */
export function comparePath(a: string, b: string) {
  const [x, y] = [a, b].sort();
  return `/compare/${x}-vs-${y}`;
}

export function parseComparePair(pair: string): [string, string] | null {
  const m = /^(\d+)-vs-(\d+)$/.exec(pair);
  if (!m) return null;
  return [m[1], m[2]];
}

/** SSG로 미리 만들 비교 조합. 같은 지역 안에서 인접한 학교끼리만 — 전 조합은 7만 개가 넘는다. */
export function popularComparePairs(perRegion = 6): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const regions = [...new Set(universities.map(u => u.region))];
  for (const r of regions) {
    const list = universities.filter(u => u.region === r).slice(0, perRegion);
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const [a, b] = [list[i].id, list[j].id].sort();
        out.push([a, b]);
      }
    }
  }
  return out;
}

/** 검색 인덱스. 클라이언트로 넘기는 최소 데이터. */
export type SearchEntry = { id: string; name: string; meta: string; cho: string; aliases: string[] };

export function searchIndex(): SearchEntry[] {
  return universities.map(u => ({
    id: u.id,
    name: u.name,
    meta: `${u.region} · ${u.estb} · ${u.div}`,
    cho: toChoseong(u.name),
    aliases: u.aliases ?? deriveAliases(u.name),
  }));
}

/** 국립대 개명 등으로 옛 이름 검색이 실패한다. 최소한의 별칭을 자동 생성한다. */
export function deriveAliases(name: string): string[] {
  const out = new Set<string>();
  if (name.startsWith('국립')) out.add(name.slice(2));
  const bare = name.replace(/대학교$|대학$/, '');
  if (bare && bare !== name) out.add(bare);
  const paren = /^(.+?)\((.+?)\)$/.exec(name);
  if (paren) { out.add(paren[1]); out.add(`${paren[1]} ${paren[2]}`); out.add(`${paren[1]}${paren[2]}`); }
  out.delete(name);
  return [...out];
}

const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
export function toChoseong(s: string) {
  return [...s].map(ch => {
    const c = ch.charCodeAt(0) - 0xac00;
    return c >= 0 && c <= 11171 ? CHO[Math.floor(c / 588)] : ch;
  }).join('');
}
