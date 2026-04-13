import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center gap-8">
            <Link
              href="/admin"
              className="text-lg font-semibold tracking-tight inline-flex items-baseline gap-1.5"
            >
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Aqüira
              </span>
              <span className="text-muted-foreground font-normal text-sm">
                Admin
              </span>
            </Link>
            <div className="flex items-center gap-6 text-sm">
              <Link
                href="/admin/sellers"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Sellers
              </Link>
              <Link
                href="/admin/buyers"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Buyers
              </Link>
              <Link
                href="/admin/deals"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Deals
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
