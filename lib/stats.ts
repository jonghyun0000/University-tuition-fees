import { universities } from './data';
import type { University } from './types';

/**
 * 분포 위치 계산.
 *
 * 두 가지를 지킨다.
 * 1) 학제가 다르면 같이 줄 세우지 않는다. 대학과 전문대학은 등록금·교육비 구조가 다르다.
 * 2) 순위표를 만들지 않는다. 여기서 내보내는 것은 '이 학교가 분포의 어디쯤인가'이지
 *    상위 학교 목록이 아니다. 목록을 만드는 함수는 두지 않는다.
 */

export type Distribution = {
  /** 비교 모집단 크기 */
  total: number;
  /** 값이 큰 쪽부터 세었을 때의 백분위. 1이면 가장 큼 */
  topPercent: number;
  median: number;
  min: number;
  max: number;
  /** 히스토그램용 구간별 개수 */
  bins: { from: number; to: number; count: number }[];
  /** 이 학교 값이 속한 구간 index */
  binIndex: number;
  /** 비교 모집단 설명 (예: "전국 대학") */
  scope: string;
};

const BIN_COUNT = 24;

/** 환원율 분포. 이 사이트의 메인 숫자에만 붙인다. */
export function returnRateDistribution(u: University): Distribution | null {
  const value = u.returnRate.value;
  if (value == null) return null;

  const peers = universities
    .filter(x => x.div === u.div && x.returnRate.value != null)
    .map(x => x.returnRate.value as number);
  if (peers.length < 10) return null;

  return build(value, peers, `전국 ${u.div}`);
}

/** 지표별 중앙값. 카드에 한 줄로 붙인다. */
export function medianOf(u: University, key: keyof University['metrics']): number | null {
  const peers = universities
    .filter(x => x.div === u.div && x.metrics[key].value != null)
    .map(x => x.metrics[key].value as number);
  if (peers.length < 10) return null;
  return quantile(peers.slice().sort((a, b) => a - b), 0.5);
}

function build(value: number, peers: number[], scope: string): Distribution {
  const sorted = peers.slice().sort((a, b) => a - b);
  const total = sorted.length;

  // 값이 큰 쪽부터 몇 번째인가. 동점은 같은 순위로 본다.
  const rankFromTop = sorted.filter(v => v > value).length + 1;
  const topPercent = Math.max(1, Math.round((rankFromTop / total) * 100));

  const min = sorted[0];
  const max = sorted[total - 1];

  // 극단값 때문에 구간이 뭉개진다. 상위 5%는 마지막 구간에 몰아넣는다.
  const cap = quantile(sorted, 0.95);
  const lo = min;
  const hi = Math.max(cap, value === max ? cap : value);
  const step = (hi - lo) / BIN_COUNT || 1;

  const bins = Array.from({ length: BIN_COUNT }, (_, i) => ({
    from: lo + step * i,
    to: lo + step * (i + 1),
    count: 0,
  }));
  for (const v of sorted) {
    const i = Math.min(BIN_COUNT - 1, Math.max(0, Math.floor((v - lo) / step)));
    bins[i].count++;
  }
  const binIndex = Math.min(BIN_COUNT - 1, Math.max(0, Math.floor((value - lo) / step)));

  return { total, topPercent, median: quantile(sorted, 0.5), min, max, bins, binIndex, scope };
}

function quantile(sorted: number[], p: number) {
  if (sorted.length === 0) return 0;
  const i = (sorted.length - 1) * p;
  const lo = Math.floor(i), hi = Math.ceil(i);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}
