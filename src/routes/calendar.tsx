import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useState, useMemo } from "react";
import { db, formatRp } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/calendar")({
  head: () => ({ meta: [{ title: "Calendar — BizTrack" }] }),
  component: CalendarPage,
});

type View = "ORDERS" | "DUE";

function CalendarPage() {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selected, setSelected] = useState<Date | null>(new Date());
  const [view, setView] = useState<View>("ORDERS");

  const data = useLiveQuery(async () => {
    const orders = await db.orders.filter((o) => !o.isArchived).toArray();
    const items = await db.orderItems.toArray();
    const contacts = await db.contacts.toArray();
    return orders.map((o) => ({
      ...o,
      contact: contacts.find((c) => c.id === o.contactId)?.name ?? "Unknown",
      total: items.filter((i) => i.orderId === o.id).reduce((s, i) => s + i.unitPrice * i.quantity, 0),
    }));
  }, []);

  const cells = useMemo(() => {
    const first = new Date(cursor);
    const startDow = first.getDay();
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const arr: ({ d: number; date: Date } | null)[] = [];
    for (let i = 0; i < startDow; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push({ d, date: new Date(cursor.getFullYear(), cursor.getMonth(), d) });
    return arr;
  }, [cursor]);

  function sameDay(a: number, b: Date) { const da = new Date(a); return da.getFullYear() === b.getFullYear() && da.getMonth() === b.getMonth() && da.getDate() === b.getDate(); }

  const selectedRows = useMemo(() => {
    if (!data || !selected) return [];
    return data.filter((o) => view === "ORDERS" ? sameDay(o.orderDate, selected) : (o.status === "DUE" && sameDay(o.dueDate, selected)));
  }, [data, selected, view]);

  return (
    <AppShell>
      <header className="flex items-center gap-3 pt-3 pb-2">
        <Link to="/more" className="text-primary"><ArrowLeft size={24} /></Link>
      </header>
      <h1 className="text-[28px] font-bold pt-3 pb-4">Calendar</h1>

      <div className="flex gap-2 mb-4">
        <button className={`chip flex-1 ${view === "ORDERS" ? "chip-active" : ""}`} onClick={() => setView("ORDERS")}>Orders</button>
        <button className={`chip flex-1 ${view === "DUE" ? "chip-active" : ""}`} onClick={() => setView("DUE")}>Due Dates</button>
      </div>

      <div className="card-bz">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="h-8 w-8 grid place-items-center text-muted-foreground"><ChevronLeft size={18} /></button>
          <div className="font-bold">{cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="h-8 w-8 grid place-items-center text-muted-foreground"><ChevronRight size={18} /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
          {["S","M","T","W","T","F","S"].map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((c, i) => {
            if (!c) return <div key={i} />;
            const hasOrder = data?.some((o) => sameDay(o.orderDate, c.date));
            const hasDue = data?.some((o) => o.status === "DUE" && sameDay(o.dueDate, c.date));
            const isSelected = selected && sameDay(c.date.getTime(), selected);
            return (
              <button key={i} onClick={() => setSelected(c.date)} className={`relative aspect-square rounded-lg text-sm font-medium flex items-center justify-center
                ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-surface-elevated"}`}>
                {c.d}
                <span className="absolute bottom-1 flex gap-0.5">
                  {hasOrder && <span className={`h-1 w-1 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-primary"}`} />}
                  {hasDue && <span className={`h-1 w-1 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-warning"}`} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="label-eyebrow mt-6 mb-3">
        {selected ? selected.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long" }) : "Select a day"}
      </div>
      <div className="flex flex-col gap-3 mb-4">
        {selectedRows.map((o) => (
          <Link key={o.id} to="/orders/$id" params={{ id: String(o.id) }} className="card-bz flex justify-between items-center">
            <div>
              <div className="font-bold">{o.contact}</div>
              <div className="text-xs text-muted-foreground italic mt-0.5">#BT-{String(o.id).padStart(4, "0")}</div>
            </div>
            <div className="font-bold text-primary">{formatRp(o.total)}</div>
          </Link>
        ))}
        {selectedRows.length === 0 && <div className="card-bz text-center text-sm text-muted-foreground">Nothing on this day.</div>}
      </div>
    </AppShell>
  );
}
