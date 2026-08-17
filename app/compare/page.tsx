import type { Metadata } from 'next';
import ComparePicker from '@/components/ComparePicker';
import { searchIndex, universities, BASE_YEAR, SITE_URL } from '@/lib/data';

export const metadata: Metadata = {
  title: `대학 등록금 비교하기 — 두 학교를 나란히 (${BASE_YEAR})`,
  description: `학교 두 곳을 골라 평균등록금·학생 1인당 교육비·장학금을 나란히 놓고 봅니다. 대학정보공시 ${BASE_YEAR} 기준. 순위를 매기지 않습니다.`,
  alternates: { canonical: `${SITE_URL}/compare/` },
};

export default function ComparePickerPage() {
  return (
    <div className="mx-auto max-w-[880px] px-5 py-12">
      <h1 className="mb-3 text-[clamp(24px,4vw,32px)] font-bold tracking-tight">비교할 학교 고르기</h1>
      <p className="mb-8 text-[15px] text-ink2">
        학교 두 곳을 고르면 평균등록금, 학생 1인당 교육비, 장학금, 학자금대출 이용 비율을 나란히 놓는다.
        우열을 매기지 않고 공시된 값만 병치한다.
      </p>

      <ComparePicker index={searchIndex()} />

      <p className="mt-10 text-[12.5px] text-muted">
        {BASE_YEAR}년 대학정보공시 기준 {universities.length}개교를 고를 수 있다.
        초성 검색과 옛 이름 검색을 지원한다.
      </p>
    </div>
  );
}
