import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { db, deleteOrder, formatRp, markOrderPaid } from "@/lib/db";
import { AppShell, StatusBadge } from "@/components/AppShell";
import { ArrowLeft, Lock, CheckCircle2, Trash2 } from "lucide-react";

export const Route = createFileRoute("/orders/$id")({
  head: () => ({ meta: [{ title: "Order Detail — BizTrack" }] }),
  component: OrderDetail,
});

function OrderDetail() {
  const { id } = Route.useParams();
  const orderId = Number(id);
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const data = useLiveQuery(async () => {
    const order = await db.orders.get(orderId);
    if (!order) return null;
    const contact = await db.contacts.get(order.contactId);
    const items = await db.orderItems.where({ orderId }).toArray();
    const products = await db.products.bulkGet(items.map((i) => i.productId));
    return {
      order, contact,
      items: items.map((i, idx) => ({ ...i, name: products[idx]?.name ?? "" })),
      total: items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
      savings: items.reduce((s, i) => s + (i.originalUnitPrice - i.unitPrice) * i.quantity, 0),
    };
  }, [orderId]);

  if (!data) return <AppShell hideNav><div className="pt-10 text-center text-muted-foreground">Loading…</div></AppShell>;
  if (!data.order) return <AppShell hideNav><div className="pt-10 text-center">Order not found.</div></AppShell>;

  return (
    <AppShell hideNav>
      <header className="flex items-center gap-3 pt-3 pb-2">
        <Link to="/orders" className="text-primary"><ArrowLeft size={24} /></Link>
        <h1 className="text-xl font-bold">Order #{String(orderId).padStart(5, "0")}</h1>
      </header>

      <div className="card-bz mt-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="label-eyebrow">Client</div>
            <div className="font-bold text-lg mt-1">{data.contact?.name}</div>
          </div>
          <StatusBadge status={data.order.status} />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
          <div>
            <div className="label-eyebrow">Order Date</div>
            <div className="text-sm font-semibold mt-1">{new Date(data.order.orderDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
          </div>
          <div>
            <div className="label-eyebrow">Due Date</div>
            <div className="text-sm font-semibold mt-1 italic">{new Date(data.order.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
          </div>
        </div>
      </div>

      <div className="label-eyebrow mt-6 mb-3">Items</div>
      <div className="flex flex-col gap-3">
        {data.items.map((i) => {
          const lineSavings = (i.originalUnitPrice - i.unitPrice) * i.quantity;
          return (
            <div key={i.id} className="card-bz">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold">{i.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{i.quantity} × {formatRp(i.unitPrice)}</div>
                  {lineSavings > 0 && <div className="text-xs italic text-primary mt-1">Hemat {formatRp(lineSavings)}</div>}
                </div>
                <div className="font-bold">{formatRp(i.unitPrice * i.quantity)}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card-bz mt-4 border-primary/30">
        {data.savings > 0 && (
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground italic">Total Savings</span>
            <span className="text-primary font-bold italic">- {formatRp(data.savings)}</span>
          </div>
        )}
        <div className="flex justify-between items-end">
          <span className="font-bold">Grand Total</span>
          <span className="text-primary text-glow text-2xl font-bold">{formatRp(data.total)}</span>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 mb-4">
        {data.order.status === "DUE" ? (
          <button onClick={() => markOrderPaid(orderId)} className="btn-primary w-full">
            <CheckCircle2 size={18} /> Mark as Paid
          </button>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground text-sm justify-center py-2">
            <Lock size={14} /> Paid orders are locked
          </div>
        )}
        <button onClick={() => setConfirmDelete(true)} className="btn-danger w-full">
          <Trash2 size={16} /> Delete Order
        </button>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/80 z-50 grid place-items-center px-6 max-w-md mx-auto">
          <div className="card-bz w-full">
            <div className="font-bold text-lg">Delete this order?</div>
            <p className="text-sm text-muted-foreground mt-2">Stock will be restored:</p>
            <ul className="mt-2 text-sm flex flex-col gap-1">
              {data.items.map((i) => <li key={i.id} className="flex justify-between"><span>{i.name}</span><span className="text-primary">+{i.quantity}</span></li>)}
            </ul>
            <div className="flex gap-2 mt-5">
              <button className="btn-secondary flex-1" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button className="btn-danger flex-1" onClick={async () => { await deleteOrder(orderId); navigate({ to: "/orders" }); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
