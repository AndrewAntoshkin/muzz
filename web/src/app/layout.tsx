import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Rubik } from "next/font/google";
import { Shell } from "@/components/Shell";
import { WorkspaceProvider } from "@/components/useWorkspace";
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
        <Suspense>
          <WorkspaceProvider>
            <Shell>{children}</Shell>
          </WorkspaceProvider>
        </Suspense>
      </body>
    </html>
  );
}
