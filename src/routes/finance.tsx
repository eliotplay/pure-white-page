import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useState, useMemo } from "react";
import { db, formatRp } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, ChevronLeft, ChevronRight, TrendingUp, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/finance")({
  head: () => ({ meta: [{ title: "Finance — BizTrack" }] }),
  component: Finance,
});

function Finance() {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; });
  const monthEnd = useMemo(() => { const d = new Date(cursor); d.setMonth(d.getMonth() + 1); return d; }, [cursor]);

  const [openClient, setOpenClient] = useState<number | null>(null);
  const [openProduct, setOpenProduct] = useState<number | null>(null);

  const data = useLiveQuery(async () => {
    const startMs = cursor.getTime();
    const endMs = monthEnd.getTime();
    const orders = await db.orders.filter((o) => !o.isArchived && o.orderDate >= startMs && o.orderDate < endMs).toArray();
    const items = await db.orderItems.toArray();
    const contacts = await db.contacts.toArray();
    const products = await db.products.toArray();
    const expenses = (await db.expenses.filter((e) => e.date >= startMs && e.date < endMs).toArray()).reduce((s, e) => s + e.amount, 0);

    const paid = orders.filter((o) => o.status === "PAID");
    const revenue = paid.reduce((s, o) => s + items.filter((i) => i.orderId === o.id).reduce((ss, i) => ss + i.unitPrice * i.quantity, 0), 0);

    const byClient = new Map<number, { name: string; total: number }>();
    for (const o of paid) {
      const t = items.filter((i) => i.orderId === o.id).reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      const prev = byClient.get(o.contactId) ?? { name: contacts.find((c) => c.id === o.contactId)?.name ?? "Unknown", total: 0 };
      prev.total += t;
      byClient.set(o.contactId, prev);
    }

    const byProduct = new Map<number, { name: string; units: number; revenue: number }>();
    for (const o of paid) for (const i of items.filter((it) => it.orderId === o.id)) {
      const prev = byProduct.get(i.productId) ?? { name: products.find((p) => p.id === i.productId)?.name ?? "—", units: 0, revenue: 0 };
      prev.units += i.quantity;
      prev.revenue += i.unitPrice * i.quantity;
      byProduct.set(i.productId, prev);
    }

    return {
      revenue, expenses, net: revenue - expenses,
      clients: [...byClient.entries()].sort((a, b) => b[1].total - a[1].total),
      products: [...byProduct.entries()].sort((a, b) => b[1].revenue - a[1].revenue),
    };
  }, [cursor.getTime()]);

  const maxProd = data?.products[0]?.[1].revenue ?? 1;

  return (
    <AppShell>
      <header className="flex items-center gap-3 pt-3 pb-2">
        <Link to="/more" className="text-primary"><ArrowLeft size={24} /></Link>
      </header>

      <div className="card-bz mt-3">
        <div className="flex items-center justify-between">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="h-8 w-8 grid place-items-center text-muted-foreground"><ChevronLeft size={18} /></button>
          <div className="text-center">
            <div className="label-eyebrow">Financial Period</div>
            <div className="font-bold text-lg mt-1">{cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
          </div>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="h-8 w-8 grid place-items-center text-muted-foreground"><ChevronRight size={18} /></button>
        </div>
      </div>

      <div className="card-bz mt-3">
        <div className="flex items-start justify-between">
          <div className="label-eyebrow">Net Profit</div>
          <span className="bg-primary/15 border border-primary/40 text-primary text-xs font-bold tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1">
            <TrendingUp size={12} /> +{data && data.revenue ? ((data.net / data.revenue) * 100).toFixed(1) : "0.0"}%
          </span>
        </div>
        <div className="text-[34px] font-bold mt-1">{formatRp(data?.net ?? 0)}</div>
        <div className="mt-3 h-1 rounded-full bg-border overflow-hidden">
          <div className="h-full bg-primary glow-primary-sm rounded-full" style={{ width: `${Math.max(0, Math.min(100, data && data.revenue ? (data.net / data.revenue) * 100 : 0))}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="card-bz"><div className="label-eyebrow">Revenue</div><div className="text-xl font-bold mt-1">{formatRp(data?.revenue ?? 0)}</div></div>
        <div className="card-bz"><div className="label-eyebrow">Expenses</div><div className="text-xl font-bold mt-1">{formatRp(data?.expenses ?? 0)}</div></div>
      </div>

      <div className="flex items-center justify-between mt-6 mb-3">
        <div className="label-eyebrow flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Client Breakdown</div>
        <span className="text-xs font-bold text-primary tracking-wider uppercase">Top {Math.min(5, data?.clients.length ?? 0)}</span>
      </div>
      <div className="flex flex-col gap-3">
        {data?.clients.slice(0, 5).map(([id, c]) => (
          <button key={id} onClick={() => setOpenClient(openClient === id ? null : id)} className="card-bz text-left">
            <div className="flex items-center justify-between">
              <span className="font-bold">{c.name}</span>
              <span className="text-primary font-bold">{formatRp(c.total)}</span>
            </div>
            <ChevronDown size={14} className={`text-muted-foreground transition-transform ${openClient === id ? "rotate-180" : ""}`} />
          </button>
        ))}
        {data && data.clients.length === 0 && <div className="card-bz text-center text-sm text-muted-foreground">No paid orders this period.</div>}
      </div>

      <div className="label-eyebrow flex items-center gap-2 mt-6 mb-3"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Product Performance</div>
      <div className="card-bz flex flex-col gap-4 mb-4">
        {data?.products.slice(0, 5).map(([id, p]) => (
          <div key={id} onClick={() => setOpenProduct(openProduct === id ? null : id)}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold">{p.name}</span>
              <span className="text-primary font-bold">{formatRp(p.revenue)}</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
              <div className="h-full bg-primary glow-primary-sm rounded-full" style={{ width: `${(p.revenue / maxProd) * 100}%` }} />
            </div>
            {openProduct === id && <div className="text-xs text-muted-foreground mt-1.5">{p.units} units sold</div>}
          </div>
        ))}
        {data && data.products.length === 0 && <div className="text-center text-sm text-muted-foreground">No product sales.</div>}
      </div>
    </AppShell>
  );
}
