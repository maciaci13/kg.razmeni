import type { Metadata } from "next";
import { Manrope, Onest } from "next/font/google";
import AppStabilityGuard from "./AppStabilityGuard";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap"
});

const onest = Onest({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-onest",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Място За Място",
  description: "Безплатна платформа за потенциални съвпадения между родители за детски градини."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bg">
      <body className={`${manrope.variable} ${onest.variable}`}>
        {children}
        <AppStabilityGuard />
      </body>
    </html>
  );
}
