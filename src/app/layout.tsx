import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { SessionProviderWrapper } from "@/providers/auth-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BanglaLMS - Learning Management System",
  description: "Complete LMS solution for Bangladesh educational institutions",
  keywords: ["LMS", "Learning Management", "Education", "Bangladesh", "Online Learning"],
  authors: [{ name: "Pixel Forge" }],
  creator: "Pixel Forge Web Development Agency",
  publisher: "Pixel Forge",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://banglalms.com",
    title: "BanglaLMS - Learning Management System",
    description: "Complete LMS solution for Bangladesh educational institutions",
    siteName: "BanglaLMS",
  },
  twitter: {
    card: "summary_large_image",
    title: "BanglaLMS - Learning Management System",
    description: "Complete LMS solution for Bangladesh educational institutions",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-inter antialiased">
        <QueryProvider>
          <SessionProviderWrapper>
            {children}
          </SessionProviderWrapper>
        </QueryProvider>
      </body>
    </html>
  );
}
