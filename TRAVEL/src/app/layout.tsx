import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "MaghrebVoyage | Voyages de groupe exceptionnels",
  description: "Réservez votre place pour des voyages de groupe inoubliables au Maghreb. MaghrebVoyage vous connecte aux meilleures agences.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
};

import { AuthProvider } from "@/components/providers/AuthProvider";
import { AppNotifyProvider } from "@/components/providers/AppNotifyProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${outfit.variable} font-sans h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <AppNotifyProvider>{children}</AppNotifyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
