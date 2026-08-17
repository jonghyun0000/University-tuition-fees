import type { Distribution } from '@/lib/stats';

/**
 * 분포에서의 위치. 순위표가 아니라 히스토그램 위의 한 점이다.
 * 단일 시리즈라 범례가 필요 없고, 이 학교의 위치만 색으로 구분한다.
 */
export default function DistributionStrip({
  dist, value, unit = '%', label,
}: { dist: Distribution; value: number; unit?: string; label: string }) {
  const W = 780, H = 112, PAD_B = 26, PAD_T = 18, BAR_GAP = 2;
  const maxCount = Math.max(...dist.bins.map(b => b.count));
  const bw = (W - BAR_GAP * (dist.bins.length - 1)) / dist.bins.length;
  const plotH = H - PAD_B;
  const plotTop = PAD_T;

  const fmt = (v: number) => `${Math.round(v)}${unit}`;

  return (
    <div className="mt-3.5 rounded-md border border-line bg-surface p-5">
      <p className="text-[15px] leading-relaxed">
        {label} <strong className="text-accent">{value.toFixed(1)}{unit}</strong>는{' '}
        {dist.scope} {dist.total}개교 가운데 <strong>값이 큰 쪽에서 상위 {dist.topPercent}%</strong>다.
        중앙값은 {fmt(dist.median)}이다.
      </p>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" className="mt-4"
           aria-label={`${label} 분포. ${dist.total}개교 중 상위 ${dist.topPercent}퍼센트. 중앙값 ${fmt(dist.median)}.`}>
        {dist.bins.map((b, i) => {
          const h = maxCount ? (b.count / maxCount) * (plotH - plotTop) : 0;
          const x = i * (bw + BAR_GAP);
          const isHere = i === dist.binIndex;
          return (
            <rect key={i} x={x} y={plotH - h} width={bw} height={Math.max(h, 1)}
                  rx="2" fill={isHere ? '#2a78d6' : '#e1e0d9'} />
          );
        })}
        <line x1="0" y1={plotH} x2={W} y2={plotH} stroke="#c3c2b7" strokeWidth="1" />
        <text x="0" y={H - 8} fontSize="12" fill="#6b6963">{fmt(dist.min)}</text>
        <text x={W} y={H - 8} fontSize="12" fill="#6b6963" textAnchor="end">
          {fmt(dist.max)}{dist.max > dist.bins[dist.bins.length - 1].to ? ' 이상' : ''}
        </text>
        {(() => {
          const h = maxCount ? (dist.bins[dist.binIndex].count / maxCount) * (plotH - plotTop) : 0;
          const cx = dist.binIndex * (bw + BAR_GAP) + bw / 2;
          const y = Math.max(12, plotH - h - 6);
          const anchor = cx < 60 ? 'start' : cx > W - 60 ? 'end' : 'middle';
          const tx = anchor === 'start' ? 0 : anchor === 'end' ? W : cx;
          return (
            <text x={tx} y={y} fontSize="12" fontWeight="700" fill="#2a78d6" textAnchor={anchor}>
              이 학교
            </text>
          );
        })()}
      </svg>

      <p className="mt-3 border-t border-line pt-3 text-[12.5px] text-muted">
        가로축은 {label}, 세로 막대는 그 구간에 속한 학교 수다. 파란 막대가 이 학교가 속한 구간이다.
        <strong> 값이 크다고 좋은 학교, 작다고 나쁜 학교가 아니다.</strong> 국공립대와 연구중심대는
        국고·연구비가 교육비에 들어와 구조적으로 높게 나온다. 분포에서의 위치를 보여줄 뿐 순위를 매기지 않는다.
      </p>
    </div>
  );
}
