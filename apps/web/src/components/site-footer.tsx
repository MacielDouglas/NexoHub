"use client";

import { useTranslation } from "react-i18next";

import { SITE_AUTHOR, SITE_NAME } from "@/lib/site";

export function SiteFooter() {
  const { t } = useTranslation();

  return (
    <footer className="relative z-10 flex items-center justify-center gap-2 px-6 py-5 text-xs text-muted-foreground">
      <span>
        © {new Date().getFullYear()} {SITE_NAME} · {t("footer.developedBy")}{" "}
        <a
          href={SITE_AUTHOR.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground transition-colors hover:text-primary"
        >
          {SITE_AUTHOR.name}
        </a>
      </span>

      <svg
        className="size-3.5"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 .5A11.5 11.5 0 0 0 .5 12.03c0 5.21 3.38 9.63 8.07 11.19.59.11.8-.26.8-.57v-2.28c-3.28.71-3.97-1.4-3.97-1.4-.54-1.36-1.31-1.73-1.31-1.73-1.07-.73.08-.72.08-.72 1.18.08 1.81 1.22 1.81 1.22 1.05 1.8 2.76 1.28 3.43.98.11-.76.41-1.28.75-1.57-2.62-.3-5.38-1.31-5.38-5.83 0-1.29.46-2.34 1.22-3.17-.12-.3-.53-1.5.12-3.12 0 0 1-.32 3.28 1.22a11.4 11.4 0 0 1 5.98 0c2.27-1.54 3.27-1.22 3.27-1.22.65 1.62.24 2.82.12 3.12.76.83 1.22 1.88 1.22 3.17 0 4.53-2.77 5.53-5.4 5.82.42.36.8 1.08.8 2.18v3.23c0 .31.21.69.8.57A11.5 11.5 0 0 0 23.5 12.03 11.5 11.5 0 0 0 12 .5Z" />
      </svg>
    </footer>
  );
}
