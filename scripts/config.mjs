// 수집·정규화 공통 설정. 다른 스크립트는 전부 여기서만 상수를 읽는다.

export const SERVICE_KEY = process.env.DATA_GO_KR_KEY;
if (!SERVICE_KEY) {
  console.error('DATA_GO_KR_KEY 환경변수가 없다. .env.local 에 넣고 실행할 것.');
  process.exit(1);
}

export const BASE_YEAR = process.env.BASE_YEAR ?? '2025';

// 대학알리미 오픈API — 두 서비스 모두 별도 활용신청이 필요하다
export const API = {
  basic: 'https://apis.data.go.kr/B340014/BasicInformationService_2',
  finance: 'https://apis.data.go.kr/B340014/FinancesService',
};

// svyYr 없이 호출하면 조용히 totalCount 0 이 온다. 에러가 아니라 빈 응답이라 원인 찾기가 어렵다.
// 대학비교통계는 svyYr + schlId 가 둘 다 있어야 한다.
export const FINANCE_ENDPOINTS = {
  tuition:     { ep: 'getComparisonTuitionCrntSt',                    label: '평균등록금',                  unit: 'KRW' },
  eduExpense:  { ep: 'getComparisonEducationalExpensesReductionCrntSt', label: '학생 1인당 교육비',          unit: 'KRW' },
  scholarship: { ep: 'getComparisonScholarshipBenefitCrntSt',          label: '재학생 1인당 장학금',        unit: 'KRW' },
  loanRatio:   { ep: 'getComparisonEducationExpensesLoanCrntSt',       label: '학자금대출 이용학생비율(전체)', unit: 'PERCENT' },
};

// 일일 트래픽은 상세기능(엔드포인트)마다 각각 1,000건이다. 합산 한도가 아니다.
// 학교 377개 × 엔드포인트당 1회 = 엔드포인트별 377건 → 개발계정으로 하루에 전량 수집 가능.
export const DAILY_QUOTA_PER_ENDPOINT = 1000;

// data.go.kr 게이트웨이는 초당 요청 수를 제한한다. 넘기면 HTTP 429가 나고,
// 계속 때리면 차단이 길어진다. 실측상 초당 3건 근처가 안전하다.
export const CONCURRENCY = Number(process.env.CONCURRENCY ?? 2);
// 요청 시작 사이의 최소 간격(ms). 전역으로 강제된다. 350ms면 초당 약 3건.
export const MIN_INTERVAL_MS = Number(process.env.MIN_INTERVAL_MS ?? 350);
// 429를 맞았을 때 전체가 쉬는 기본 시간(ms). 연속으로 맞으면 배수로 늘어난다.
export const RATE_LIMIT_COOLDOWN_MS = Number(process.env.RATE_LIMIT_COOLDOWN_MS ?? 30000);
// Node fetch의 기본 User-Agent로는 거부되는 경우가 있다.
export const USER_AGENT = 'tuition-receipt/1.0 (+https://github.com/) node-fetch';
// 미해결 비율이 이 값을 넘으면 저장만 하고 중단한다. 오류를 '미공시'로 남기지 않기 위함.
export const ERROR_ABORT_RATIO = 0.05;

export const PATHS = {
  raw: 'data/raw',
  universities: 'data/universities.json',
  univDir: 'data/univ',
};

// 결측 사유는 두 가지로 나눈다. 하나로 뭉치면 국공립대가 부당하게 깎인다.
export const MISSING = {
  NOT_DISCLOSED: '미공시',   // 공시 대상이지만 값이 올라오지 않음
  NOT_APPLICABLE: '해당 없음', // 애초에 공시 대상이 아님 (예: 사립대학만 공시하는 항목)
  NOT_DERIVABLE: '산출 불가',  // 계산에 쓰이는 공시값이 비어 있음
};
