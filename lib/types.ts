// 파이프라인(scripts/normalize.mjs)이 내보내는 구조와 1:1로 맞춘다.
export type MetricStatus = 'ok' | '미공시' | '해당 없음';

export type Metric = {
  value: number | null;
  unit: 'KRW' | 'PERCENT';
  label: string;
  indctId?: string | null;
  baseYear: string;
  status: MetricStatus;
  reason?: string;
};

export type ReturnRate = {
  value: number | null;
  derived: true;
  unit?: 'PERCENT';
  formula: string;
  basedOn?: string[];
  baseYear?: string;
  status: 'ok' | '산출 불가';
  reason?: string;
};

export type University = {
  id: string;
  name: string;
  fullName: string;
  campus: string;
  estb: string;
  estbGroup: '국공립' | '사립';
  div: string;
  kind: string;
  region: string;
  regionCd: string;
  baseYear: string;
  /** 옛 이름·약칭. 검색에서만 쓴다. */
  aliases?: string[];
  /** 폐교 등으로 페이지를 만들지 않는 사유 */
  closed?: boolean;
  metrics: {
    tuition: Metric;
    eduExpense: Metric;
    scholarship: Metric;
    loanRatio: Metric;
  };
  returnRate: ReturnRate;
  completeness: 'full' | 'partial' | 'none';
  missing: string[];
  publishable: boolean;
  mergeInto: string | null;
};

export type MetricKey = keyof University['metrics'];
