# 등록금 영수증

대학정보공시 자료로 학교별 평균등록금·교육비·장학금·학자금대출 이용 비율을 조회하고, 선택한 두 학교를 비교하는 웹앱입니다. Next.js App Router, React, TypeScript, Tailwind CSS를 사용합니다.

[서비스 열기](https://university-tuition-fees.vercel.app/) · [데이터 파이프라인](PIPELINE.md) · [출시 점검표](docs/launch-checklist.md) · [검색 색인 안내](docs/indexing.md)

## 주요 기능

- 학교명·초성·일부 옛 이름으로 검색
- 학교별 공시 지표, 분포에서의 위치, 관련 학교 조회
- 두 학교의 등록금·교육비·장학금·대출 이용 비율 비교
- 교육비 환원율의 산식과 공시값·계산값 구분
- 결측을 0으로 채우지 않고 미공시·해당 없음·산출 불가로 표시

2026-10-26 저장소 확인 기준, 포함된 JSON은 **2025년 자료 377개 레코드**이며 `publishable`인 **333개**가 학교 페이지 대상입니다. 실시간 조회나 최신 연도 자동 갱신 서비스는 아닙니다. 공시 지표의 크기를 보여주며 대학의 우열이나 교육 품질을 평가하지 않습니다.

## 로컬 실행

Node.js 22와 npm을 기준으로 다음 명령을 사용합니다. 저장소에 정규화된 데이터가 포함되어 있어 웹앱 실행에는 API 키나 데이터베이스가 필요하지 않습니다.

```sh
git clone https://github.com/jonghyun0000/University-tuition-fees.git
cd University-tuition-fees
npm ci
npm run dev
```

브라우저에서 <http://localhost:3000>을 엽니다.

프로덕션 빌드와 로컬 실행:

```sh
npm run build
npm start
```

현재 `package.json`에는 `dev`, `build`, `start` 명령만 있습니다. 별도의 `test`·`lint` 스크립트는 없습니다.

## 환경변수

로컬 설정은 Git에서 제외되는 `.env.local`에 둡니다.

| 변수 | 용도 |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 사이트맵·canonical 등에 사용하는 실제 사이트 주소. 미설정 시 `https://example.com`을 사용하므로 공개 빌드 전에 설정합니다. |
| `GOOGLE_SITE_VERIFICATION` | 선택 사항. 검색엔진 소유 확인용 메타태그 값입니다. |
| `NAVER_SITE_VERIFICATION` | 선택 사항. 네이버 소유 확인용 메타태그 값입니다. |
| `DATA_GO_KR_KEY` | 데이터 수집 스크립트 전용 공공데이터포털 인증키. 웹앱 실행에는 필요하지 않습니다. |
| `BASE_YEAR` | 수집 기준연도. 현재 스크립트 기본값은 `2025`입니다. 웹 화면의 연도는 저장된 JSON에서 읽습니다. |

실제 배포 주소를 사용할 때의 예시:

```dotenv
NEXT_PUBLIC_SITE_URL=https://university-tuition-fees.vercel.app
```

## 데이터 출처와 갱신

수집 코드는 한국대학교육협의회 대학알리미의 `BasicInformationService_2`와 `FinancesService` API를 사용합니다. 원천 자료는 [대학알리미](https://www.academyinfo.go.kr)에서 확인할 수 있습니다. 지표 정의·산식은 앱의 `/method/`, 출처·한계는 `/about/`에 있습니다.

데이터를 갱신할 때만 공공데이터포털에서 두 API의 사용 권한과 인증키를 준비하고 `.env.local`에 `DATA_GO_KR_KEY`와 원하는 `BASE_YEAR`를 설정합니다. 다음 명령은 외부 API를 호출하고 저장소의 데이터 파일을 갱신합니다.

```sh
node --env-file=.env.local scripts/run-all.mjs
```

학교 목록 수집 → 재정 지표 수집 → 정규화 → 검증 순서로 진행합니다. 결과는 `data/universities.json`, `data/univ/`, `data/validation-report.txt`에 저장됩니다. 갱신 결과와 검증 보고서를 확인한 다음 다시 빌드해야 화면에 반영됩니다. 상세 절차와 알려진 데이터 문제는 [PIPELINE.md](PIPELINE.md)를 참고하세요.

현재 설정에서는 정규화·검증 스크립트도 공통 설정을 통해 `DATA_GO_KR_KEY` 존재 여부를 검사합니다. 인증키와 수집 원본 `data/raw/`는 커밋하지 않습니다.

## 저장소 구조

| 경로 | 내용 |
| --- | --- |
| `app/` | 검색 홈, 학교 상세, 비교, 지표 정의·출처 페이지와 사이트맵 |
| `components/` | 검색·비교·분포 표시 UI |
| `lib/` | 데이터 조회, 타입, 지표 포맷·통계 유틸리티 |
| `data/` | 빌드에 사용하는 정규화 JSON과 검증 보고서 |
| `scripts/` | 공공데이터 수집·정규화·검증 |
| `docs/` | 출시 점검표와 검색 색인 등록 안내 |

## 해석 시 주의점

- 학교·분교·캠퍼스는 이름 대신 `schlId`로 구분합니다. 페이지 대상 여부는 정규화 단계의 `publishable` 값으로 결정합니다.
- 교육비 환원율은 `학생 1인당 교육비 ÷ 평균등록금 × 100`으로 계산하며 공식 공시 지표 자체는 아닙니다.
- 원본에 없는 값은 추정하거나 0으로 대체하지 않습니다. 화면과 원본 공시가 다르면 원본을 우선 확인합니다.
- 데이터의 이용허락과 소스 코드의 라이선스는 별개입니다. 이 저장소에는 현재 소스 코드용 `LICENSE` 파일이 없습니다.
