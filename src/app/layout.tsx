import type { Metadata } from "next";
import { DM_Sans, DM_Mono, Bebas_Neue, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-loader",
  subsets: ["latin"],
  weight: "400",
});

const APP_NAME    = process.env.NEXT_PUBLIC_APP_NAME    || 'Portal'
const APP_COMPANY = process.env.NEXT_PUBLIC_APP_COMPANY || 'Field Operations Ltd'
const APP_TAGLINE = process.env.NEXT_PUBLIC_APP_TAGLINE || 'Daily Activity & Asset Management'

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_COMPANY}`,
  description: `${APP_TAGLINE} — ${APP_COMPANY}`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", dmSans.variable, dmMono.variable, bebasNeue.variable, "font-sans", geist.variable)}
    >
      <head></head>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="bottom-right" theme="light" richColors />
      </body>
    </html>
  );
}
