import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useState, useMemo } from "react";
import { db, formatRp } from "@/lib/db";
import { AppShell, FAB } from "@/components/AppShell";
import { Plus, Package, TrendingUp, ClipboardCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/products/")({
  head: () => ({ meta: [{ title: "Products — BizTrack" }] }),
  component: ProductsPage,
});

function ProductsPage() {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<number | "ALL">("ALL");

  const data = useLiveQuery(async () => {
    const products = await db.products.filter((p) => !p.isArchived).toArray();
    const categories = await db.productCategories.toArray();
    const items = await db.orderItems.toArray();
    const sales = new Map<number, number>();
    items.forEach((i) => sales.set(i.productId, (sales.get(i.productId) ?? 0) + i.quantity * i.unitPrice));
    const lowStock = products.filter((p) => p.stockCount <= 0).length;
    const bestId = [...sales.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const best = products.find((p) => p.id === bestId);
    return { products, categories, lowStock, best };
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.products.filter((p) => {
      if (cat !== "ALL" && p.categoryId !== cat) return false;
      if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [data, q, cat]);

  return (
    <AppShell>
      <h1 className="text-[28px] font-bold pt-5 pb-1">{t("inventory")}</h1>
      <p className="text-sm text-muted-foreground mb-4">{t("product_list")}</p>

      <div className="relative">
        <input className="input-bz" placeholder={t("search_products")} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="flex gap-5 mt-5 overflow-x-auto scrollbar-none">
        <button onClick={() => setCat("ALL")} className={`text-xs font-bold tracking-widest uppercase pb-1 border-b-2 ${cat === "ALL" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>{t("all")}</button>
        {data?.categories.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id!)} className={`text-xs font-bold tracking-widest uppercase pb-1 border-b-2 whitespace-nowrap ${cat === c.id ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>{c.name}</button>
        ))}
      </div>

      <div className="label-eyebrow mt-6 mb-3">{t("product_list")}</div>

      <div className="flex flex-col gap-3">
        {filtered.map((p) => (
          <Link key={p.id} to="/products/$id" params={{ id: String(p.id) }} className="card-bz flex items-center gap-3">
            <span className="h-12 w-12 rounded-full bg-surface-elevated border border-border grid place-items-center shrink-0">
              <Package size={20} className="text-primary" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-bold truncate">{p.name}</div>
              <div className="text-primary text-sm font-semibold mt-0.5">{formatRp(p.realPrice)}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="label-eyebrow">{t("stock")}</div>
              <div className={`text-lg font-bold ${p.stockCount < 0 ? "text-warning" : p.stockCount === 0 ? "text-muted-foreground" : "text-foreground"}`}>{p.stockCount}</div>
            </div>
          </Link>
        ))}
      </div>

      {data && (
        <div className="grid grid-cols-2 gap-3 mt-5 mb-4">
          <div className="card-bz border-primary/30">
            <TrendingUp size={18} className="text-primary" />
            <div className="label-eyebrow mt-3">{t("best_seller")}</div>
            <div className="font-bold mt-1 truncate">{data.best?.name ?? "—"}</div>
          </div>
          <div className="card-bz">
            <ClipboardCheck size={18} className="text-muted-foreground" />
            <div className="label-eyebrow mt-3">{t("low_stock")}</div>
            <div className="font-bold mt-1">{data.lowStock} {t("items")}</div>
          </div>
        </div>
      )}

      <FAB to="/products/new"><Plus size={24} strokeWidth={2.5} /></FAB>
    </AppShell>
  );
}
