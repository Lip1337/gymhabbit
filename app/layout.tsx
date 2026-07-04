import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { Geist } from "next/font/google";
import type { Metadata, Viewport } from "next";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: {
    default: "GymHabbit",
    template: "%s | GymHabbit",
  },
  description: "Trainingspläne erstellen und Workouts im Gym abhaken.",
  applicationName: "GymHabbit",
  appleWebApp: {
    capable: true,
    title: "GymHabbit",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0F19",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-dvh font-sans flex flex-col">
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
          {children}
        </div>
        <Analytics />
      </body>
    </html>
  );
}
