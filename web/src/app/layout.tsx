import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import { AppFrame } from "@/components/AppFrame";
import { AuthProvider } from "@/components/AuthProvider";
import { PwaRegister } from "@/components/PwaRegister";
import "./globals.css";

const THEME_BOOT = `(function(){try{var t=localStorage.getItem("kadr-theme");if(t!=="light"&&t!=="dark")t="dark";document.documentElement.setAttribute("data-theme",t);document.documentElement.style.colorScheme=t;var c=t==="light"?"#ffffff":"#121212";var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",c);}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  style: "italic",
  weight: "500",
  variable: "--font-plan-serif",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
};

export const metadata: Metadata = {
  title: "Кадр",
  description: "Каталог и профили «Кадра»",
  applicationName: "Кадр",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Кадр",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="app-body-root" data-profession="actor" data-page="home" data-layout="hub">
        <Suspense fallback={<div className="auth-boot">Загрузка…</div>}>
          <AuthProvider>
            <PwaRegister />
            <AppFrame>{children}</AppFrame>
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
