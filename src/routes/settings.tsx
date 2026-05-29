import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { z } from "zod";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, Trash2, RotateCcw, Download } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — BizTrack" }] }),
  validateSearch: z.object({ tab: z.enum(["general", "archive"]).optional() }),
  component: Settings,
});

type Tab = "GENERAL" | "ARCHIVE";
type ArchTab = "CONTACTS" | "PRODUCTS" | "ORDERS";

function Settings() {
  const search = Route.useSearch();
  const { t, lang, setLang } = useI18n();
  const [tab, setTab] = useState<Tab>(search.tab === "archive" ? "ARCHIVE" : "GENERAL");

  return (
    <AppShell>
      <header className="flex items-center gap-3 pt-3 pb-2">
        <Link to="/more" className="text-primary"><ArrowLeft size={24} /></Link>
      </header>
      <h1 className="text-[28px] font-bold pt-3 pb-4">{t("settings")}</h1>

      <div className="flex gap-2">
        <button className={`chip flex-1 ${tab === "GENERAL" ? "chip-active" : ""}`} onClick={() => setTab("GENERAL")}>{t("general")}</button>
        <button className={`chip flex-1 ${tab === "ARCHIVE" ? "chip-active" : ""}`} onClick={() => setTab("ARCHIVE")}>{t("archive")}</button>
      </div>

      {tab === "GENERAL" ? (
        <>
          <div className="label-eyebrow mt-6 mb-3">{t("language")}</div>
          <div className="flex gap-2">
            <button className={`chip flex-1 ${lang === "EN" ? "chip-active" : ""}`} onClick={() => setLang("EN")}>English</button>
            <button className={`chip flex-1 ${lang === "ID" ? "chip-active" : ""}`} onClick={() => setLang("ID")}>Bahasa Indonesia</button>
          </div>

          <div className="label-eyebrow mt-6 mb-3">{t("backup")}</div>
          <div className="flex flex-col gap-2">
            <ExportButton label="Export Contacts" table="contacts" />
            <ExportButton label="Export Orders" table="orders" />
            <ExportButton label="Export Expenses" table="expenses" />
          </div>

          <div className="card-bz mt-6 mb-4">
            <div className="label-eyebrow">{t("app_version")}</div>
            <div className="font-bold mt-1">BizTrack Web 1.0.0</div>
            <div className="text-xs text-muted-foreground italic mt-1">{t("offline_note")}</div>
          </div>
        </>
      ) : (
        <ArchiveManager />
      )}
    </AppShell>
  );
}

function ExportButton({ label, table }: { label: string; table: "contacts" | "orders" | "expenses" }) {
  async function exportJson() {
    const rows = await (db as any)[table].toArray();
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `biztrack-${table}-${Date.now()}.json`;
    a.click(); URL.revokeObjectURL(url);
  }
  async function exportCsv() {
    const rows: any[] = await (db as any)[table].toArray();
    if (rows.length === 0) return;
    const cols = Object.keys(rows[0]);
    const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => JSON.stringify(r[c] ?? "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `biztrack-${table}-${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }
  return (
    <div className="card-bz flex items-center justify-between">
      <span className="font-semibold">{label}</span>
      <div className="flex gap-2">
        <button onClick={exportCsv} className="btn-secondary h-9 px-3 text-xs"><Download size={14} /> CSV</button>
        <button onClick={exportJson} className="btn-secondary h-9 px-3 text-xs"><Download size={14} /> JSON</button>
      </div>
    </div>
  );
}

function ArchiveManager() {
  const [t, setT] = useState<ArchTab>("CONTACTS");
  const data = useLiveQuery(async () => ({
    contacts: await db.contacts.filter((c) => c.isArchived).toArray(),
    products: await db.products.filter((p) => p.isArchived).toArray(),
    orders: await db.orders.filter((o) => o.isArchived).toArray(),
  }), []);

  async function restoreContact(id: number) { await db.contacts.update(id, { isArchived: false }); }
  async function destroyContact(id: number) { await db.contacts.delete(id); }
  async function restoreProduct(id: number) { await db.products.update(id, { isArchived: false }); }
  async function destroyProduct(id: number) { await db.products.delete(id); }

  return (
    <>
      <div className="flex gap-2 mt-5 overflow-x-auto scrollbar-none">
        {(["CONTACTS","PRODUCTS","ORDERS"] as const).map((x) => (
          <button key={x} className={`chip flex-1 ${t === x ? "chip-active" : ""}`} onClick={() => setT(x)}>{x[0] + x.slice(1).toLowerCase()}</button>
        ))}
      </div>
      <div className="flex flex-col gap-3 mt-5 mb-4">
        {t === "CONTACTS" && data?.contacts.map((c) => (
          <div key={c.id} className="card-bz flex items-center justify-between">
            <span className="font-bold">{c.name}</span>
            <div className="flex gap-2">
              <button onClick={() => restoreContact(c.id!)} className="btn-secondary h-9 px-3 text-xs"><RotateCcw size={14} /></button>
              <button onClick={() => destroyContact(c.id!)} className="btn-danger h-9 px-3 text-xs"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {t === "PRODUCTS" && data?.products.map((p) => (
          <div key={p.id} className="card-bz flex items-center justify-between">
            <span className="font-bold">{p.name}</span>
            <div className="flex gap-2">
              <button onClick={() => restoreProduct(p.id!)} className="btn-secondary h-9 px-3 text-xs"><RotateCcw size={14} /></button>
              <button onClick={() => destroyProduct(p.id!)} className="btn-danger h-9 px-3 text-xs"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {t === "ORDERS" && data?.orders.map((o) => (
          <div key={o.id} className="card-bz flex items-center justify-between">
            <span className="font-bold">#BT-{String(o.id).padStart(4, "0")}</span>
            <span className="text-xs text-muted-foreground italic">{new Date(o.orderDate).toLocaleDateString()}</span>
          </div>
        ))}
        {data && ((t === "CONTACTS" && data.contacts.length === 0) || (t === "PRODUCTS" && data.products.length === 0) || (t === "ORDERS" && data.orders.length === 0)) && (
          <div className="card-bz text-center text-sm text-muted-foreground">Nothing archived.</div>
        )}
      </div>
    </>
  );
}
