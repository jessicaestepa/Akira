import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

interface FooterProps {
  locale: Locale;
  dict: Dictionary;
}

export function Footer({ locale, dict }: FooterProps) {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <span className="font-semibold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Aqüira
            </span>
            <span className="text-sm text-muted-foreground">
              {dict.footer.tagline}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link
              href={`/${locale}/privacy`}
              className="hover:text-primary transition-colors"
            >
              {dict.footer.privacy}
            </Link>
            <span>
              &copy; {new Date().getFullYear()} Aqüira. {dict.footer.rights}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
