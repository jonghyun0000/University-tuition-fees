# 등록금 영수증 — 데이터 파이프라인 (Phase 1)

대학알리미 오픈API에서 전국 대학 재정 지표를 받아 정적 JSON으로 떨구는 스크립트다.
DB를 쓰지 않는다. 연 4회 갱신되는 공시 데이터라 빌드타임 생성이 맞다.

## 실행

```bash
# .env.local 에 키를 넣는다. 커밋하지 않는다.
echo 'DATA_GO_KR_KEY=<발급받은 Encoding 인증키>' > .env.local

# 전체 파이프라인
node --env-file=.env.local scripts/run-all.mjs

# 단계별 실행
node --env-file=.env.local scripts/fetch-schools.mjs    # 학교 마스터
node --env-file=.env.local scripts/fetch-finances.mjs   # 재정 지표
node --env-file=.env.local scripts/normalize.mjs        # 정규화
node --env-file=.env.local scripts/validate.mjs         # 검증
```

Node 18 이상. 외부 의존 패키지 없음.

## 파일 구성

| 파일 | 역할 |
|---|---|
| `scripts/config.mjs` | 상수 한곳 모음. 엔드포인트, 결측 사유, 트래픽 한도 |
| `scripts/xml.mjs` | 최소 XML 파서. 응답이 평평한 `<item>` 반복이라 정규식으로 충분 |
| `scripts/api.mjs` | 호출·재시도·동시성 제어 |
| `scripts/fetch-schools.mjs` | 학교 마스터 수집 — 모든 조인의 기준 |
| `scripts/fetch-finances.mjs` | 학교별 재정 지표 수집 |
| `scripts/normalize.mjs` | 정규화. 결측 사유 구분과 환원율 계산 |
| `scripts/validate.mjs` | 검증 리포트 출력 |
| `scripts/run-all.mjs` | 전체 실행 |

산출물은 `data/universities.json`, `data/univ/{schlId}.json`, `data/validation-report.txt`.

## 이 API를 다룰 때 반드시 알아야 할 것

**`svyYr`이 사실상 필수다.** 빼면 `resultCode 00` 과 `totalCount 0` 이 함께 온다.
에러가 아니라 조용한 빈 응답이라 원인을 찾기 어렵다. 대학비교통계는 `svyYr` + `schlId` 가 둘 다 있어야 한다.

**일일 트래픽은 엔드포인트마다 각각 1,000건이다.** 합산 한도가 아니다.
학교 377개 × 엔드포인트당 1회이므로 개발계정으로 하루에 전량 수집된다.

**학교코드는 이 API의 `schlId` 하나만 쓴다.** 대학재정알리미의 `schCd`와 체계가 다르다.
학교명으로 조인하면 안 된다 — 본교·분교·캠퍼스가 각각 다른 `schlId`를 갖는다.

**응답 단위가 코드표와 다르다.** 지표 코드표의 `rmk`는 "천원"이라 되어 있으나
실제 `indctVal1`은 원 단위다. 검증에서 반드시 확인할 것.

## 설계 원칙

**결측을 0으로 채우지 않는다.** 결측 사유를 세 가지로 구분한다.

- `미공시` — 공시 대상이지만 값이 올라오지 않았다
- `해당 없음` — 애초에 공시 대상이 아니다 (과학기술원의 교육비 등)
- `산출 불가` — 계산에 쓰이는 공시값이 비어 있다 (환원율 등)

하나로 뭉치면 회계 체계가 다른 학교가 부당하게 깎인다.

**환원율은 우리가 계산하는 유일한 값이다.** 공시 지표에 없다.
`derived: true` 와 `formula` 를 함께 저장하고, 화면에도 계산값임을 표시한다.

**캠퍼스 레코드는 페이지를 만들지 않는다.** 재정 지표가 본교에만 공시되므로
제2·3·4캠퍼스 레코드는 전부 빈 값이다. `publishable: false` 와 `mergeInto` 로 표시한다.

## 남은 확인 사항

- 교육비 지표 ID가 학교마다 `39` 또는 `40`으로 갈린다. 학제·설립구분과 무관하다. 원인 미확인
- 코드표에 `39`가 없다. 폐기된 코드일 가능성
- 지역별통계의 학교수(161)가 학교 마스터의 대학 수(233)와 맞지 않는다. `schlDivCd` 의미 확인 필요
- 서울대학교 교육비 미공시 사유 미확인 (과학기술원 4곳은 회계 체계 차이로 설명됨)
