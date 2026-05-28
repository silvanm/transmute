import type { Metadata } from "next";
import { JetBrains_Mono, Manrope, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const serif = Source_Serif_4({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500"],
  style: ["italic"],
});

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Transmute — format converter",
  description:
    "A quiet little instrument for moving text between HTML, Markdown, ANSI, and Rich Text.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${manrope.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
