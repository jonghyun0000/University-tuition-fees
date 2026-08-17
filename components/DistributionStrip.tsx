import type { Distribution } from '@/lib/stats';
import { fmtManwon, fmtPercent } from '@/lib/format';

/**
 * 분포에서의 위치. 순위표가 아니라 히스토그램 위의 한 점이다.
 * 단일 시리즈라 범례가 필요 없고, 이 학교가 속한 구간만 색으로 구분한다.
 *
 * 축 라벨과 '이 학교' 표시는 SVG 밖 HTML로 뺐다. SVG 안에 두면 viewBox가
 * 모바일 폭으로 줄어들 때 글자까지 같이 줄어 읽을 수 없다.
 */

const VB_W = 780, VB_H = 64, GAP = 2;

export default function DistributionStrip({ dist }: { dist: Distribution }) {
  const fmt = (v: number) => (dist.unit === 'KRW' ? fmtManwon(v) : fmtPercent(v));
  const fmtAxis = (v: number) => (dist.unit === 'KRW' ? fmtManwon(v) : `${Math.round(v)}%`);

  const n = dist.bins.length;
  const maxCount = Math.max(...dist.bins.map(b => b.count));
  const bw = (VB_W - GAP * (n - 1)) / n;

  // 막대 중앙의 가로 위치를 퍼센트로. HTML 라벨을 같은 자리에 얹는다.
  const centerPct = ((dist.binIndex * (bw + GAP) + bw / 2) / VB_W) * 100;
  const atStart = centerPct < 9, atEnd = centerPct > 91;

  return (
    <div className="border-t border-line py-5 first:border-t-0 first:pt-0">
      <p className="text-[14.5px] leading-relaxed">
        <span className="font-bold">{dist.label}</span>{' '}
        <strong className="text-accent">{fmt(dist.value)}</strong>
        {' — '}
        공시한 {dist.total}개교 가운데 {dist.direction} 쪽에서{' '}
        <strong>{dist.rank}번째, 상위 {dist.topPercent}%</strong>
        <span className="text-muted"> · 중앙값 {fmt(dist.median)}</span>
      </p>

      <div className="mt-3">
        <div className="relative h-[17px]">
          <span
            className="absolute top-0 whitespace-nowrap text-[11.5px] font-bold leading-none text-accent"
            style={
              atStart ? { left: 0 }
              : atEnd ? { right: 0 }
              : { left: `${centerPct}%`, transform: 'translateX(-50%)' }
            }
          >
            이 학교
          </span>
        </div>

        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height={VB_H}
             preserveAspectRatio="none" role="img"
             aria-label={`${dist.label} 분포. 공시한 ${dist.total}개교 가운데 ${dist.direction} 쪽에서 ${dist.rank}번째, 상위 ${dist.topPercent}퍼센트. 중앙값 ${fmt(dist.median)}.`}>
          {dist.bins.map((b, i) => {
            const h = maxCount ? (b.count / maxCount) * (VB_H - 3) : 0;
            return (
              <rect key={i} x={i * (bw + GAP)} y={VB_H - Math.max(h, 2)} width={bw}
                    height={Math.max(h, 2)} fill={i === dist.binIndex ? '#2166bd' : '#e1e0d9'} />
            );
          })}
        </svg>

        <div className="mt-1 flex justify-between border-t border-axis pt-1 text-[11.5px] text-muted">
          <span>{fmtAxis(dist.min)}</span>
          <span>
            {fmtAxis(dist.bins[n - 1].to)}
            {dist.capped ? ` 이상 (최대 ${fmtAxis(dist.max)})` : ''}
          </span>
        </div>
      </div>

      <p className="mt-2.5 text-[12.5px] text-muted">{dist.caveat}</p>
    </div>
  );
}
