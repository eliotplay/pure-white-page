import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { db, formatRp, restockProduct } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, Edit3, Archive, Package, Plus } from "lucide-react";
import { ProductForm } from "./products.new";

export const Route = createFileRoute("/products/$id")({
  head: () => ({ meta: [{ title: "Product — BizTrack" }] }),
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const pid = Number(id);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [restockOpen, setRestockOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const data = useLiveQuery(async () => {
    const product = await db.products.get(pid);
    if (!product) return null;
    const category = await db.productCategories.get(product.categoryId);
    const discs = await db.productTierDiscounts.where({ productId: pid }).toArray();
    const tiers = await db.discountTiers.bulkGet(discs.map((d) => d.tierId));
    const logs = await db.restockLogs.where({ productId: pid }).reverse().sortBy("date");
    return {
      product, category,
      discounts: discs.map((d, i) => ({ ...d, tier: tiers[i] })),
      logs: logs.slice(0, 20),
    };
  }, [pid]);

  if (editing) return <ProductForm id={pid} />;
  if (!data?.product) return <AppShell hideNav><div className="pt-10 text-center text-muted-foreground">Loading…</div></AppShell>;

  const p = data.product;

  async function archive() {
    await db.products.update(pid, { isArchived: true });
    navigate({ to: "/products" });
  }

  async function doRestock() {
    if (!amount) return;
    await restockProduct(pid, Number(amount), notes || undefined);
    setRestockOpen(false); setAmount(""); setNotes("");
  }

  return (
    <AppShell hideNav>
      <header className="flex items-center gap-3 pt-3 pb-2">
        <Link to="/products" className="text-primary"><ArrowLeft size={24} /></Link>
        <h1 className="text-xl font-bold">Product</h1>
      </header>

      <div className="card-bz mt-5">
        <div className="flex items-start gap-3">
          <span className="h-14 w-14 rounded-full bg-primary/10 border border-primary/40 grid place-items-center shrink-0">
            <Package size={24} className="text-primary" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-lg truncate">{p.name}</div>
            <div className="text-xs text-muted-foreground italic">{data.category?.name}</div>
            <div className="text-primary text-glow text-xl font-bold mt-1">{formatRp(p.realPrice)}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="label-eyebrow">Stock</div>
            <div className={`text-2xl font-bold ${p.stockCount < 0 ? "text-warning" : ""}`}>{p.stockCount}</div>
          </div>
        </div>
      </div>

      <button onClick={() => setRestockOpen(true)} className="btn-primary w-full mt-4"><Plus size={18} /> Restock</button>
      <div className="flex gap-2 mt-3">
        <button onClick={() => setEditing(true)} className="btn-secondary flex-1"><Edit3 size={16} /> Edit</button>
        <button onClick={archive} className="btn-danger flex-1"><Archive size={16} /> Archive</button>
      </div>

      <div className="label-eyebrow mt-6 mb-3">Tier Discounts</div>
      {data.discounts.length === 0 ? (
        <div className="card-bz text-sm text-muted-foreground text-center">No tier discounts</div>
      ) : (
        <div className="flex flex-col gap-2">
          {data.discounts.map((d) => (
            <div key={d.id} className="card-bz flex items-center justify-between py-3">
              <span className="font-semibold">{d.tier?.name ?? "—"}</span>
              <span className="text-primary font-bold">-{d.discountPercent}%</span>
            </div>
          ))}
        </div>
      )}

      <div className="label-eyebrow mt-6 mb-3">Restock Log</div>
      {data.logs.length === 0 ? (
        <div className="card-bz text-sm text-muted-foreground text-center mb-4">No restocks yet</div>
      ) : (
        <div className="flex flex-col gap-2 mb-4">
          {data.logs.map((l) => (
            <div key={l.id} className="card-bz flex items-center justify-between py-3">
              <div>
                <div className="font-semibold">+{l.amount} units</div>
                {l.notes && <div className="text-xs text-muted-foreground italic mt-0.5">{l.notes}</div>}
              </div>
              <div className="text-xs text-muted-foreground italic">{new Date(l.date).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}

      {restockOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end max-w-md mx-auto" onClick={() => setRestockOpen(false)}>
          <div className="bg-surface w-full rounded-t-3xl p-5 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="h-1 w-10 bg-border rounded-full mx-auto" />
            <div className="font-bold text-lg">Restock {p.name}</div>
            <input type="number" placeholder="Amount" className="input-bz" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
            <input placeholder="Notes (optional)" className="input-bz" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <button onClick={doRestock} className="btn-primary w-full mt-2">Confirm Restock</button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
