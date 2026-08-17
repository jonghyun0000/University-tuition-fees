import { fmtManwon, fmtWon } from '@/lib/format';

type Row = { label: string; amount: number; baseYear: string };

/**
 * 학생 1인당 연간 금액 비교. 단일 시리즈라 범례가 필요 없고, 값은 막대 옆에 직접 적는다.
 * 외부 차트 라이브러리를 쓰지 않고 인라인 SVG로 그린다 — 번들 크기와 SSR 안정성 때문.
 */
export default function AmountBars({ rows }: { rows: Row[] }) {
  if (rows.length === 0) return null;
  const W = 780, LABEL_W = 160, PAD_R = 110, ROW = 46, BAR_H = 22, R = 4;
  const H = rows.length * ROW + 6;
  const max = Math.max(...rows.map(r => r.amount));
  const track = W - LABEL_W - PAD_R;

  return (
    <div className="mt-3.5 rounded-md border border-line bg-surface p-5">
      <p className="mb-4 text-[12.5px] text-muted">
        세 값 모두 학생 1인당 연간 금액이다. 서로 다른 공시 항목이므로 합계는 의미가 없다.
      </p>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img"
           aria-label={rows.map(r => `${r.label} ${fmtManwon(r.amount)}`).join(', ')}
           className="hidden sm:block">
        {rows.map((r, i) => {
          const y = i * ROW + 10;
          const w = Math.max(3, (r.amount / max) * track);
          return (
            <g key={r.label}>
              <text x={LABEL_W - 12} y={y + 16} textAnchor="end" fontSize="13" fill="#52514e">{r.label}</text>
              <path
                d={`M${LABEL_W},${y} H${LABEL_W + w - R} a${R},${R} 0 0 1 ${R},${R} V${y + BAR_H - R} a${R},${R} 0 0 1 -${R},${R} H${LABEL_W} Z`}
                fill="#2166bd"
              />
              <text x={LABEL_W + w + 10} y={y + 16} fontSize="13" fontWeight="700" fill="#0b0b0b">
                {fmtManwon(r.amount)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* 좁은 화면에서는 막대 안 라벨이 읽히지 않으므로 표가 대신한다 */}
      <table className="mt-4 w-full border-collapse text-[13.5px]">
        <thead>
          <tr className="text-[12px] font-bold text-muted">
            <th className="py-2 text-left">항목</th>
            <th className="py-2 text-right">금액</th>
            <th className="py-2 text-right">기준연도</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.label} className="border-t border-line">
              <td className="py-2.5 text-left">{r.label}</td>
              <td className="py-2.5 text-right tabular-nums">{fmtWon(r.amount)}</td>
              <td className="py-2.5 text-right text-muted">{r.baseYear}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
