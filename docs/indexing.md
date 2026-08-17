# 색인 등록 절차

이 사이트의 목표는 학교별 페이지가 검색에 잡히는 것이다. 등록하지 않으면 시작되지 않는다.
특히 **네이버는 등록 없이는 수집이 사실상 안 된다.** 구글보다 먼저 하는 편이 낫다.

전제: Vercel 배포가 끝났고 실제 도메인이 붙어 있어야 한다.
`NEXT_PUBLIC_SITE_URL`이 실제 도메인으로 설정돼 있어야 `sitemap.xml`과 canonical이 올바른 주소를 가리킨다.

---

## 0. 먼저 확인할 것

브라우저에서 아래 세 주소가 정상으로 열려야 한다. 하나라도 깨지면 등록해도 소용없다.

```
https://university-tuition-fees.vercel.app/sitemap.xml
https://university-tuition-fees.vercel.app/robots.txt
https://university-tuition-fees.vercel.app/univ/0000003/
```

`sitemap.xml`에 `example.com`이 보이면 환경변수가 안 잡힌 것이다.
Vercel 프로젝트 Settings → Environment Variables에 `NEXT_PUBLIC_SITE_URL`을 넣고 재배포한다.

---

## 1. 네이버 서치어드바이저

수집까지 통상 1~4주 걸린다. 그래서 가장 먼저 한다.

### 1-1. 사이트 등록

1. <https://searchadvisor.naver.com/> 접속, 네이버 계정으로 로그인
2. 우측 상단 **웹마스터 도구** 진입
3. 사이트 주소 입력란에 도메인을 넣고 등록

주의할 점 두 가지다.

- **www 없는 주소로 등록한다.** www 버전과 non-www를 따로 등록하지 않는다
- **https로 등록한다**

### 1-2. 소유확인

두 방법 중 하나를 고른다. 우리는 Next.js를 직접 배포하므로 **둘 다 가능하다.**

**방법 A — HTML 파일 업로드 (권장)**

네이버가 주는 `naverXXXXXXXX.html` 파일을 내려받아 저장소의 `public/` 폴더에 그대로 넣는다.

```
public/naver1234567890abcdef.html
```

커밋하고 배포하면 `https://university-tuition-fees.vercel.app/naver1234567890abcdef.html`로 열린다. 그다음 소유확인 버튼을 누른다.

**방법 B — HTML 태그**

네이버가 주는 메타태그의 content 값만 복사해 Vercel 환경변수에 넣는다. 코드 수정은 필요 없다.

```
NAVER_SITE_VERIFICATION=복사한_content_값
```

재배포하면 `app/layout.tsx`가 `<meta name="naver-site-verification">`을 자동으로 넣는다.

### 1-3. 사이트맵 제출

**요청 → 사이트맵 제출** 메뉴에서 아래를 입력한다.

```
sitemap.xml
```

도메인 뒤에 붙는 경로만 넣으면 된다. 전체 URL을 넣으라고 하면 `https://university-tuition-fees.vercel.app/sitemap.xml`.

### 1-4. 웹페이지 수집 요청

**요청 → 웹페이지 수집**에서 주요 페이지를 직접 넣는다. 로봇의 방문을 기다리는 시간을 줄여준다.
초기에는 다음 정도를 넣는다.

```
https://university-tuition-fees.vercel.app/
https://university-tuition-fees.vercel.app/method/
https://university-tuition-fees.vercel.app/about/
```

학교 페이지는 수백 개라 일일이 넣지 않는다. 사이트맵과 내부링크로 흘러가게 둔다.

### 1-5. IndexNow (선택, 갱신 때 유용)

네이버는 2023년 7월부터 IndexNow 프로토콜을 지원한다. 새 페이지나 갱신된 페이지를 검색엔진에 직접 알릴 수 있어
로봇 방문을 기다릴 필요가 없고, 알림이 Bing 등 다른 검색엔진에도 함께 전파된다.

이 사이트는 연 4회 공시 갱신 때 수백 페이지가 한꺼번에 바뀐다. **갱신 배포 직후에 쓰면 효과가 크다.**
초기 등록 단계에서는 급하지 않으니 나중에 붙여도 된다.

