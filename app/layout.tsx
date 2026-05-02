import type { Metadata } from "next";
import { Sofia_Sans } from "next/font/google";
import HomeGuidanceEnhancer from "./HomeGuidanceEnhancer";
import RequestFormHardReset from "./RequestFormHardReset";
import RequestVisualPolish from "./RequestVisualPolish";
import ShareRequestEnhancer from "./ShareRequestEnhancer";
import TextCopyNormalizer from "./TextCopyNormalizer";
import "./globals.css";

const sofiaSans = Sofia_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-sofia-sans",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Място За Място",
  description: "Безплатна платформа за потенциални съвпадения между родители за детски градини."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bg">
      <body className={sofiaSans.className}>
        {children}
        <HomeGuidanceEnhancer />
        <RequestFormHardReset />
        <RequestVisualPolish />
        <ShareRequestEnhancer />
        <TextCopyNormalizer />
      </body>
    </html>
  );
}
