import type { Metadata } from 'next';
import { BASE_YEAR, SITE_URL } from '@/lib/data';

export const metadata: Metadata = {
  title: '지표 정의 — 각 숫자가 무엇을 뜻하는가',
  description: `등록금 영수증이 쓰는 지표의 정의와 산식. 공시 지표와 직접 계산한 값을 구분해 밝힌다. 대학정보공시 ${BASE_YEAR} 기준.`,
  alternates: { canonical: `${SITE_URL}/method/` },
};

export default function Method() {
  return (
    <div className="mx-auto max-w-[760px] px-5 py-12">
      <h1 className="mb-3 text-[28px] font-bold tracking-tight">지표 정의</h1>
      <p className="mb-8 text-[15px] text-ink2">
        이 사이트가 쓰는 숫자는 두 종류다. 대학정보공시에 그대로 실린 값과, 우리가 그 값으로 계산한 값.
        어느 쪽인지 화면에서 항상 구분해 표시한다.
      </p>

      <h2 className="mb-2 mt-8 text-[19px] font-bold">공시 지표 — 그대로 옮긴 값</h2>
      <dl className="text-[14px]">
        <dt className="mt-4 font-bold">평균등록금</dt>
        <dd className="text-ink2">대학정보공시 지표 38. 학부 기준 연평균 등록금. 원 단위.</dd>
        <dt className="mt-4 font-bold">학생 1인당 교육비</dt>
        <dd className="text-ink2">학교가 학생 한 명에게 지출한 연간 교육비. 원 단위. 회계 체계가 다른 일부 기관은 공시 대상이 아니다.</dd>
        <dt className="mt-4 font-bold">재학생 1인당 장학금</dt>
        <dd className="text-ink2">지표 45. 교내외 장학금을 합산해 재학생 수로 나눈 값. 원 단위.</dd>
        <dt className="mt-4 font-bold">학자금대출 이용학생비율(전체)</dt>
        <dd className="text-ink2">지표 46. 전체 재학생 중 학자금대출을 이용한 학생의 비율.</dd>
      </dl>

      <h2 className="mb-2 mt-10 text-[19px] font-bold">계산값 — 우리가 만든 값</h2>
      <p className="text-[14px] text-ink2">
        <strong>교육비 환원율 = 학생 1인당 교육비 ÷ 평균등록금 × 100</strong>
      </p>
      <p className="mt-3 text-[14px] text-ink2">
        대학정보공시에는 이 이름의 지표가 없다. 위 두 공시값으로 우리가 계산한다.
        그래서 화면에서 <strong>계산값</strong>이라고 표시하고 산식을 함께 적는다.
        둘 중 하나라도 비어 있으면 계산하지 않고 <strong>산출 불가</strong>로 남긴다.
      </p>
      <p className="mt-3 text-[14px] text-ink2">
        「등록금 100만원당 환산액」은 환원율을 읽기 쉽게 바꾼 표현이다.
        <strong>100만원은 실제 등록금이 아니라 학교끼리 비교하기 위한 기준 단위</strong>다.
      </p>

      <h2 className="mb-2 mt-10 text-[19px] font-bold">환원율을 읽을 때 주의할 것</h2>
      <p className="text-[14px] text-ink2">
        환원율은 대부분의 학교에서 100%를 크게 넘는다. 등록금 외에 국고 지원, 법인전입금, 기부금, 연구비가
        교육비 재원으로 들어오기 때문이다. 국공립대와 연구중심대는 특히 높게 나온다.
        <strong>이 값이 높다고 좋은 학교, 낮다고 나쁜 학교가 아니다.</strong> 재정 구조의 차이를 보여줄 뿐이다.
      </p>

      <h2 className="mb-2 mt-10 text-[19px] font-bold">분포에서의 위치 — 어떻게 계산하는가</h2>
      <p className="text-[14px] text-ink2">
        학교 페이지에 「공시한 N개교 가운데 비싼 쪽에서 K번째, 상위 P%」라고 적는다. 계산은 이렇게 한다.
      </p>
      <ul className="mt-3 list-disc pl-5 text-[14px] text-ink2">
        <li>모집단은 <strong>그 지표를 공시한 학교 전체</strong>다. 대학과 전문대학을 나누지 않는다.</li>
        <li>공시하지 않은 학교는 모집단에서 빠진다. <strong>0으로 채워 넣지 않는다.</strong> 그래서 지표마다 N이 다르다.</li>
        <li>K는 값이 큰 쪽부터 센 순번이다. 같은 값은 같은 순번으로 본다.</li>
        <li>P는 K를 N으로 나눈 백분율을 반올림한 값이다. 소수점 아래는 버린다.</li>
        <li>히스토그램의 가로축은 최솟값에서 <strong>상위 5% 지점</strong>까지를 24구간으로 나눈다.
            그 위의 극단값은 마지막 구간에 몰아넣고, 축에 「이상」과 실제 최댓값을 함께 적는다.
            소수의 극단값 때문에 나머지 학교가 한 칸에 뭉개지는 것을 막기 위해서다.</li>
      </ul>
      <p className="mt-3 text-[14px] text-ink2">
        학제를 나누지 않기 때문에 분포가 봉우리 여러 개로 갈라져 보일 수 있다.
        대학과 전문대학은 수업연한과 재정 구조가 다르고, 국공립과 사립도 등록금 수준이 다르다.
        <strong> 이 위치는 크기의 위치일 뿐 우열의 위치가 아니다.</strong> 그래서 상위 학교 목록을 만들지 않는다.
        순위표를 만드는 기능은 코드에 두지 않았다.
      </p>

      <h2 className="mb-2 mt-10 text-[19px] font-bold">결측을 다루는 방식</h2>
      <p className="text-[14px] text-ink2">
        빈 값을 0으로 채우지 않는다. 없는 사실을 만드는 일이기 때문이다. 세 가지로 구분한다.
      </p>
      <ul className="mt-3 list-disc pl-5 text-[14px] text-ink2">
        <li><strong>미공시</strong> — 공시 대상이지만 해당 연도 자료에 값이 없다</li>
        <li><strong>해당 없음</strong> — 애초에 그 항목의 공시 대상이 아니다</li>
        <li><strong>산출 불가</strong> — 계산에 쓰이는 공시값이 비어 있다</li>
      </ul>
    </div>
  );
}
