import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { universities, getUniversity, relatedOf, comparePath, SITE_URL } from '@/lib/data';
import { MetricCard, DerivedCard } from '@/components/MetricCard';
import AmountBars from '@/components/AmountBars';
import DistributionStrip from '@/components/DistributionStrip';
import { returnRateDistribution } from '@/lib/stats';
import { fmtManwon, fmtPer1M } from '@/lib/format';

type Params = { params: Promise<{ id: string }> };

// 전 학교 페이지를 빌드타임에 만든다. 개별 URL로 존재해야 검색에 잡힌다.
export function generateStaticParams() {
  return universities.map(u => ({ id: u.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const u = getUniversity(id);
  if (!u) return {};

  const rr = u.returnRate.value;
  const description = rr != null
    ? `${u.name}의 등록금 100만원당 교육비로 환원된 금액은 ${fmtPer1M(rr)}입니다. 대학정보공시 ${u.baseYear} 기준.`
    : `${u.name}의 평균등록금과 장학금을 대학정보공시 ${u.baseYear} 기준으로 정리했습니다. 교육비는 ${u.metrics.eduExpense.status}입니다.`;

  return {
    title: `${u.name} 등록금 사용 내역 — 교육비 환원율·장학금 (${u.baseYear})`,
    description,
    alternates: { canonical: `${SITE_URL}/univ/${u.id}/` },
    openGraph: {
      type: 'article',
      title: `${u.name} 등록금 사용 내역 (${u.baseYear})`,
      description,
      url: `${SITE_URL}/univ/${u.id}/`,
    },
  };
}

export default async function UnivPage({ params }: Params) {
  const { id } = await params;
  const u = getUniversity(id);
  if (!u) notFound();

  const { tuition, eduExpense, scholarship, loanRatio } = u.metrics;
  const rr = u.returnRate.value;
  const related = relatedOf(u);
  const dist = returnRateDistribution(u);

  const bars = [
    tuition.value != null && { label: tuition.label, amount: tuition.value, baseYear: tuition.baseYear },
    scholarship.value != null && { label: scholarship.label, amount: scholarship.value, baseYear: scholarship.baseYear },
    eduExpense.value != null && { label: eduExpense.label, amount: eduExpense.value, baseYear: eduExpense.baseYear },
  ].filter(Boolean) as { label: string; amount: number; baseYear: string }[];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${u.name} 등록금 사용 내역 (${u.baseYear})`,
    description: `${u.name}의 대학정보공시 ${u.baseYear}년 재정 지표`,
    url: `${SITE_URL}/univ/${u.id}/`,
    creator: { '@type': 'Organization', name: '한국대학교육협의회 대학정보공시센터' },
    temporalCoverage: u.baseYear,
    license: 'https://www.kogl.or.kr/info/licenseType1.do',
    isBasedOn: 'https://www.academyinfo.go.kr',
  };

  return (
    <div className="mx-auto max-w-[880px] px-5">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="pt-10">
        <h1 className="mb-2 text-[clamp(24px,4vw,32px)] font-bold tracking-tight">{u.name}</h1>
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          {[u.estb, u.region, u.div, u.campus].map(c => (
            <span key={c} className="rounded-sm bg-[#f0efec] px-2.5 py-0.5 text-[12.5px] text-ink2">{c}</span>
          ))}
        </div>
        <p className="text-[12.5px] text-muted">대학정보공시 {u.baseYear}년 기준 · 학교아이디 {u.id}</p>
      </div>

      <section className="mt-6 rounded-md border border-line bg-surface px-7 py-7">
        {tuition.value != null && eduExpense.value != null ? (
          <>
            <p className="text-[clamp(19px,3.2vw,25px)] font-bold leading-snug tracking-tight">
              한 해 등록금 <span className="text-accent">{fmtManwon(tuition.value)}</span>을 냈고,<br />
              학교는 학생 한 명에게 <span className="text-accent">{fmtManwon(eduExpense.value)}</span>을 썼습니다.
            </p>
            <p className="mt-4 text-[14.5px] text-ink2">
              등록금 100만원당 <strong>{fmtPer1M(rr!)}</strong>이 교육비로 쓰인 셈이다.
              100만원은 실제 등록금이 아니라 학교끼리 비교하기 위한 기준 단위다.
            </p>
            {dist && (
              <p className="mt-2 text-[14.5px] text-ink2">
                이 값은 {dist.scope} {dist.total}개교 가운데{' '}
                <strong>큰 쪽에서 상위 {dist.topPercent}%</strong>에 해당한다.
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-[clamp(18px,3vw,23px)] font-bold leading-snug tracking-tight">
              {u.name}은 {eduExpense.status === '해당 없음' ? '학생 1인당 교육비의 공시 대상이 아니다.' : '해당 연도 교육비가 공시되지 않았다.'}
            </p>
            <p className="mt-4 text-[14.5px] text-ink2">
              그래서 등록금 대비 환원 금액을 계산할 수 없다. 아래에는 공시된 항목만 표시한다.
            </p>
          </>
        )}
        <p className="mt-3.5 border-t border-line pt-3.5 text-[12.5px] text-muted">
          {rr != null
            ? (u.estbGroup === '국공립'
                ? '국공립대학은 국고 지원이 등록금 외 재원으로 들어오기 때문에 교육비가 등록금을 크게 웃도는 경우가 많다. 이 수치만으로 학교 간 우열을 판단할 수 없다.'
                : '사립대학은 법인전입금·기부금 등이 등록금 외 재원으로 들어온다. 이 수치만으로 학교 간 우열을 판단할 수 없다.')
            : '값이 없는 항목은 0으로 채우지 않는다. 공시되지 않았다는 사실을 그대로 표시한다.'}
        </p>
      </section>

      <section className="py-11">
        <p className="mb-3.5 text-[12px] font-bold tracking-widest text-muted">지표</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard metric={tuition} />
          <MetricCard metric={eduExpense} />
          <DerivedCard
            label="교육비 환원율" value={rr} formula={u.returnRate.formula}
            status={u.returnRate.status} reason={u.returnRate.reason} baseYear={u.baseYear}
          />
          <MetricCard metric={scholarship} />
          <MetricCard metric={loanRatio} />
        </div>
      </section>

      {dist && rr != null && (
        <section className="pb-11">
          <p className="mb-3.5 text-[12px] font-bold tracking-widest text-muted">전체 분포에서의 위치</p>
          <h2 className="text-[19px] font-bold tracking-tight">{dist.scope} {dist.total}개교 가운데</h2>
          <DistributionStrip dist={dist} value={rr} label="교육비 환원율" />
        </section>
      )}

      {bars.length > 0 && (
        <section className="pb-11">
          <p className="mb-3.5 text-[12px] font-bold tracking-widest text-muted">한눈에 보기</p>
          <h2 className="text-[19px] font-bold tracking-tight">학생 한 명 기준 연간 금액</h2>
          <AmountBars rows={bars} />
        </section>
      )}

      {related.length > 0 && (
        <section className="pb-11">
          <p className="mb-3.5 text-[12px] font-bold tracking-widest text-muted">관련 학교</p>
          <h2 className="mb-3 text-[19px] font-bold tracking-tight">
            {related.every(r => r.region === u.region) ? `${u.region} 소재 학교` : '함께 보면 좋은 학교'}
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {related.map(r => (
              <a key={r.id} href={`/univ/${r.id}/`}
                 className="block rounded-md border border-line bg-surface px-3 py-3 text-[13.5px] hover:border-axis">
                {r.name}
                <span className="mt-0.5 block text-[11.5px] text-muted">{r.region} · {r.estb}</span>
              </a>
            ))}
          </div>
          {related[0] && (
            <p className="mt-3 text-[13px]">
              <a className="text-accent underline underline-offset-2" href={`${comparePath(u.id, related[0].id)}/`}>
                {u.name} · {related[0].name} 나란히 비교하기
              </a>
              <span className="mx-2 text-muted">·</span>
              <a className="text-accent underline underline-offset-2" href="/compare/">
                직접 골라 비교하기
              </a>
            </p>
          )}
        </section>
      )}

      <section className="pb-11">
        <p className="mb-3.5 text-[12px] font-bold tracking-widest text-muted">출처</p>
        <h2 className="mb-3 text-[19px] font-bold tracking-tight">이 페이지의 모든 숫자가 나온 곳</h2>
        <ol className="list-decimal pl-5 text-[13px] text-ink2">
          {[tuition, eduExpense, scholarship, loanRatio].map(m => (
            <li key={m.label} className="mb-2">
              <span className="font-bold text-ink">{m.label}</span> · {m.baseYear}년 공시 — 대학알리미 재정 현황(한국대학교육협의회){' '}
              <a className="text-accent underline underline-offset-2" href="https://www.academyinfo.go.kr" target="_blank" rel="noopener">원본 보기</a>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-[12.5px] text-muted">
          환원율만은 공시 지표가 아니라 위 두 공시값으로 직접 계산한 값이며, 산식을{' '}
          <a className="text-accent underline underline-offset-2" href="/method/">지표 정의</a> 페이지에 적어 두었다.
        </p>
      </section>
    </div>
  );
}
