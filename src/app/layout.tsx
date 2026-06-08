import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Sabi Wok — Skilled Workers in Sierra Leone", template: "%s | Sabi Wok" },
  description: "Sabi Wok — Sierra Leone's home for skilled work. Find and book verified electricians, plumbers, cleaners, tailors, and more.",
  keywords: ["Sierra Leone", "Sabi Wok", "skilled workers", "electrician", "plumber", "cleaning", "krio", "tradespeople"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
