import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { db, formatRp, formatRpShort } from "@/lib/db";
import { AppShell, StatusBadge } from "@/components/AppShell";
import { Wallet, TrendingUp, AlertCircle, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BizTrack — Dashboard" },
      { name: "description", content: "Your business at a glance: revenue, expenses, profit and pending payments." },
    ],
  }),
  component: Dashboard,
});

function greetingKey(): string {
  const h = new Date().getHours();
  if (h < 12) return "greet.morning";
  if (h < 18) return "greet.afternoon";
  return "greet.evening";
}


function Dashboard() {
  const { t, username } = useI18n();
  const [greet, setGreet] = useState<string>("");
  useEffect(() => { setGreet(t(greetingKey())); }, [t]);

  const data = useLiveQuery(async () => {
    const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
    const startMs = start.getTime();

    const orders = await db.orders.filter((o) => !o.isArchived).toArray();
    const monthOrders = orders.filter((o) => o.orderDate >= startMs);
    const items = await db.orderItems.toArray();
    const orderRevenue = (oid: number) =>
      items.filter((i) => i.orderId === oid).reduce((s, i) => s + i.unitPrice * i.quantity, 0);

    const revenue = monthOrders.filter((o) => o.status === "PAID").reduce((s, o) => s + orderRevenue(o.id!), 0);
    const expenses = (await db.expenses.filter((e) => e.date >= startMs).toArray()).reduce((s, e) => s + e.amount, 0);
    const dueCount = orders.filter((o) => o.status === "DUE").length;

    // Growth trajectory: current 7 days net vs prior 7 days net
    const now = Date.now();
    const day = 86400000;
    const week1Start = now - 7 * day;
    const week2Start = now - 14 * day;
    const allExpenses = await db.expenses.toArray();
    const netFor = (from: number, to: number) => {
      const rev = orders
        .filter((o) => o.status === "PAID" && o.orderDate >= from && o.orderDate < to)
        .reduce((s, o) => s + orderRevenue(o.id!), 0);
      const exp = allExpenses
        .filter((e) => e.date >= from && e.date < to)
        .reduce((s, e) => s + e.amount, 0);
      return rev - exp;
    };
    const curNet = netFor(week1Start, now);
    const prevNet = netFor(week2Start, week1Start);
    let growthPct: number | null = null;
    if (prevNet !== 0) growthPct = ((curNet - prevNet) / Math.abs(prevNet)) * 100;
    else if (curNet !== 0) growthPct = curNet > 0 ? 100 : -100;

    const recent = [...orders].sort((a, b) => b.orderDate - a.orderDate).slice(0, 3);
    const contacts = await db.contacts.toArray();
    const recentEnriched = recent.map((o) => ({
      ...o,
      contact: contacts.find((c) => c.id === o.contactId)?.name ?? "Unknown",
      total: orderRevenue(o.id!),
    }));

    return { revenue, expenses, net: revenue - expenses, dueCount, recent: recentEnriched, growthPct };
  }, [], null);

  return (
    <AppShell>
      <section className="pt-4 pb-2">
        <div className="label-eyebrow">{t("welcome")}</div>
        <h1 className="text-[32px] leading-[38px] font-bold mt-1">
          {greet || "\u00A0"}, <span className="italic font-medium">{username}</span>
        </h1>
      </section>



      <div className="card-bz mt-4">
        <div className="flex items-start justify-between">
          <div className="label-eyebrow">{t("total_revenue")}</div>

          <Wallet size={18} className="text-muted-foreground" />
        </div>
        <div className="text-[32px] leading-tight font-bold text-primary text-glow mt-1.5">
          {data ? formatRp(data.revenue) : "Rp —"}
        </div>
        <div className="mt-3 h-1 rounded-full bg-border overflow-hidden">
          <div className="h-full bg-primary glow-primary-sm rounded-full" style={{ width: "68%" }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="card-bz">
          <div className="label-eyebrow">{t("expenses")}</div>
          <div className="text-xl font-bold mt-1">{data ? formatRpShort(data.expenses) : "—"}</div>
        </div>
        <div className="card-bz">
          <div className="label-eyebrow">{t("net_profit")}</div>

          <div className="text-xl font-bold mt-1 text-primary flex items-center gap-1">
            <TrendingUp size={16} />{data ? formatRpShort(data.net) : "—"}
          </div>
        </div>
      </div>

      <Link to="/reminders" className="card-bz mt-3 flex items-center justify-between block">
        <div>
          <div className="label-eyebrow">{t("pending_payments")}</div>
          <div className="text-base font-semibold mt-1">{data?.dueCount ?? 0} {t("outstanding")}</div>

        </div>
        <span className="h-10 w-10 rounded-full bg-surface-elevated border border-border grid place-items-center">
          <AlertCircle size={18} className="text-primary" />
        </span>
      </Link>

      <div className="card-bz mt-3 relative overflow-hidden h-[140px]">
        <div className="absolute inset-0 opacity-40">
          <svg viewBox="0 0 320 140" className="w-full h-full">
            <path d="M0,90 Q60,60 120,70 T240,55 T320,75" stroke="oklch(0.93 0.27 135)" strokeWidth="1.5" fill="none" opacity="0.7" />
          </svg>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="font-bold text-base">{t("financial_health")}</div>

          <div className="text-sm text-muted-foreground mt-0.5">
            {t("growth_trajectory")}{" "}
            <span className={`italic font-medium ${data && data.growthPct != null && data.growthPct < 0 ? "text-warning" : "text-primary"}`}>
              {data && data.growthPct != null
                ? `${data.growthPct >= 0 ? "+" : ""}${data.growthPct.toFixed(1)}%`
                : "—"}
            </span>{" "}
            {t("this_week")}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 mb-3">
        <h2 className="text-base font-semibold">{t("recent_orders")}</h2>
        <Link to="/orders" className="text-xs font-bold tracking-wider text-primary uppercase">{t("view_all")}</Link>

      </div>

      <div className="flex flex-col gap-3">
        {data?.recent.map((o) => (
          <Link key={o.id} to="/orders/$id" params={{ id: String(o.id) }} className="card-bz flex items-center gap-3">
            <span className="h-11 w-11 rounded-full bg-surface-elevated border border-border grid place-items-center shrink-0">
              <User size={18} className="text-muted-foreground" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-bold truncate">{o.contact}</div>
              <div className="text-[11px] text-muted-foreground tracking-wider uppercase mt-0.5">
                BT-{String(o.id).padStart(4, "0")} · {relTime(o.orderDate)}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-bold">{formatRpShort(o.total)}</div>
              <div className="mt-1"><StatusBadge status={o.status} /></div>
            </div>
          </Link>
        ))}
        {data && data.recent.length === 0 && (
          <div className="card-bz text-center text-sm text-muted-foreground">{t("no_orders")}</div>

        )}
      </div>
    </AppShell>
  );
}

function relTime(t: number): string {
  const diff = Date.now() - t;
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "yesterday";
  return `${d} days ago`;
}
