import { Link, useLocation } from "@tanstack/react-router";
import { LayoutGrid, Receipt, Users, Package, MoreHorizontal, BarChart3 } from "lucide-react";
import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n";

export function AppShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const isActive = (to: string) => to === "/" ? pathname === "/" : pathname.startsWith(to);

  const tabs = [
    { to: "/", label: t("nav.home"), icon: LayoutGrid },
    { to: "/orders", label: t("nav.orders"), icon: Receipt },
    { to: "/contacts", label: t("nav.contacts"), icon: Users },
    { to: "/products", label: t("nav.products"), icon: Package },
    { to: "/more", label: t("nav.more"), icon: MoreHorizontal },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground mx-auto max-w-md relative">
      <Header />
      <main className={`px-4 ${hideNav ? "pb-8" : "pb-28"} pt-2`}>{children}</main>
      {!hideNav && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-30">
          <div className="mx-3 mb-3 rounded-3xl border border-border bg-[oklch(0.11_0_0)]/95 backdrop-blur px-2 py-2 flex items-center justify-around">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = isActive(tab.to);
              return (
                <Link key={tab.to} to={tab.to} className="flex-1 flex flex-col items-center gap-1 py-2 relative">
                  {active && <span className="absolute -top-0.5 h-0.5 w-6 rounded-full bg-primary glow-primary-sm" />}
                  <Icon size={20} className={active ? "text-primary" : "text-muted-foreground"} strokeWidth={active ? 2.5 : 2} />
                  <span className={`text-[10px] font-semibold tracking-wider uppercase ${active ? "text-primary" : "text-muted-foreground"}`}>
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

function Header() {
  const avatar = typeof window !== "undefined" ? localStorage.getItem("biztrack:avatar") : null;
  return (
    <header className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
      <Link to="/" className="flex items-center gap-2">
        <span className="h-9 w-9 rounded-xl bg-primary/15 border border-primary/40 grid place-items-center">
          <BarChart3 size={18} className="text-primary" strokeWidth={2.5} />
        </span>
        <span className="font-bold text-lg tracking-tight">BizTrack</span>
      </Link>
      <Link to="/profile" className="relative" aria-label="Profile">
        <span className="h-9 w-9 rounded-full bg-surface-elevated border border-border grid place-items-center overflow-hidden">
          {avatar ? <span className="text-lg leading-none">{avatar}</span> : <Users size={16} className="text-muted-foreground" />}
        </span>
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary glow-primary-sm" />
      </Link>
    </header>
  );
}

export function PageTitle({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="pt-5 pb-4">
      {eyebrow && <div className="label-eyebrow mb-1.5">{eyebrow}</div>}
      <h1 className="text-[28px] leading-[34px] font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>}
    </div>
  );
}

export function StatusBadge({ status }: { status: "DUE" | "PAID" | "OVERDUE" | "DUE SOON" }) {
  const map = {
    PAID:     { bg: "bg-primary/15", border: "border-primary/50", text: "text-primary" },
    DUE:      { bg: "bg-surface-elevated", border: "border-border", text: "text-foreground" },
    OVERDUE:  { bg: "bg-surface-elevated", border: "border-border", text: "text-foreground" },
    "DUE SOON": { bg: "bg-primary/15", border: "border-primary/50", text: "text-primary" },
  } as const;
  const s = map[status];
  return (
    <span className={`inline-flex items-center justify-center px-3 h-7 rounded-md border ${s.bg} ${s.border} ${s.text} text-[10px] font-bold tracking-widest`}>
      {status}
    </span>
  );
}

export function FAB({ to, onClick, children }: { to?: string; onClick?: () => void; children: ReactNode }) {
  const cls = "fixed bottom-24 right-6 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground grid place-items-center glow-primary active:scale-95 transition";
  if (to) return <Link to={to} className={cls}>{children}</Link>;
  return <button onClick={onClick} className={cls}>{children}</button>;
}
