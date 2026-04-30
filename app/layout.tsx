import type { Metadata } from "next";
import { Onest } from "next/font/google";
import "./globals.css";

const onest = Onest({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-onest",
  display: "swap"
});

export const metadata: Metadata = {
  title: "МястоЗаМясто",
  description: "Безплатна платформа за потенциални съвпадения между родители за детски градини."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bg">
      <body className={onest.className}>{children}</body>
    </html>
  );
}
