'use client';

import { useMemo, useState } from 'react';
import type { SearchEntry } from '@/lib/data';

const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

export default function SearchBox({ index }: { index: SearchEntry[] }) {
  const [q, setQ] = useState('');

  const results = useMemo(() => {
    const v = q.trim();
    if (!v) return [];
    const isCho = [...v].every(ch => CHO.includes(ch));
    const hit = index.filter(e =>
      isCho
        ? e.cho.includes(v)
        : e.name.includes(v) || e.aliases.some(a => a.includes(v))
    );
    // 정확히 앞에서부터 일치하는 학교를 위로 올린다
    return hit
      .sort((a, b) => Number(b.name.startsWith(v)) - Number(a.name.startsWith(v)))
      .slice(0, 8);
  }, [q, index]);

  return (
    <div className="w-full max-w-[520px]">
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
          </svg>
        </span>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          type="text"
          autoComplete="off"
          aria-label="학교 검색"
          placeholder="학교 이름을 입력하세요"
          className="w-full rounded-md border border-axis bg-surface py-4 pl-[50px] pr-4 text-base
                     outline-none focus:border-accent focus:ring-4 focus:ring-[#eef4fc]"
        />
      </div>

      {results.length > 0 && (
        <ul className="mt-1.5 overflow-hidden rounded-md border border-line bg-surface text-left">
          {results.map(r => (
            <li key={r.id}>
              <a href={`/univ/${r.id}/`}
                 className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0 hover:bg-[#f4f3f1]">
                <span>{r.name}</span>
                <span className="whitespace-nowrap text-[12.5px] text-muted">{r.meta}</span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {q.trim() && results.length === 0 && (
        <p className="mt-3 text-[13px] text-muted">
          검색 결과가 없다. 학교 이름이 바뀐 경우가 있다 — 예를 들어 강릉원주대는 국립강릉원주대학교로,
          꽃동네대는 가톨릭꽃동네대학교로 공시된다.
        </p>
      )}
    </div>
  );
}
