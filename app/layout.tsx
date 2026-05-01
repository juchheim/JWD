import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Juchheim Web Development",
  description:
    "SaaS, web apps, and WordPress for nonprofits and growing businesses — based in Greenwood, Mississippi, serving clients nationwide.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
