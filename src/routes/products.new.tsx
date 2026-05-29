import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, Plus, X } from "lucide-react";
import { CategoryPicker } from "@/components/CategoryPicker";
import { MoneyInput } from "@/components/MoneyInput";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/products/new")({
  head: () => ({ meta: [{ title: "New Product — BizTrack" }] }),
  component: () => <ProductForm />,
});

export function ProductForm({ id }: { id?: number }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const cats = useLiveQuery(() => db.productCategories.toArray(), []);
  const tiers = useLiveQuery(() => db.discountTiers.toArray(), []);
  const existing = useLiveQuery(async () => id ? await db.products.get(id) : undefined, [id]);
  const existingDiscs = useLiveQuery(async () => id ? await db.productTierDiscounts.where({ productId: id }).toArray() : [], [id]);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [realPrice, setRealPrice] = useState("");
  const [stockCount, setStockCount] = useState("0");
  const [discs, setDiscs] = useState<{ tierId: number | ""; pct: string }[]>([]);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setIcon(existing.icon ?? "");
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
    const catId = categoryId;
    if (catId === "" || catId == null) return;
    const payload = {
      name: name.trim(), categoryId: Number(catId),
      realPrice: Number(realPrice), stockCount: Number(stockCount),
      icon: icon.trim() || undefined,
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
        <h1 className="text-xl font-bold">{id ? t("edit_product") : t("new_product")}</h1>
      </header>

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex gap-3">
          <Field label={t("icon")}>
            <input
              className="input-bz text-center text-xl"
              style={{ width: 64 }}
              maxLength={4}
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="🍽️"
            />
          </Field>
          <div className="flex-1"><Field label={t("name")}><input className="input-bz" value={name} onChange={(e) => setName(e.target.value)} /></Field></div>
        </div>

        <Field label={t("category")}>
          <CategoryPicker
            value={categoryId}
            onChange={setCategoryId}
            items={cats}
            onCreate={async (n, ic) => await db.productCategories.add({ name: n, icon: ic })}
            onDelete={async (cid) => { await db.productCategories.delete(cid); }}
          />
        </Field>

        <Field label={`${t("real_price")} (Rp)`}>
          <MoneyInput value={realPrice} onChange={setRealPrice} placeholder="0" />
        </Field>
        <Field label={t("stock_count")}>
          <input type="number" className="input-bz" value={stockCount} onChange={(e) => setStockCount(e.target.value)} />
        </Field>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="label-eyebrow">{t("tier_discounts")}</span>
            <button onClick={() => setDiscs([...discs, { tierId: "", pct: "" }])} className="text-primary text-xs font-bold tracking-wider uppercase flex items-center gap-1">
              <Plus size={12} /> {t("add")}
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {discs.map((d, i) => (
              <div key={i} className="flex gap-2">
                <select className="input-bz flex-1" value={d.tierId} onChange={(e) => setDiscs(discs.map((x, j) => j === i ? { ...x, tierId: e.target.value ? Number(e.target.value) : "" } : x))}>
                  <option value="">— {t("tier")} —</option>
                  {tiers?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <input type="number" placeholder="%" className="input-bz w-24" value={d.pct} onChange={(e) => setDiscs(discs.map((x, j) => j === i ? { ...x, pct: e.target.value } : x))} />
                <button className="btn-secondary" onClick={() => setDiscs(discs.filter((_, j) => j !== i))}><X size={16} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mt-4 mb-6">
          <Link to="/products" className="btn-secondary flex-1">{t("cancel")}</Link>
          <button onClick={save} className="btn-primary flex-1 h-12">{t("save")}</button>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-2"><span className="label-eyebrow">{label}</span>{children}</label>;
}
