import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  icons: { icon: '/icon.svg' },
  title: 'NOCTURNE — A study in motion',
  description: 'An independent automotive design study. Explore an unbranded concept through form, presence, and detail.',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<noscript><style>{`.chapter-grid{display:block!important}.chapter{visibility:visible!important;min-height:90vh!important;opacity:1!important;transform:none!important}.scene-layer,.stage-vignette,.chapter-nav{display:none!important}.mobile-car{display:block!important;width:100%;height:auto}.hero-bottom{position:relative;left:auto;right:auto;bottom:auto;margin-top:30px}.chapter.performance{padding-left:6.2vw}.experience-stage{overflow:visible}`}</style></noscript></body></html>;
}
