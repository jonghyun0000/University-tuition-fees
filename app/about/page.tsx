import type { Metadata } from 'next';
import { BASE_YEAR, SITE_URL, universities } from '@/lib/data';

export const metadata: Metadata = {
  title: '데이터 출처와 만드는 방식',
  description: `등록금 영수증이 쓰는 데이터의 출처, 갱신 주기, 이용허락범위, 그리고 편집 원칙. 대학정보공시 ${BASE_YEAR} 기준.`,
  alternates: { canonical: `${SITE_URL}/about/` },
};

export default function About() {
  return (
    <div className="mx-auto max-w-[760px] px-5 py-12">
      <h1 className="mb-3 text-[28px] font-bold tracking-tight">데이터 출처</h1>
      <p className="mb-8 text-[15px] text-ink2">
        모든 숫자는 대학정보공시에서 온다. 우리가 조사하거나 추정한 값은 없다.
      </p>

      <h2 className="mb-2 mt-8 text-[19px] font-bold">출처</h2>
      <p className="text-[14px] text-ink2">
        한국대학교육협의회 대학정보공시센터가 운영하는 <strong>대학알리미</strong>의 공개 오픈API에서 받는다.
        정기공시는 연 4회(4·6·8·10월)이며, 이 사이트는 {BASE_YEAR}년 공시분을 기준으로 한다.
        현재 {universities.length}개교의 자료를 싣고 있다.
      </p>

      <h2 className="mb-2 mt-8 text-[19px] font-bold">이용허락범위</h2>
      <p className="text-[14px] text-ink2">
        사용하는 데이터셋은 이용허락범위 제한이 없거나 공공누리 제1유형(출처표시)이다.
        출처표시 조건을 지켜 사용하며, 모든 수치 옆에 공시 항목명과 기준연도를 적는다.
      </p>

      <h2 className="mb-2 mt-8 text-[19px] font-bold">편집 원칙</h2>
      <ul className="mt-3 list-disc pl-5 text-[14px] text-ink2">
        <li><strong>순위를 매기지 않는다.</strong> 상위·하위 목록을 만들지 않고, 사용자가 고른 학교끼리의 비교만 제공한다</li>
        <li><strong>자체 점수나 등급을 만들지 않는다.</strong> 공시 지표의 정의를 그대로 쓴다</li>
        <li><strong>모든 숫자에 출처와 기준연도를 붙인다.</strong> 계산한 값은 산식을 함께 적는다</li>
        <li><strong>단정적 가치 판단을 쓰지 않는다.</strong> 사실과 비교 기준만 제시한다</li>
        <li><strong>결측을 0으로 채우지 않는다.</strong> 사유를 구분해 표시한다</li>
      </ul>

      <h2 className="mb-2 mt-8 text-[19px] font-bold">알려진 한계</h2>
      <ul className="mt-3 list-disc pl-5 text-[14px] text-ink2">
        <li>본교·분교·캠퍼스가 각각 다른 학교아이디를 갖지만, 재정 지표는 본교에만 공시된다. 캠퍼스 단독 페이지는 만들지 않는다</li>
        <li>원본 공시 자료에 포함되지 않은 학교는 이 사이트에도 없다</li>
        <li>학교 이름이 바뀐 경우가 있다. 검색은 옛 이름도 일부 지원한다</li>
      </ul>

      <h2 className="mb-2 mt-8 text-[19px] font-bold">오류를 발견했다면</h2>
      <p className="text-[14px] text-ink2">
        화면의 수치가 원본 공시와 다르다면 원본 쪽을 우선해 주기 바란다. 이 사이트는 공시된 값을 옮길 뿐
        해석이나 평가를 덧붙이지 않는다.
      </p>
    </div>
  );
}
