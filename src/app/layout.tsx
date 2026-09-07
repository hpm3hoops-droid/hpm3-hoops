import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "HPM3 Hoops", template: "%s · HPM3 Hoops" },
  description: "Helping Players Master, Maximize, Multiply. Remote basketball development for middle and high school players: a daily plan, benchmarks, film study, and a coach who checks.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Public+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Chivo+Mono:wght@400;500&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
