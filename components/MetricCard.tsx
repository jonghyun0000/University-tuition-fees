import type { Metric } from '@/lib/types';
import { fmtMetric } from '@/lib/format';

export function MetricCard({ metric, derived }: { metric: Metric; derived?: boolean }) {
  const missing = metric.value == null;
  return (
    <div className="rounded-md border border-line bg-surface p-4">
      <p className="mb-2 text-[12.5px] font-bold text-ink2">
        {metric.label}
        {derived && (
          <span className="ml-1.5 rounded-sm bg-[#faf1e0] px-1.5 py-px align-[2px] text-[10.5px] font-bold text-[#8a5a12]">
            계산값
          </span>
        )}
      </p>
      <p className={missing ? 'text-[16px] font-bold text-muted' : 'text-[22px] font-bold leading-tight tracking-tight'}>
        {fmtMetric(metric)}
      </p>
      <p className="mt-2.5 text-[11.5px] leading-snug text-muted">
        {missing ? metric.reason : `${metric.label} · ${metric.baseYear}년 공시`}
      </p>
    </div>
  );
}

/** 계산값(환원율)은 공시 지표가 아니므로 산식을 반드시 함께 노출한다. */
export function DerivedCard({
  label, value, formula, status, reason, baseYear,
}: { label: string; value: number | null; formula: string; status: string; reason?: string; baseYear?: string }) {
  const missing = value == null;
  return (
    <div className="rounded-md border border-line bg-surface p-4">
      <p className="mb-2 text-[12.5px] font-bold text-ink2">
        {label}
        <span className="ml-1.5 rounded-sm bg-[#faf1e0] px-1.5 py-px align-[2px] text-[10.5px] font-bold text-[#8a5a12]">
          계산값
        </span>
      </p>
      <p className={missing ? 'text-[16px] font-bold text-muted' : 'text-[22px] font-bold leading-tight tracking-tight'}>
        {missing ? status : `${value.toFixed(1)}%`}
      </p>
      <p className="mt-2.5 text-[11.5px] leading-snug text-muted">
        {missing ? reason : `${formula}. 공시 지표가 아니라 ${baseYear}년 공시값 두 개로 산출했다`}
      </p>
    </div>
  );
}
