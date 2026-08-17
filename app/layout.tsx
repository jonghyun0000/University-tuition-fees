import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { SITE_URL, BASE_YEAR } from '@/lib/data';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `등록금 영수증 — 대학정보공시로 보는 등록금 사용 내역 (${BASE_YEAR})`,
    template: '%s | 등록금 영수증',
  },
  description:
    `전국 대학의 등록금과 학생 1인당 교육비를 대학정보공시 ${BASE_YEAR}년 자료 그대로 보여준다. 순위를 매기지 않는다.`,
  robots: { index: true, follow: true },
  // 검색엔진 소유확인. 값은 Vercel 환경변수로 넣는다 — 코드를 고칠 필요가 없다.
  // 네이버는 public/naverXXXX.html 파일 업로드 방식도 쓸 수 있다.
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: process.env.NAVER_SITE_VERIFICATION
      ? { 'naver-site-verification': process.env.NAVER_SITE_VERIFICATION }
      : {},
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased leading-relaxed">
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-line bg-surface">
            <div className="mx-auto max-w-[880px] px-5 py-3 flex items-center justify-between">
              <a href="/" className="text-[15px] font-bold tracking-tight">등록금 영수증</a>
              <nav className="flex items-center gap-4 text-[13px] text-ink2">
                <a href="/compare/"
                   className="inline-flex items-center gap-1.5 rounded border border-accent bg-white
                              px-2.5 py-1 font-bold text-accent hover:bg-[#eef4fc]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 20h18" /><path d="M7.5 20V9" /><path d="M16.5 20v-6" />
                  </svg>
                  비교하기
                </a>
                <a href="/method/" className="hover:text-accent">지표 정의</a>
                <a href="/about/" className="hover:text-accent">데이터 출처</a>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-line mt-16">
            <div className="mx-auto max-w-[880px] px-5 py-8 text-[12.5px] text-muted">
              대학정보공시 {BASE_YEAR}년 자료를 출처표시 조건으로 사용한다. 순위·등급·자체 점수를 만들지 않으며,
              결측은 0으로 채우지 않는다. 원본은 대학알리미에서 확인할 수 있다.
            </div>
          </footer>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
