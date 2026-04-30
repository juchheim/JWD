import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Juchheim Web Development",
  description: "Engineering precision. Building futures.",
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
