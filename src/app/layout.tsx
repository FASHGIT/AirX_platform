import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AirX Platform | Foundation",
  description:
    "A foundation for airtime stock exchange, shared vending infrastructure, and dealer digital channels.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
