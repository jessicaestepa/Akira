"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Globe } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { locales } from "@/lib/i18n/config";

interface NavbarProps {
  locale: Locale;
  dict: Dictionary;
}

export function Navbar({ locale, dict }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  function switchLocalePath(newLocale: string) {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    return segments.join("/");
  }

  const navLinks = [
    { href: `/${locale}`, label: dict.nav.home },
    { href: `/${locale}/sell`, label: dict.nav.sell },
    { href: `/${locale}/buyers`, label: dict.nav.buyers },
    { href: `/${locale}/deals`, label: dict.nav.deals },
  ];

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            href={`/${locale}`}
            className="text-xl font-semibold tracking-tight"
          >
            Aqüira
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors hover:text-foreground ${
                  pathname === link.href
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Language switcher */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              {locales.map((l) => (
                <Link
                  key={l}
                  href={switchLocalePath(l)}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    l === locale
                      ? "text-foreground font-medium"
                      : "hover:text-foreground"
                  }`}
                >
                  {l.toUpperCase()}
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-2 py-2 text-sm rounded transition-colors ${
                  pathname === link.href
                    ? "text-foreground font-medium bg-muted"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center gap-2 px-2 pt-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              {locales.map((l) => (
                <Link
                  key={l}
                  href={switchLocalePath(l)}
                  onClick={() => setMobileOpen(false)}
                  className={`px-2 py-1 rounded ${
                    l === locale
                      ? "text-foreground font-medium"
                      : "hover:text-foreground"
                  }`}
                >
                  {l.toUpperCase()}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
