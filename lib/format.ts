import type { Metric } from './types';

/** 원 단위를 만원으로. 반올림 기준을 한곳에 모아 화면마다 값이 어긋나는 일을 막는다. */
export const manwon = (won: number) => Math.round(won / 10000);

export const fmtManwon = (won: number) => `${manwon(won).toLocaleString('ko-KR')}만원`;
export const fmtWon = (won: number) => `${Math.round(won).toLocaleString('ko-KR')}원`;
export const fmtPercent = (v: number) => `${v.toFixed(1)}%`;

export function fmtMetric(m: Metric): string {
  if (m.value == null) return m.status;
  return m.unit === 'PERCENT' ? fmtPercent(m.value) : fmtManwon(m.value);
}

/** 등록금 100만원을 기준 단위로 삼았을 때의 환산액. 실제 등록금이 아님을 화면에 반드시 적는다. */
export const per1M = (returnRatePercent: number) => Math.round(returnRatePercent * 10000);

export function fmtPer1M(returnRatePercent: number) {
  const won = per1M(returnRatePercent);
  const man = Math.round(won / 10000);
  return `${man.toLocaleString('ko-KR')}만원`;
}
