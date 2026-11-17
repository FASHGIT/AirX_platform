import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AirX Platform",
  description:
    "A secure workspace for airtime exchange, shared vending infrastructure, and dealer digital channels.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

