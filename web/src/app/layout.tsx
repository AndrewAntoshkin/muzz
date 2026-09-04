import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Rubik } from "next/font/google";
import { AppFrame } from "@/components/AppFrame";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

const rubik = Rubik({
  subsets: ["latin", "cyrillic"],
  variable: "--font-rubik",
});

export const metadata: Metadata = {
  title: "Кадр",
  description: "Каталог и профили «Кадра»",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${inter.variable} ${rubik.variable}`}>
      <body className="app-body-root" data-profession="actor" data-page="home" data-layout="hub">
        <Suspense fallback={<div className="auth-boot">Загрузка…</div>}>
          <AuthProvider>
            <AppFrame>{children}</AppFrame>
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
