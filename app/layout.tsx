import type { Metadata } from 'next';
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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased leading-relaxed">
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-line bg-surface">
            <div className="mx-auto max-w-[880px] px-5 py-3 flex items-center justify-between">
              <a href="/" className="text-[15px] font-bold tracking-tight">등록금 영수증</a>
              <nav className="flex gap-4 text-[13px] text-ink2">
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
      </body>
    </html>
  );
}