---

## 2. Google Search Console

### 2-1. 속성 추가

<https://search.google.com/search-console> 접속 → 속성 선택기 → **+ 속성 추가**

속성 유형이 두 가지인데, **우리는 URL 접두어 속성만 쓸 수 있다.**

| 유형 | 범위 | 소유권 확인 | 우리 경우 |
|---|---|---|---|
| 도메인 (`example.com`) | 모든 하위 도메인·프로토콜 | DNS 레코드만 | **불가** |
| **URL 접두어** | 해당 접두어로 시작하는 URL | 여러 방법 지원 | **이쪽** |

`vercel.app`은 Vercel 소유 도메인이라 DNS 레코드를 우리가 추가할 수 없다. 도메인 속성은 DNS 인증만 지원하므로 선택지에서 빠진다.
나중에 커스텀 도메인을 붙이면 그때 도메인 속성으로 새로 만들면 된다.

주소는 **끝의 슬래시까지 정확히** 넣는다.

```
https://university-tuition-fees.vercel.app/
```

소유확인은 **HTML 태그** 방식을 고른다. 파일 업로드 방식도 되지만, 태그 쪽이 환경변수만 넣으면 끝이라 간단하다.
받은 메타태그의 content 값만 복사해 Vercel 환경변수에 넣는다.

```
GOOGLE_SITE_VERIFICATION=복사한_content_값
```

### 2-2. 사이트맵 제출

좌측 메뉴 **Sitemaps** → 새 사이트맵 추가에 아래를 입력하고 제출한다.

```
sitemap.xml
```

제출 직후 상태가 "가져올 수 없음"으로 보일 수 있다. 몇 시간 뒤 다시 본다.

### 2-3. 색인 생성 요청

상단 검색창에 URL을 넣어 **URL 검사**를 실행하고, "색인 생성 요청"을 누른다.
하루 요청 수에 제한이 있으므로 **아래 세 개만** 한다. 나머지는 사이트맵에 맡긴다.

```
https://university-tuition-fees.vercel.app/
https://university-tuition-fees.vercel.app/method/
https://university-tuition-fees.vercel.app/about/
```

---

## 3. 방문 계측 — Vercel Analytics

1. Vercel 대시보드 좌측 **Analytics** 진입 → 프로젝트 선택 → 상단 **Enable** 클릭
2. 패키지는 이미 프로젝트에 들어 있다 (`@vercel/analytics`)
3. `app/layout.tsx`에 `<Analytics />`가 이미 들어 있다
4. 재배포하면 수집이 시작된다

제대로 붙었는지는 브라우저 개발자도구 Network 탭에서 확인한다.
페이지를 열었을 때 `/_vercel/insights/view` 요청이 보이면 정상이다.

대시보드에 의미 있는 그림이 나오려면 방문이 며칠 쌓여야 한다.

GA4를 쓰고 싶다면 Vercel Analytics 대신 붙여도 되지만, 이 단계에서 필요한 지표는
방문 수와 유입 경로뿐이라 Vercel Analytics로 충분하다. 설정이 없고 쿠키 배너도 필요 없다.

---

## 4. 등록 후 확인 순서

등록 당일에는 아무 일도 일어나지 않는다. 정상이다.

| 시점 | 확인할 것 |
|---|---|
| 등록 직후 | 사이트맵 제출 상태, 소유확인 완료 표시 |
| 3~7일 | 구글 색인 생성 보고서에 페이지가 잡히기 시작 |
| 1~4주 | 네이버 수집 시작 |
| 3주 | 관찰 프로토콜 1차 결산 — `launch-checklist.md` 참조 |

---

## 참고

- 네이버 서치어드바이저 <https://searchadvisor.naver.com/>
- Google Search Console 속성 추가 도움말 <https://support.google.com/webmasters/answer/34592?hl=ko>
- Google 사이트 소유권 확인 <https://support.google.com/webmasters/answer/9008080?hl=ko>
- Vercel Web Analytics 시작하기 <https://vercel.com/docs/analytics/quickstart>
