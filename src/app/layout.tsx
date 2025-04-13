import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DivTrack",
  description: "Track your dividend investments and portfolio performance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased dark-theme`}>
        <div className="gradient-background"></div>
        <AuthProvider>
          <main className="min-h-screen bg-transparent flex flex-col items-center">
            {children}
            <footer className="w-full py-4 text-center text-sm text-gray-400 mt-auto">
              Powered by Alpaca
            </footer>
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
