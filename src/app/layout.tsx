import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NutriTrack",
  description: "Open-source AI nutrition tracker",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
