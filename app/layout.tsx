import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "МястоЗаМясто",
  description: "Безплатна платформа за потенциални съвпадения между родители за детски градини."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bg">
      <body>{children}</body>
    </html>
  );
}
