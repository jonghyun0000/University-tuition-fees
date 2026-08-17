import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getUniversity, parseComparePair, popularComparePairs, METRIC_ORDER, SITE_URL,
} from '@/lib/data';
import { fmtMetric } from '@/lib/format';
import type { University, MetricKey } from '@/lib/types';

type Params = { params: Promise<{ pair: string }> };

// 전 조합은 5만 개가 넘는다. 같은 지역 안의 인기 조합만 미리 만든다.
export function generateStaticParams() {
  return popularComparePairs().map(([a, b]) => ({ pair: `${a}-vs-${b}` }));
}

function load(pair: string): [University, University] | null {
  const ids = parseComparePair(pair);
  if (!ids) return null;
  const a = getUniversity(ids[0]), b = getUniversity(ids[1]);
  return a && b && a.id !== b.id ? [a, b] : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { pair } = await params;
  const found = load(pair);
  if (!found) return {};
  const [a, b] = found;
  return {
    title: `${a.name} · ${b.name} 등록금 비교 (${a.baseYear})`,
    description: `${a.name}과 ${b.name}의 평균등록금·학생 1인당 교육비·장학금을 대학정보공시 ${a.baseYear} 기준으로 나란히 놓았습니다. 우열을 매기지 않습니다.`,
    alternates: { canonical: `${SITE_URL}/compare/${pair}/` },
  };
}

export default async function ComparePage({ params }: Params) {
  const { pair } = await params;
  const found = load(pair);
  if (!found) notFound();
  const [a, b] = found;

  const rows: Array<{ label: string; note: string; a: string; b: string; aMissing: boolean; bMissing: boolean }> = [
    ...METRIC_ORDER.map((k: MetricKey) => ({
      label: a.metrics[k].label,
      note: `${a.metrics[k].label} · ${a.baseYear}`,
      a: fmtMetric(a.metrics[k]), b: fmtMetric(b.metrics[k]),
      aMissing: a.metrics[k].value == null, bMissing: b.metrics[k].value == null,
    })),
    {
      label: '교육비 환원율',
      note: `${a.returnRate.formula} · 직접 계산`,
      a: a.returnRate.value != null ? `${a.returnRate.value.toFixed(1)}%` : a.returnRate.status,
      b: b.returnRate.value != null ? `${b.returnRate.value.toFixed(1)}%` : b.returnRate.status,
      aMissing: a.returnRate.value == null, bMissing: b.returnRate.value == null,
    },
  ];

  return (
    <div className="mx-auto max-w-[880px] px-5">
      <div className="pt-10">
        <h1 className="mb-2 text-[clamp(22px,3.6vw,30px)] font-bold tracking-tight">{a.name} · {b.name}</h1>
        <p className="text-[12.5px] text-muted">대학정보공시 {a.baseYear}년 기준 · 두 학교의 공시값을 나란히 놓는다</p>
      </div>

      <section className="pt-5 pb-11">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[a, b].map(u => (
            <div key={u.id} className="rounded-md border border-line bg-surface p-4">
              <h2 className="mb-1.5 text-[17px] font-bold">
                <a className="hover:text-accent" href={`/univ/${u.id}/`}>{u.name}</a>
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {[u.estb, u.region, u.div].map(c => (
                  <span key={c} className="rounded-sm bg-[#f0efec] px-2.5 py-0.5 text-[12.5px] text-ink2">{c}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <table className="mt-3.5 w-full border-collapse bg-surface text-[14px]">
          <thead>
            <tr>
              <th className="w-[34%] border border-line bg-[#f4f3f1] px-3.5 py-3 text-left text-[12.5px] text-ink2">지표</th>
              <th className="w-[33%] border border-line bg-[#f4f3f1] px-3.5 py-3 text-left text-[12.5px] text-ink2">{a.name}</th>
              <th className="w-[33%] border border-line bg-[#f4f3f1] px-3.5 py-3 text-left text-[12.5px] text-ink2">{b.name}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.label}>
                <td className="border border-line px-3.5 py-3 align-top">
                  {r.label}
                  <span className="mt-0.5 block text-[11.5px] font-normal text-muted">{r.note}</span>
                </td>
                <td className={`border border-line px-3.5 py-3 text-right align-top tabular-nums ${r.aMissing ? 'text-[13px] text-muted' : 'font-bold'}`}>{r.a}</td>
                <td className={`border border-line px-3.5 py-3 text-right align-top tabular-nums ${r.bMissing ? 'text-[13px] text-muted' : 'font-bold'}`}>{r.b}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-3.5 rounded-md border border-line border-l-[3px] border-l-axis bg-surface px-4 py-3.5 text-[12.5px] text-ink2">
          이 표는 우열을 가리지 않는다. 두 학교는 설립 구분과 소재지가 달라 등록금과 재정 구조의 출발점이 다르다.
          값이 비어 있는 칸은 세 가지로 나뉜다. <strong>미공시</strong>는 공시 대상이지만 값이 올라오지 않았다는 뜻이고,
          <strong>해당 없음</strong>은 애초에 공시 대상이 아니라는 뜻이며,
          <strong>산출 불가</strong>는 계산에 쓰이는 공시값이 비어 있다는 뜻이다. 어느 쪽도 0으로 채우지 않는다.
        </p>
      </section>
    </div>
  );
}
