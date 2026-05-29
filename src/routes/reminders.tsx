import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db, formatRp } from "@/lib/db";
import { AppShell, StatusBadge } from "@/components/AppShell";
import { ArrowLeft, Bell, CalendarDays, Clock, User } from "lucide-react";

export const Route = createFileRoute("/reminders")({
  head: () => ({ meta: [{ title: "Reminders — BizTrack" }] }),
  component: Reminders,
});

function Reminders() {
  const data = useLiveQuery(async () => {
    const orders = await db.orders.filter((o) => !o.isArchived && o.status === "DUE").toArray();
    const items = await db.orderItems.toArray();
    const contacts = await db.contacts.toArray();
    const now = Date.now();
    const enriched = orders.map((o) => ({
      ...o,
      contact: contacts.find((c) => c.id === o.contactId)?.name ?? "Unknown",
      total: items.filter((i) => i.orderId === o.id).reduce((s, i) => s + i.unitPrice * i.quantity, 0),
      overdue: o.dueDate < now,
    })).sort((a, b) => a.dueDate - b.dueDate);
    const overdue = enriched.filter((o) => o.overdue).reduce((s, o) => s + o.total, 0);
    const upcoming = enriched.filter((o) => !o.overdue).reduce((s, o) => s + o.total, 0);
    return { list: enriched, overdue, upcoming };
  }, []);

  return (
    <AppShell>
      <header className="flex items-center gap-3 pt-3 pb-2">
        <Link to="/more" className="text-primary"><ArrowLeft size={24} /></Link>
      </header>
      <h1 className="text-[28px] font-bold pt-3">Due Payments</h1>
      <div className="label-eyebrow flex items-center gap-2 mt-1"><span>Tagihan Jatuh Tempo</span><span className="h-1.5 w-1.5 rounded-full bg-primary" /></div>

      <div className="grid grid-cols-2 gap-3 mt-5">
        <div className="card-bz relative overflow-hidden">
          <Clock size={20} className="text-primary" />
          <div className="label-eyebrow mt-6">Overdue</div>
          <div className="text-xl font-bold mt-1">{formatRp(data?.overdue ?? 0)}</div>
          <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r" />
        </div>
        <div className="card-bz relative overflow-hidden">
          <CalendarDays size={20} className="text-primary" />
          <div className="label-eyebrow mt-6">Upcoming</div>
          <div className="text-xl font-bold mt-1">{formatRp(data?.upcoming ?? 0)}</div>
          <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r" />
        </div>
      </div>

      <div className="label-eyebrow mt-6 mb-3">Action Required</div>
      <div className="flex flex-col gap-3">
        {data?.list.map((o) => (
          <div key={o.id} className="card-bz">
            <div className="flex items-start gap-3">
              <span className="h-10 w-10 rounded-full bg-surface-elevated border border-border grid place-items-center shrink-0">
                <User size={16} className="text-muted-foreground" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{o.contact}</div>
                <div className="text-xs text-muted-foreground tracking-wider uppercase mt-0.5">Invoice #BT-{String(o.id).padStart(4, "0")}</div>
              </div>
              <StatusBadge status={o.overdue ? "OVERDUE" : "DUE SOON"} />
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground italic">
              <Clock size={12} /> {new Date(o.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-xl font-bold">{formatRp(o.total)}</div>
              <Link to="/orders/$id" params={{ id: String(o.id) }} className={o.overdue ? "btn-primary h-10 px-5 text-sm" : "btn-secondary h-10 px-5 text-sm"}>
                {o.overdue ? "Remind" : "Details"}
              </Link>
            </div>
          </div>
        ))}
        {data && data.list.length === 0 && (
          <div className="card-bz text-center text-sm text-muted-foreground border-dashed">
            <Bell size={20} className="mx-auto mb-2 text-muted-foreground" />
            No payments due. You're all caught up.
          </div>
        )}
      </div>
    </AppShell>
  );
}
