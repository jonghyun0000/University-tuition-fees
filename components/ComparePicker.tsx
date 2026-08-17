'use client';

import { useMemo, useState } from 'react';
import type { SearchEntry } from '@/lib/data';

const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

function useSearch(index: SearchEntry[], q: string, excludeId?: string) {
  return useMemo(() => {
    const v = q.trim();
    if (!v) return [];
    const isCho = [...v].every(ch => CHO.includes(ch));
    return index
      .filter(e => e.id !== excludeId)
      .filter(e => isCho ? e.cho.includes(v) : e.name.includes(v) || e.aliases.some(a => a.includes(v)))
      .sort((a, b) => Number(b.name.startsWith(v)) - Number(a.name.startsWith(v)))
      .slice(0, 6);
  }, [index, q, excludeId]);
}

function Slot({
  index, picked, onPick, onClear, placeholder, excludeId,
}: {
  index: SearchEntry[];
  picked: SearchEntry | null;
  onPick: (e: SearchEntry) => void;
  onClear: () => void;
  placeholder: string;
  excludeId?: string;
}) {
  const [q, setQ] = useState('');
  const results = useSearch(index, q, excludeId);

  if (picked) {
    return (
      <div className="rounded-md border border-line bg-surface p-4">
        <p className="text-[17px] font-bold">{picked.name}</p>
        <p className="mt-0.5 text-[12.5px] text-muted">{picked.meta}</p>
        <button type="button" onClick={() => { onClear(); setQ(''); }}
                className="mt-3 rounded border border-line px-2.5 py-1 text-[12.5px] text-ink2 hover:bg-[#f0efec]">
          다시 고르기
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-line bg-surface p-4">
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        type="text"
        autoComplete="off"
        aria-label={placeholder}
        placeholder={placeholder}
        className="w-full rounded border border-axis bg-white px-3 py-2.5 text-[15px]
                   outline-none focus:border-accent focus:ring-4 focus:ring-[#eef4fc]"
      />
      {results.length > 0 && (
        <ul className="mt-2 overflow-hidden rounded border border-line">
          {results.map(r => (
            <li key={r.id}>
              <button type="button" onClick={() => onPick(r)}
                      className="flex w-full items-baseline justify-between gap-3 border-b border-line px-3 py-2.5 text-left last:border-b-0 hover:bg-[#f4f3f1]">
                <span className="text-[14px]">{r.name}</span>
                <span className="whitespace-nowrap text-[12px] text-muted">{r.meta}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {q.trim() && results.length === 0 && (
        <p className="mt-2 text-[12.5px] text-muted">검색 결과가 없다. 옛 이름으로 공시된 학교가 있다.</p>
      )}
    </div>
  );
}

export default function ComparePicker({ index }: { index: SearchEntry[] }) {
  const [a, setA] = useState<SearchEntry | null>(null);
  const [b, setB] = useState<SearchEntry | null>(null);

  // URL은 항상 작은 id가 앞에 온다. 같은 조합이 두 주소로 갈라지면 색인이 나뉜다.
  const href = a && b ? `/compare/${[a.id, b.id].sort().join('-vs-')}/` : null;
  const sameDiv = a && b ? a.meta.split(' · ')[2] === b.meta.split(' · ')[2] : true;

  return (
    <div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Slot index={index} picked={a} onPick={setA} onClear={() => setA(null)}
              placeholder="첫 번째 학교" excludeId={b?.id} />
        <Slot index={index} picked={b} onPick={setB} onClear={() => setB(null)}
              placeholder="두 번째 학교" excludeId={a?.id} />
      </div>

      {!sameDiv && (
        <p className="mt-3 rounded-md border border-line border-l-[3px] border-l-axis bg-surface px-4 py-3 text-[12.5px] text-ink2">
          학제가 다른 두 학교를 골랐다. 대학과 전문대학은 수업연한과 재정 구조가 달라
          같은 기준으로 읽으면 오해가 생긴다. 값은 그대로 보여주되 이 점을 감안해 달라.
        </p>
      )}

      <div className="mt-4">
        {href ? (
          <a href={href}
             className="inline-block rounded-md bg-accent px-5 py-2.5 text-[14px] font-bold text-white hover:opacity-90">
            나란히 보기
          </a>
        ) : (
          <span className="inline-block cursor-not-allowed rounded-md bg-[#e1e0d9] px-5 py-2.5 text-[14px] font-bold text-muted">
            학교 두 곳을 고르면 열린다
          </span>
        )}
      </div>
    </div>
  );
}
