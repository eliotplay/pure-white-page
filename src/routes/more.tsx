import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Bell, CalendarDays, Wallet, BarChart3, Boxes, Receipt, Archive, Settings, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/more")({
  head: () => ({ meta: [{ title: "More — BizTrack" }] }),
  component: More,
});

function More() {
  const { t } = useI18n();
  const items = [
    { to: "/profile" as const, label: t("profile"), icon: User, search: undefined },
    { to: "/reminders" as const, label: t("reminders"), icon: Bell, search: undefined },
    { to: "/calendar" as const, label: t("calendar"), icon: CalendarDays, search: undefined },
    { to: "/finance" as const, label: t("finance"), icon: Wallet, search: undefined },
    { to: "/analytics" as const, label: t("analytics"), icon: BarChart3, search: undefined },
    { to: "/inventory" as const, label: t("inventory"), icon: Boxes, search: undefined },
    { to: "/expenses" as const, label: t("expenses"), icon: Receipt, search: undefined },
    { to: "/settings" as const, label: t("settings"), icon: Settings, search: undefined },
    { to: "/settings" as const, label: t("archive"), icon: Archive, search: { tab: "archive" } as const },
  ];

  return (
    <AppShell>
      <h1 className="text-[28px] font-bold pt-5 pb-4">{t("more")}</h1>
      <div className="grid grid-cols-2 gap-3">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Link
              key={it.label}
              to={it.to}
              search={it.search as never}
              className="card-bz flex flex-col items-start gap-3 aspect-square"
            >
              <span className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/40 grid place-items-center">
                <Icon size={20} className="text-primary" />
              </span>
              <div className="font-bold mt-auto">{it.label}</div>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
