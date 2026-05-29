import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { db, formatRp, initials } from "@/lib/db";
import { AppShell, StatusBadge } from "@/components/AppShell";
import { ArrowLeft, Edit3, Archive, Phone, MapPin } from "lucide-react";
import { ContactForm } from "./contacts.new";

export const Route = createFileRoute("/contacts/$id")({
  head: () => ({ meta: [{ title: "Contact — BizTrack" }] }),
  component: ContactDetail,
});

function ContactDetail() {
  const { id } = Route.useParams();
  const cid = Number(id);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

  const data = useLiveQuery(async () => {
    const contact = await db.contacts.get(cid);
    if (!contact) return null;
    const tier = contact.discountTierId ? await db.discountTiers.get(contact.discountTierId) : null;
    const orders = await db.orders.where({ contactId: cid }).toArray();
    const items = await db.orderItems.toArray();
    const enriched = orders.map((o) => ({
      ...o,
      total: items.filter((i) => i.orderId === o.id).reduce((s, i) => s + i.unitPrice * i.quantity, 0),
    })).sort((a, b) => b.orderDate - a.orderDate);
    return { contact, tier, orders: enriched };
  }, [cid]);

  if (editing) return <ContactForm id={cid} />;
  if (!data?.contact) return <AppShell hideNav><div className="pt-10 text-center text-muted-foreground">Loading…</div></AppShell>;

  const c = data.contact;

  async function archive() {
    await db.contacts.update(cid, { isArchived: true });
    navigate({ to: "/contacts" });
  }

  return (
    <AppShell hideNav>
      <header className="flex items-center gap-3 pt-3 pb-2">
        <Link to="/contacts" className="text-primary"><ArrowLeft size={24} /></Link>
        <h1 className="text-xl font-bold">Contact</h1>
      </header>

      <div className="card-bz mt-5 text-center">
        <div className="h-16 w-16 rounded-full bg-primary/15 border border-primary/40 grid place-items-center mx-auto font-bold text-xl text-primary">
          {initials(c.name)}
        </div>
        <div className="mt-3 font-bold text-xl">{c.name}</div>
        <div className="mt-1 text-xs text-muted-foreground italic">
          {c.personalDiscountPercent != null ? `Override: ${c.personalDiscountPercent}%` : data.tier ? `Tier: ${data.tier.name} (${data.tier.discountPercent}%)` : "General customer"}
        </div>
        <div className="flex items-center justify-center gap-4 mt-4 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground"><Phone size={14} /> {c.phone}</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-1 text-sm text-muted-foreground">
          <MapPin size={14} /> {c.address}
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button onClick={() => setEditing(true)} className="btn-secondary flex-1"><Edit3 size={16} /> Edit</button>
        <button onClick={archive} className="btn-danger flex-1"><Archive size={16} /> Archive</button>
      </div>

      <div className="label-eyebrow mt-6 mb-3">Order History</div>
      <div className="flex flex-col gap-3 mb-4">
        {data.orders.map((o) => (
          <Link key={o.id} to="/orders/$id" params={{ id: String(o.id) }} className="card-bz flex items-center justify-between">
            <div>
              <div className="font-semibold">#BT-{String(o.id).padStart(5, "0")}</div>
              <div className="text-xs text-muted-foreground italic mt-0.5">{new Date(o.orderDate).toLocaleDateString()}</div>
            </div>
            <div className="text-right">
              <div className="font-bold">{formatRp(o.total)}</div>
              <div className="mt-1"><StatusBadge status={o.status} /></div>
            </div>
          </Link>
        ))}
        {data.orders.length === 0 && <div className="card-bz text-center text-sm text-muted-foreground">No orders yet.</div>}
      </div>
    </AppShell>
  );
}
