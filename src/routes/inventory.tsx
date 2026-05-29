import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useState } from "react";
import { db, formatRp, restockProduct } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, Package, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/inventory")({
  head: () => ({ meta: [{ title: "Inventory — BizTrack" }] }),
  component: Inventory,
});

type Tab = "INVENTORY" | "LOGS";

function Inventory() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("INVENTORY");
  const [q, setQ] = useState("");
  const [restockOpen, setRestockOpen] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const data = useLiveQuery(async () => {
    const products = await db.products.filter((p) => !p.isArchived).toArray();
    const logs = await db.restockLogs.reverse().sortBy("date");
    const productMap = new Map(products.map((p) => [p.id!, p.name]));
    return { products, logs: logs.slice(0, 50).map((l) => ({ ...l, name: productMap.get(l.productId) ?? "—" })) };
  }, []);

  const filtered = useMemo(() => (data?.products ?? []).filter((p) => p.name.toLowerCase().includes(q.toLowerCase())), [data, q]);

  async function doRestock() {
    if (!restockOpen || !amount) return;
    await restockProduct(restockOpen, Number(amount), notes || undefined);
    setRestockOpen(null); setAmount(""); setNotes("");
  }

  return (
    <AppShell>
      <header className="flex items-center gap-3 pt-3 pb-2">
        <Link to="/more" className="text-primary"><ArrowLeft size={24} /></Link>
      </header>
      <h1 className="text-[28px] font-bold pt-3 pb-4">{t("inventory")}</h1>

      <div className="relative">
        <input className="input-bz" placeholder={t("search_inventory")} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="flex gap-2 mt-4">
        <button className={`chip flex-1 ${tab === "INVENTORY" ? "chip-active" : ""}`} onClick={() => setTab("INVENTORY")}>{t("inventory")}</button>
        <button className={`chip flex-1 ${tab === "LOGS" ? "chip-active" : ""}`} onClick={() => setTab("LOGS")}>{t("restock_logs")}</button>
      </div>

      {tab === "INVENTORY" ? (
        <>
          <div className="flex items-center justify-between mt-5 mb-3">
            <div className="label-eyebrow">{t("product_list")}</div>
            <div className="text-xs text-primary font-bold tracking-wider uppercase">{filtered.length} {t("items")}</div>
          </div>
          <div className="flex flex-col gap-3 mb-4">
            {filtered.map((p) => (
              <div key={p.id} className="card-bz">
                <div className="flex items-center gap-3">
                  <span className="h-12 w-12 rounded-full bg-surface-elevated border border-border grid place-items-center">
                    <Package size={20} className="text-primary" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground italic mt-0.5">{formatRp(p.realPrice)}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${p.stockCount < 0 ? "text-warning" : p.stockCount === 0 ? "text-muted-foreground" : "text-primary"}`}>{String(p.stockCount).padStart(2, "0")}</div>
                    <div className="label-eyebrow">{t("units")}</div>
                  </div>
                </div>
                <div className="border-t border-border mt-3 pt-3 flex items-center justify-between">
                  <span className={`text-xs italic font-semibold flex items-center gap-1.5 ${p.stockCount <= 0 ? "text-warning" : p.stockCount < 10 ? "text-warning" : "text-primary"}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {p.stockCount <= 0 ? t("out_of_stock") : p.stockCount < 10 ? t("low_stock_status") : t("healthy")}
                  </span>
                  <button onClick={() => setRestockOpen(p.id!)} className="btn-primary h-9 px-4 text-sm"><Plus size={14} /> {t("restock")}</button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-3 mt-5 mb-4">
          {data?.logs.map((l) => (
            <div key={l.id} className="card-bz flex items-center justify-between">
              <div>
                <div className="font-bold">{l.name}</div>
                {l.notes && <div className="text-xs text-muted-foreground italic mt-0.5">{l.notes}</div>}
              </div>
              <div className="text-right">
                <div className="font-bold text-primary">+{l.amount}</div>
                <div className="text-xs text-muted-foreground italic mt-0.5">{new Date(l.date).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
          {data && data.logs.length === 0 && <div className="card-bz text-center text-sm text-muted-foreground">{t("no_restock")}</div>}
        </div>
      )}

      {restockOpen != null && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end max-w-md mx-auto" onClick={() => setRestockOpen(null)}>
          <div className="bg-surface w-full rounded-t-3xl p-5 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="h-1 w-10 bg-border rounded-full mx-auto" />
            <div className="font-bold text-lg">{t("restock")}</div>
            <input type="number" placeholder={t("amount")} className="input-bz" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} />
            <input placeholder={t("notes_optional")} className="input-bz" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <button onClick={doRestock} className="btn-primary w-full mt-2">{t("confirm")}</button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
