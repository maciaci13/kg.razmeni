import type { Metadata } from "next";
import { Sofia_Sans } from "next/font/google";
import HomeChanceRadar from "./HomeChanceRadar";
import HomeGuidanceEnhancer from "./HomeGuidanceEnhancer";
import HomeHeroActionButtonsFinal from "./HomeHeroActionButtonsFinal";
import HomeHeroAndRadarFix from "./HomeHeroAndRadarFix";
import HomeHeroCopyPolish from "./HomeHeroCopyPolish";
import HomeStatLinks from "./HomeStatLinks";
import HomeStatsCleanup from "./HomeStatsCleanup";
import MatchFlashGuard from "./MatchFlashGuard";
import MatchSimulatorBridge from "./MatchSimulatorBridge";
import MobileChromePolish from "./MobileChromePolish";
import NavEmergencyFix from "./NavEmergencyFix";
import PlaygroundRandomToolsSafe from "./PlaygroundRandomToolsSafe";
import ProfileOnboarding from "./ProfileOnboarding";
import RadarProfileDefaultsFix from "./RadarProfileDefaultsFix";
import RadarUiPolish from "./RadarUiPolish";
import RequestFormHardReset from "./RequestFormHardReset";
import RequestProfileCheckboxFix from "./RequestProfileCheckboxFix";
import RequestProfileDefaultsSync from "./RequestProfileDefaultsSync";
import RequestVisualPolish from "./RequestVisualPolish";
import ShareRequestEnhancer from "./ShareRequestEnhancer";
import StatusDropdownCleanup from "./StatusDropdownCleanup";
import TabLoadingStates from "./TabLoadingStates";
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
        <ProfileOnboarding />
        <HomeChanceRadar />
        <HomeHeroCopyPolish />
        <HomeHeroAndRadarFix />
        <HomeHeroActionButtonsFinal />
        <RadarUiPolish />
        <RadarProfileDefaultsFix />
        <HomeGuidanceEnhancer />
        <HomeStatLinks />
        <HomeStatsCleanup />
        <PlaygroundRandomToolsSafe />
        <TabLoadingStates />
        <MatchFlashGuard />
        <MatchSimulatorBridge />
        <MobileChromePolish />
        <RequestFormHardReset />
        <RequestProfileDefaultsSync />
        <RequestProfileCheckboxFix />
        <RequestVisualPolish />
        <ShareRequestEnhancer />
        <StatusDropdownCleanup />
        <TextCopyNormalizer />
        <NavEmergencyFix />
      </body>
    </html>
  );
}
