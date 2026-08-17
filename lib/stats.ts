import { universities } from './data';
import type { University } from './types';

/**
 * 분포 위치 계산.
 *
 * 지키는 것 두 가지.
 * 1) 순위표를 만들지 않는다. 여기서 내보내는 것은 '이 학교가 분포의 어디쯤인가'이지
 *    상위 학교 목록이 아니다. 목록을 만드는 함수는 두지 않는다.
 * 2) 결측은 모집단에서 빠질 뿐, 0으로 채우지 않는다.
 *
 * 모집단은 학제를 나누지 않는다. 공시한 학교 전체를 한 줄로 놓는다.
 * 대신 학제에 따라 분포가 여러 봉우리로 갈라진다는 사실을 화면에 적는다.
 */

export type MetricKey = 'tuition' | 'eduExpense' | 'scholarship' | 'loanRatio' | 'returnRate';

export type Distribution = {
  key: MetricKey;
  label: string;
  unit: 'KRW' | 'PERCENT';
  /** 이 학교 값 */
  value: number;
  /** 비교 모집단 크기 (해당 지표를 공시한 학교 수) */
  total: number;
  /** 값이 큰 쪽부터 세었을 때 몇 번째인가. 동점은 같은 순위 */
  rank: number;
  /** 백분위. 1이면 가장 큼 */
  topPercent: number;
  median: number;
  min: number;
  max: number;
  bins: { from: number; to: number; count: number }[];
  binIndex: number;
  /** 마지막 구간이 상위 극단값을 몰아넣은 구간인지 */
  capped: boolean;
  /** "비싼" / "많은" / "높은" — 문장에 넣을 방향어 */
  direction: string;
  /** 이 지표를 크기로 줄 세우면 안 되는 이유 */
  caveat: string;
};

const BIN_COUNT = 24;

const META: Record<MetricKey, { label: string; unit: 'KRW' | 'PERCENT'; direction: string; caveat: string }> = {
  tuition: {
    label: '평균등록금', unit: 'KRW', direction: '비싼',
    caveat: '등록금은 의학·예체능 같은 계열 구성과 국공립·사립 여부, 학제에 크게 좌우된다. 비싸다고 나쁜 학교, 싸다고 좋은 학교가 아니다.',
  },
  eduExpense: {
    label: '학생 1인당 교육비', unit: 'KRW', direction: '많은',
    caveat: '교육비에는 국고 지원과 연구비가 함께 들어간다. 국공립대와 연구중심대는 구조적으로 높게 나온다.',
  },
  scholarship: {
    label: '재학생 1인당 장학금', unit: 'KRW', direction: '많은',
    caveat: '장학금에는 국가장학금이 포함된다. 학생 구성에 따라 달라지므로 학교가 쓴 돈만을 뜻하지 않는다.',
  },
  loanRatio: {
    label: '학자금대출 이용학생비율(전체)', unit: 'PERCENT', direction: '높은',
    caveat: '대출 이용 비율은 학생의 경제적 여건과 등록금 수준이 함께 반영된 값이다. 학교의 질을 뜻하지 않는다.',
  },
  returnRate: {
    label: '교육비 환원율', unit: 'PERCENT', direction: '높은',
    caveat: '환원율은 공시 지표가 아니라 교육비를 등록금으로 나눈 계산값이다. 등록금 밖 재원이 많은 학교가 높게 나온다.',
  },
};

const ORDER: MetricKey[] = ['tuition', 'eduExpense', 'returnRate', 'scholarship', 'loanRatio'];

function valueOf(u: University, key: MetricKey): number | null {
  return key === 'returnRate' ? u.returnRate.value : u.metrics[key].value;
}

/** 지표 하나의 분포. 공시값이 없으면 null. */
export function distributionOf(u: University, key: MetricKey): Distribution | null {
  const value = valueOf(u, key);
  if (value == null) return null;

  const peers: number[] = [];
  for (const x of universities) {
    const v = valueOf(x, key);
    if (v != null) peers.push(v);
  }
  if (peers.length < 10) return null;

  return build(u, key, value, peers);
}

/** 학교 페이지에 붙일 분포 전부. 공시된 지표만 순서대로. */
export function distributionsOf(u: University): Distribution[] {
  return ORDER.map(k => distributionOf(u, k)).filter((d): d is Distribution => d !== null);
}

function build(u: University, key: MetricKey, value: number, peers: number[]): Distribution {
  const m = META[key];
  const sorted = peers.slice().sort((a, b) => a - b);
  const total = sorted.length;

  const rank = sorted.filter(v => v > value).length + 1;
  const topPercent = Math.max(1, Math.round((rank / total) * 100));

  const min = sorted[0];
  const max = sorted[total - 1];

  // 극단값 하나 때문에 나머지 구간이 뭉개진다. 상위 5% 지점에서 자르고
  // 그 위는 마지막 구간에 몰아넣는다. 잘랐다는 사실은 capped로 화면에 표시한다.
  const cap = quantile(sorted, 0.95);
  const lo = min;
  const hi = Math.max(cap, min + 1);
  const capped = max > hi;
  const step = (hi - lo) / BIN_COUNT || 1;

  const bins = Array.from({ length: BIN_COUNT }, (_, i) => ({
    from: lo + step * i,
    to: lo + step * (i + 1),
    count: 0,
  }));
  const idx = (v: number) => Math.min(BIN_COUNT - 1, Math.max(0, Math.floor((v - lo) / step)));
  for (const v of sorted) bins[idx(v)].count++;

  return {
    key, label: m.label, unit: m.unit, value,
    total, rank, topPercent,
    median: quantile(sorted, 0.5), min, max,
    bins, binIndex: idx(value), capped,
    direction: m.direction, caveat: m.caveat,
  };
}

function quantile(sorted: number[], p: number) {
  if (sorted.length === 0) return 0;
  const i = (sorted.length - 1) * p;
  const lo = Math.floor(i), hi = Math.ceil(i);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}
