import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useState, useMemo } from "react";
import { db, initials } from "@/lib/db";
import { AppShell, FAB } from "@/components/AppShell";
import { Plus, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/contacts/")({
  head: () => ({ meta: [{ title: "Contacts — BizTrack" }] }),
  component: ContactsPage,
});

function ContactsPage() {
  const [q, setQ] = useState("");
  const [tierFilter, setTierFilter] = useState<number | "ALL" | "OVERRIDE">("ALL");

  const data = useLiveQuery(async () => {
    const contacts = await db.contacts.filter((c) => !c.isArchived).toArray();
    const tiers = await db.discountTiers.toArray();
    return { contacts, tiers };
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.contacts.filter((c) => {
      if (tierFilter === "OVERRIDE" && c.personalDiscountPercent == null) return false;
      if (typeof tierFilter === "number" && c.discountTierId !== tierFilter) return false;
      if (q && !c.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [data, q, tierFilter]);

  return (
    <AppShell>
      <h1 className="text-[28px] font-bold pt-5 pb-4">Contacts</h1>

      <div className="relative">
        <input className="input-bz" placeholder="Search contacts…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-none">
        <button className={`chip ${tierFilter === "ALL" ? "chip-active" : ""}`} onClick={() => setTierFilter("ALL")}>All</button>
        {data?.tiers.map((t) => (
          <button key={t.id} className={`chip ${tierFilter === t.id ? "chip-active" : ""}`} onClick={() => setTierFilter(t.id!)}>{t.name}</button>
        ))}
        <button className={`chip ${tierFilter === "OVERRIDE" ? "chip-active" : ""}`} onClick={() => setTierFilter("OVERRIDE")}>Override</button>
      </div>

      <div className="label-eyebrow mt-6 mb-3">Directory</div>

      <div className="flex flex-col gap-3">
        {filtered.map((c) => {
          const tier = data?.tiers.find((t) => t.id === c.discountTierId);
          return (
            <Link key={c.id} to="/contacts/$id" params={{ id: String(c.id) }} className="card-bz flex items-center gap-3">
              <span className="h-11 w-11 rounded-full bg-primary/10 border border-primary/40 grid place-items-center font-bold text-primary text-sm shrink-0">
                {initials(c.name)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{c.name}</div>
                <div className="mt-1 inline-flex">
                  {c.personalDiscountPercent != null ? (
                    <span className="text-[10px] font-bold tracking-widest uppercase bg-primary/15 text-primary px-2 py-0.5 rounded">
                      Override: {c.personalDiscountPercent}%
                    </span>
                  ) : tier ? (
                    <span className="text-[10px] font-bold tracking-widest uppercase bg-primary/15 text-primary px-2 py-0.5 rounded">
                      Tier: {tier.name}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold tracking-widest uppercase bg-surface-elevated border border-border text-muted-foreground px-2 py-0.5 rounded">
                      General
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={18} className="text-muted-foreground" />
            </Link>
          );
        })}
      </div>

      <FAB to="/contacts/new"><Plus size={24} strokeWidth={2.5} /></FAB>
    </AppShell>
  );
}
