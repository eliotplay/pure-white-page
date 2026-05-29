import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useState, useMemo } from "react";
import { db, formatRp } from "@/lib/db";
import { AppShell, FAB, StatusBadge } from "@/components/AppShell";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/orders/")({
  head: () => ({ meta: [{ title: "Orders — BizTrack" }] }),
  component: OrdersPage,
});

type Filter = "ALL" | "DUE" | "PAID";

function OrdersPage() {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [q, setQ] = useState("");

  const rows = useLiveQuery(async () => {
    const orders = await db.orders.filter((o) => !o.isArchived).toArray();
    const contacts = await db.contacts.toArray();
    const products = await db.products.toArray();
    const items = await db.orderItems.toArray();
    return orders.map((o) => {
      const its = items.filter((i) => i.orderId === o.id);
      const total = its.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      const productNames = its.map((i) => products.find((p) => p.id === i.productId)?.name ?? "").filter(Boolean);
      return {
        ...o,
        contactName: contacts.find((c) => c.id === o.contactId)?.name ?? "Unknown",
        total, productNames,
      };
    }).sort((a, b) => b.orderDate - a.orderDate);
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    return rows.filter((o) => {
      if (filter !== "ALL" && o.status !== filter) return false;
      if (!q) return true;
      const ql = q.toLowerCase();
      return o.contactName.toLowerCase().includes(ql) || o.productNames.some((n) => n.toLowerCase().includes(ql));
    });
  }, [rows, filter, q]);

  return (
    <AppShell>
      <h1 className="text-[28px] font-bold pt-5 pb-4">Orders</h1>

      <div className="relative">
        <input className="input-bz" placeholder="Search orders…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-none">
        {(["ALL", "DUE", "PAID"] as const).map((f) => (
          <button key={f} className={`chip ${filter === f ? "chip-active" : ""}`} onClick={() => setFilter(f)}>
            {f === "ALL" ? "All Orders" : f === "DUE" ? "Unpaid" : "Settled"}
          </button>
        ))}
      </div>

      <div className="label-eyebrow mt-6 mb-3">Recent Activity</div>

      <div className="flex flex-col gap-3">
        {filtered.map((o) => (
          <Link key={o.id} to="/orders/$id" params={{ id: String(o.id) }} className="card-bz block">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-bold text-[17px] truncate">{o.contactName}</div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">
                  {new Date(o.orderDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}
                </div>
              </div>
              <StatusBadge status={o.status === "PAID" ? "PAID" : "DUE"} />
            </div>
            <div className="mt-3">
              <div className="label-eyebrow text-primary">Line Items</div>
              <div className="mt-1 flex items-end justify-between gap-3">
                <div className="italic text-sm text-foreground/90 truncate flex-1">
                  {o.productNames.join(", ") || "—"}
                </div>
                <div className="font-bold text-primary text-glow text-[17px] shrink-0">{formatRp(o.total)}</div>
              </div>
            </div>
          </Link>
        ))}
        {rows && filtered.length === 0 && (
          <div className="card-bz text-center text-sm text-muted-foreground">No orders match your filter.</div>
        )}
      </div>

      <FAB to="/orders/new"><Plus size={24} strokeWidth={2.5} /></FAB>
    </AppShell>
  );
}
