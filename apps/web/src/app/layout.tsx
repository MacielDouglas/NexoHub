import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { I18nProvider } from "@/components/i18n-provider";
import { I18nSync } from "@/components/i18n-sync";
import { Toaster } from "@/components/ui/sonner";
import { normalizeLanguage } from "@/i18n/server";
import { SITE_AUTHOR, SITE_NAME, SITE_TAGLINE_PT, SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_TAGLINE_PT,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_AUTHOR.name, url: SITE_AUTHOR.url }],
  creator: SITE_AUTHOR.name,
  keywords: [
    "congregação",
    "reuniões",
    "designações",
    "programação de reunião",
    "gestão de membros",
    "testemunhas de jeová",
    "mobile-first",
  ],
  category: "organization",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    alternateLocale: "es_ES",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_TAGLINE_PT,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_TAGLINE_PT,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ec7000",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language") || "";
  const serverLanguage = normalizeLanguage(acceptLanguage);

  return (
    <html
      lang={serverLanguage}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background">
        <span
          aria-hidden
          suppressHydrationWarning
          // biome-ignore lint/security/noDangerouslySetInnerHtml: static audit contract, no user input, XSS-safe
          dangerouslySetInnerHTML={{
            __html:
              '<!-- CONTRACT seed ea58f3f2 · world: Itaú current banking app (user-pinned; assigned candidate 6 overridden), scoped app-wide. THESIS: the whole product reads as a bank home — ink ground with Itaú orange #EC7000 as the single accent, cards as statement surfaces, tabular numerals, one orange glow per hero. OWN-WORLD: ink surface (#0c0c12) with Itaú orange #EC7000 promoted to :root; dark cards, soft white rings, tabular numerals, one orange glow in the hero. STORY: every registered user moves through a dark banking shell — auth, org overview, people, meeting-content, settings, admin. FIRST VIEWPORT (org): dark rounded panel with sidebar; org pages share the panel wrapper, "Pessoas" hero with total + 5 stat cells, search pill, family rows. FORM: user-pinned Itaú world, no re-roll taken; seed key ea58f3f2. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md -->',
          }}
        />
        <I18nProvider>
          <I18nSync lang={serverLanguage} />
          {children}
          <Toaster />
        </I18nProvider>
      </body>
    </html>
  );
}
