import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, Plus, X } from "lucide-react";

export const Route = createFileRoute("/products/new")({
  head: () => ({ meta: [{ title: "New Product — BizTrack" }] }),
  component: () => <ProductForm />,
});

export function ProductForm({ id }: { id?: number }) {
  const navigate = useNavigate();
  const cats = useLiveQuery(() => db.productCategories.toArray(), []);
  const tiers = useLiveQuery(() => db.discountTiers.toArray(), []);
  const existing = useLiveQuery(async () => id ? await db.products.get(id) : undefined, [id]);
  const existingDiscs = useLiveQuery(async () => id ? await db.productTierDiscounts.where({ productId: id }).toArray() : [], [id]);

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [newCatMode, setNewCatMode] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [realPrice, setRealPrice] = useState("");
  const [stockCount, setStockCount] = useState("0");
  const [discs, setDiscs] = useState<{ tierId: number | ""; pct: string }[]>([]);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setCategoryId(existing.categoryId);
      setRealPrice(String(existing.realPrice));
      setStockCount(String(existing.stockCount));
    }
  }, [existing]);
  useEffect(() => {
    if (existingDiscs && existingDiscs.length) setDiscs(existingDiscs.map((d) => ({ tierId: d.tierId, pct: String(d.discountPercent) })));
  }, [existingDiscs]);

  async function save() {
    if (!name.trim() || !realPrice) return;
    let catId = categoryId;
    if (newCatMode && newCat.trim()) catId = await db.productCategories.add({ name: newCat.trim() });
    if (catId === "" || catId == null) return;
    const payload = {
      name: name.trim(), categoryId: Number(catId),
      realPrice: Number(realPrice), stockCount: Number(stockCount),
    };
    let pid: number;
    if (id) {
      await db.products.update(id, payload);
      pid = id;
      await db.productTierDiscounts.where({ productId: id }).delete();
    } else {
      pid = await db.products.add({ ...payload, isArchived: false, createdAt: Date.now() });
    }
    for (const d of discs) {
      if (d.tierId !== "" && d.pct) {
        await db.productTierDiscounts.add({ productId: pid, tierId: Number(d.tierId), discountPercent: Number(d.pct) });
      }
    }
    navigate({ to: "/products/$id", params: { id: String(pid) } });
  }

  return (
    <AppShell hideNav>
      <header className="flex items-center gap-3 pt-3 pb-2">
        <Link to="/products" className="text-primary"><ArrowLeft size={24} /></Link>
        <h1 className="text-xl font-bold">{id ? "Edit Product" : "New Product"}</h1>
      </header>

      <div className="mt-6 flex flex-col gap-4">
        <Field label="Name"><input className="input-bz" value={name} onChange={(e) => setName(e.target.value)} /></Field>

        <Field label="Category">
          {!newCatMode ? (
            <div className="flex gap-2">
              <select className="input-bz flex-1" value={categoryId} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")}>
                <option value="">— Select —</option>
                {cats?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button className="btn-secondary" onClick={() => setNewCatMode(true)}><Plus size={16} /></button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input className="input-bz flex-1" placeholder="New category" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
              <button className="btn-secondary" onClick={() => { setNewCatMode(false); setNewCat(""); }}><X size={16} /></button>
            </div>
          )}
        </Field>

        <Field label="Real Price (Rp)"><input type="number" className="input-bz" value={realPrice} onChange={(e) => setRealPrice(e.target.value)} /></Field>
        <Field label="Stock Count"><input type="number" className="input-bz" value={stockCount} onChange={(e) => setStockCount(e.target.value)} /></Field>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="label-eyebrow">Tier Discounts</span>
            <button onClick={() => setDiscs([...discs, { tierId: "", pct: "" }])} className="text-primary text-xs font-bold tracking-wider uppercase flex items-center gap-1">
              <Plus size={12} /> Add
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {discs.map((d, i) => (
              <div key={i} className="flex gap-2">
                <select className="input-bz flex-1" value={d.tierId} onChange={(e) => setDiscs(discs.map((x, j) => j === i ? { ...x, tierId: e.target.value ? Number(e.target.value) : "" } : x))}>
                  <option value="">— Tier —</option>
                  {tiers?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <input type="number" placeholder="%" className="input-bz w-24" value={d.pct} onChange={(e) => setDiscs(discs.map((x, j) => j === i ? { ...x, pct: e.target.value } : x))} />
                <button className="btn-secondary" onClick={() => setDiscs(discs.filter((_, j) => j !== i))}><X size={16} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mt-4 mb-6">
          <Link to="/products" className="btn-secondary flex-1">Cancel</Link>
          <button onClick={save} className="btn-primary flex-1 h-12">Save</button>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-2"><span className="label-eyebrow">{label}</span>{children}</label>;
}
