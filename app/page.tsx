import type { Metadata } from 'next';
import SearchBox from '@/components/SearchBox';
import { searchIndex, universities, BASE_YEAR, SITE_URL } from '@/lib/data';

export const metadata: Metadata = {
  alternates: { canonical: `${SITE_URL}/` },
};

export default function Home() {
  const index = searchIndex();
  const byDiv = universities.reduce<Record<string, number>>((a, u) => {
    a[u.div] = (a[u.div] ?? 0) + 1;
    return a;
  }, {});

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-[880px] flex-col items-center justify-center px-5 py-16 text-center">
      <h1 className="mb-3 text-[clamp(28px,5.2vw,42px)] font-bold leading-tight tracking-tighter">
        당신의 등록금은 어디로 갔을까
      </h1>
      <p className="mb-10 max-w-[34em] text-[15px] text-ink2">
        학교 이름을 검색하면, 낸 등록금과 학교가 학생 1명에게 쓴 돈을 나란히 보여준다.
      </p>

      <SearchBox index={index} />

      <p className="mt-4 text-[12.5px] text-muted">
        초성으로도 찾을 수 있다. <code className="rounded-sm bg-[#f0efec] px-1.5 py-px">ㄱㅇㄷ</code>{' '}
        <code className="rounded-sm bg-[#f0efec] px-1.5 py-px">ㅅㅇㄷ</code>{' '}
        <code className="rounded-sm bg-[#f0efec] px-1.5 py-px">ㅍㅎㄱㄷ</code>
      </p>

      <p className="mt-11 max-w-[38em] text-[12.5px] text-muted">
        {BASE_YEAR}년 대학정보공시 기준 {universities.length}개교
        ({Object.entries(byDiv).map(([k, v]) => `${k} ${v}`).join(' · ')})를 학교별로 정리한다.
        순위를 매기지 않으며, 자체 점수나 등급을 만들지 않는다.
      </p>
    </div>
  );
}
