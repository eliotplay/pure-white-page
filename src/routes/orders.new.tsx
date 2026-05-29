import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useMemo, useState } from "react";
import { db, formatRp, createOrder, resolveUnitPrice } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, ChevronDown, Plus, Minus, Sparkles, Receipt } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/orders/new")({
  head: () => ({ meta: [{ title: "New Order — BizTrack" }] }),
  component: NewOrder,
});

type Line = { productId: number; quantity: number; unit: number; original: number };

function NewOrder() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const contacts = useLiveQuery(() => db.contacts.filter((c) => !c.isArchived).toArray(), []);
  const products = useLiveQuery(() => db.products.filter((p) => !p.isArchived).toArray(), []);
  const categories = useLiveQuery(() => db.productCategories.toArray(), []);

  const [contactId, setContactId] = useState<number | null>(null);
  const [contactQ, setContactQ] = useState("");
  const [contactOpen, setContactOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productQ, setProductQ] = useState("");
  const [filterCatId, setFilterCatId] = useState<number | "all">("all");
  const [receiptId, setReceiptId] = useState<number | null>(null);

  const selectedContact = contacts?.find((c) => c.id === contactId) ?? null;

  // re-resolve prices when contact changes
  useEffect(() => {
    if (!contactId || lines.length === 0) return;
    (async () => {
      const updated = await Promise.all(lines.map(async (l) => {
        const { unit, original } = await resolveUnitPrice(l.productId, contactId);
        return { ...l, unit, original };
      }));
      setLines(updated);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId]);

  const filteredContacts = useMemo(() => {
    if (!contacts) return [];
    return contacts.filter((c) => c.name.toLowerCase().includes(contactQ.toLowerCase()));
  }, [contacts, contactQ]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      if (filterCatId !== "all" && p.categoryId !== filterCatId) return false;
      return p.name.toLowerCase().includes(productQ.toLowerCase());
    });
  }, [products, productQ, filterCatId]);

  const subtotal = lines.reduce((s, l) => s + l.original * l.quantity, 0);
  const grand = lines.reduce((s, l) => s + l.unit * l.quantity, 0);
  const savings = subtotal - grand;

  async function addProduct(pid: number) {
    if (!contactId) return;
    if (lines.find((l) => l.productId === pid)) {
      setLines(lines.map((l) => l.productId === pid ? { ...l, quantity: l.quantity + 1 } : l));
    } else {
      const { unit, original } = await resolveUnitPrice(pid, contactId);
      setLines([...lines, { productId: pid, quantity: 1, unit, original }]);
    }
    setShowProductPicker(false);
    setProductQ("");
  }

  function setQty(pid: number, q: number) {
    if (q <= 0) { setLines(lines.filter((l) => l.productId !== pid)); return; }
    setLines(lines.map((l) => l.productId === pid ? { ...l, quantity: q } : l));
  }

  async function place() {
    if (!contactId || lines.length === 0) return;
    const id = await createOrder({
      contactId,
      items: lines.map((l) => ({
        productId: l.productId, quantity: l.quantity,
        unitPrice: l.unit, originalUnitPrice: l.original,
      })),
    });
    setReceiptId(id);
  }

  return (
    <AppShell hideNav>
      <header className="flex items-center gap-3 pt-3 pb-2">
        <Link to="/orders" className="text-primary"><ArrowLeft size={24} /></Link>
        <h1 className="text-xl font-bold">New Order</h1>
      </header>

      <section className="mt-6">
        <div className="label-eyebrow mb-3 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Select Client
        </div>
        <button onClick={() => setContactOpen((v) => !v)} className="input-bz flex items-center justify-between text-left">
          <span className={selectedContact ? "text-foreground" : "text-muted-foreground"}>
            {selectedContact ? selectedContact.name : "Search client…"}
          </span>
          <ChevronDown size={18} className="text-muted-foreground" />
        </button>
        {contactOpen && (
          <div className="card-bz mt-2 p-2 flex flex-col gap-1 max-h-72 overflow-y-auto">
            <div className="relative">
              <input className="input-bz mb-2" placeholder="Search…" value={contactQ} onChange={(e) => setContactQ(e.target.value)} autoFocus />
            </div>
            {filteredContacts.map((c) => (
              <button key={c.id} onClick={() => { setContactId(c.id!); setContactOpen(false); setContactQ(""); }}
                className="text-left px-3 py-3 rounded-lg hover:bg-surface-elevated font-medium">
                {c.name}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="label-eyebrow flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Order Items
          </div>
          <button onClick={() => setShowProductPicker(true)} disabled={!contactId}
            className="text-primary font-bold text-xs tracking-wider uppercase flex items-center gap-1.5 disabled:opacity-40">
            <span className="h-5 w-5 rounded-full border-2 border-primary grid place-items-center"><Plus size={12} strokeWidth={3} /></span>
            Add Product
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {lines.map((l) => {
            const p = products?.find((x) => x.id === l.productId);
            if (!p) return null;
            return (
              <div key={l.productId} className="card-bz flex items-center gap-3">
                <div className="h-14 w-14 rounded-xl bg-surface-elevated border border-border grid place-items-center text-lg shrink-0">
                  {p.icon || "🍽️"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground italic mt-0.5">{formatRp(l.unit)} / unit</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="inline-flex items-center gap-2 bg-surface-elevated border border-border rounded-full px-2 py-1">
                    <button onClick={() => setQty(l.productId, l.quantity - 1)} className="h-7 w-7 grid place-items-center text-muted-foreground"><Minus size={14} /></button>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={l.quantity}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^\d]/g, "");
                        setQty(l.productId, v === "" ? 0 : Number(v));
                      }}
                      className="w-8 text-center font-bold bg-transparent outline-none"
                      aria-label={t("quantity")}
                    />
                    <button onClick={() => setQty(l.productId, l.quantity + 1)} className="h-7 w-7 grid place-items-center text-muted-foreground"><Plus size={14} /></button>
                  </div>
                  <div className="text-primary font-bold mt-1.5">{formatRp(l.unit * l.quantity)}</div>
                </div>
              </div>
            );
          })}
          {lines.length === 0 && (
            <div className="card-bz text-center text-sm text-muted-foreground">
              {contactId ? "Tap “Add Product” to start." : "Select a client first."}
            </div>
          )}
        </div>
      </section>

      {lines.length > 0 && (
        <div className="card-bz mt-6 border-primary/30">
          <div className="flex items-center justify-between py-1">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">{formatRp(subtotal)}</span>
          </div>
          {savings > 0 && (
            <>
              <div className="h-px bg-border my-2" />
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground italic">Discount Applied</span>
                <span className="text-primary font-medium italic flex items-center gap-1.5">
                  <Sparkles size={14} /> Hemat {formatRp(savings)}
                </span>
              </div>
            </>
          )}
          <div className="h-px bg-border my-2" />
          <div className="flex items-center justify-between pt-2">
            <span className="label-eyebrow">Grand Total</span>
            <span className="text-primary text-glow text-[28px] font-bold">{formatRp(grand)}</span>
          </div>
        </div>
      )}

      <div className="mt-8 mb-4">
        <button onClick={place} disabled={!contactId || lines.length === 0}
          className="btn-primary w-full disabled:opacity-40 disabled:shadow-none">
          <Receipt size={18} /> Place Order
        </button>
      </div>

      {showProductPicker && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center px-4 pt-8 max-w-md mx-auto" onClick={() => setShowProductPicker(false)}>
          <div className="bg-surface w-full rounded-3xl p-5 max-h-[80dvh] flex flex-col gap-3 shadow-2xl border border-border" onClick={(e) => e.stopPropagation()}>
            <div className="font-bold text-lg">Add Product</div>
            <div className="relative">
              <input className="input-bz" placeholder="Search products…" value={productQ} onChange={(e) => setProductQ(e.target.value)} autoFocus />
            </div>
            <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
              <button
                onClick={() => setFilterCatId("all")}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border ${filterCatId === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-surface-elevated border-border text-muted-foreground"}`}
              >
                {t("filter_all")}
              </button>
              {categories?.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setFilterCatId(c.id!)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border ${filterCatId === c.id ? "bg-primary text-primary-foreground border-primary" : "bg-surface-elevated border-border text-muted-foreground"}`}
                >
                  {c.icon ? `${c.icon} ` : ""}{c.name}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-2">
              {filteredProducts.map((p) => (
                <button key={p.id} onClick={() => addProduct(p.id!)}
                  className="card-bz text-left flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-surface-elevated border border-border grid place-items-center text-base">
                      {p.icon || "🍽️"}
                    </div>
                    <div>
                      <div className="font-bold">{p.name}</div>
                      <div className="text-xs text-primary mt-0.5">{formatRp(p.realPrice)}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">Stock: <span className={p.stockCount < 0 ? "text-warning" : ""}>{p.stockCount}</span></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {receiptId != null && <ReceiptSheet orderId={receiptId} onClose={() => navigate({ to: "/orders" })} />}
    </AppShell>
  );
}

function ReceiptSheet({ orderId, onClose }: { orderId: number; onClose: () => void }) {
  const data = useLiveQuery(async () => {
    const order = await db.orders.get(orderId);
    if (!order) return null;
    const contact = await db.contacts.get(order.contactId);
    const items = await db.orderItems.where({ orderId }).toArray();
    const products = await db.products.bulkGet(items.map((i) => i.productId));
    return {
      order, contact,
      items: items.map((i, idx) => ({ ...i, name: products[idx]?.name ?? "" })),
      savings: items.reduce((s, i) => s + (i.originalUnitPrice - i.unitPrice) * i.quantity, 0),
      grand: items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
    };
  }, [orderId]);
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end max-w-md mx-auto">
      <div className="bg-surface w-full rounded-t-3xl px-6 pb-6 pt-4 max-h-[90vh] overflow-y-auto">
        <div className="h-1 w-10 bg-border rounded-full mx-auto" />
        <div className="text-center mt-6">
          <div className="h-16 w-16 rounded-full bg-primary/15 border border-primary/40 grid place-items-center mx-auto glow-primary-sm">
            <Receipt size={28} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold mt-4">Order Receipt</h2>
          <div className="label-eyebrow mt-2">{data.contact?.name} · #BT-{String(orderId).padStart(5, "0")}</div>
        </div>

        <div className="mt-8 flex flex-col gap-4">
          {data.items.map((i) => (
            <div key={i.id} className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{i.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{i.quantity} × {formatRp(i.unitPrice)}</div>
              </div>
              <div className="font-semibold">{formatRp(i.unitPrice * i.quantity)}</div>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-border my-5" />

        {data.savings > 0 && (
          <div className="flex items-center justify-between mb-4">
            <span className="label-eyebrow">Total Savings</span>
            <span className="text-primary font-bold italic">- {formatRp(data.savings)}</span>
          </div>
        )}

        <div className="flex items-end justify-between">
          <span className="text-xl font-bold">Grand Total</span>
          <span className="text-primary text-glow text-3xl font-bold">{formatRp(data.grand)}</span>
        </div>

        <button onClick={onClose} className="btn-primary w-full mt-8">Done ✓</button>
      </div>
    </div>
  );
}
