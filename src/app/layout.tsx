import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { PushPermission } from "@/components/pwa/PushPermission";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "vzw De Gemeenschap",
  description: "Activiteiten en inschrijvingen voor jongeren in Sint-Niklaas.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DE GEMEENSCHAP",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B1020",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
          {children}
          <PushPermission />
          <InstallPrompt />
        </body>
    </html>
  );
}
