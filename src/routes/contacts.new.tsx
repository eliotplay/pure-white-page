import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { db, type Contact } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft } from "lucide-react";
import { TierPicker } from "@/components/TierPicker";

export const Route = createFileRoute("/contacts/new")({
  head: () => ({ meta: [{ title: "New Contact — BizTrack" }] }),
  component: () => <ContactForm />,
});

export function ContactForm({ id }: { id?: number }) {
  const navigate = useNavigate();
  const tiers = useLiveQuery(() => db.discountTiers.toArray(), []);
  const existing = useLiveQuery(async () => id ? await db.contacts.get(id) : undefined, [id]);

  const [form, setForm] = useState<Omit<Contact, "id" | "createdAt" | "isArchived">>({
    name: "", phone: "", address: "", discountTierId: null, personalDiscountPercent: null,
  });

  useEffect(() => {
    if (existing) setForm({
      name: existing.name, phone: existing.phone, address: existing.address,
      discountTierId: existing.discountTierId ?? null,
      personalDiscountPercent: existing.personalDiscountPercent ?? null,
    });
  }, [existing]);

  async function save() {
    if (!form.name.trim()) return;
    if (id) {
      await db.contacts.update(id, form);
      navigate({ to: "/contacts/$id", params: { id: String(id) } });
    } else {
      const newId = await db.contacts.add({ ...form, isArchived: false, createdAt: Date.now() });
      navigate({ to: "/contacts/$id", params: { id: String(newId) } });
    }
  }

  return (
    <AppShell hideNav>
      <header className="flex items-center gap-3 pt-3 pb-2">
        <Link to="/contacts" className="text-primary"><ArrowLeft size={24} /></Link>
        <h1 className="text-xl font-bold">{id ? "Edit Contact" : "New Contact"}</h1>
      </header>

      <div className="mt-6 flex flex-col gap-4">
        <Field label="Name">
          <input className="input-bz" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Phone">
          <input className="input-bz" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Field label="Address">
          <textarea className="input-bz py-3" style={{ height: 96 }} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </Field>
        <Field label="Discount Tier">
          <TierPicker
            value={form.discountTierId ?? ""}
            onChange={(id) => setForm({ ...form, discountTierId: id === "" ? null : id })}
            items={tiers}
            onCreate={async (n, p) => await db.discountTiers.add({ name: n, discountPercent: p })}
            onDelete={async (tid) => { await db.discountTiers.delete(tid); }}
          />
        </Field>
        <Field label="Personal Override % (replaces tier)">
          <input type="number" min={0} max={100} className="input-bz" value={form.personalDiscountPercent ?? ""}
            onChange={(e) => setForm({ ...form, personalDiscountPercent: e.target.value === "" ? null : Number(e.target.value) })} />
        </Field>

        <div className="flex gap-2 mt-4 mb-6">
          <Link to="/contacts" className="btn-secondary flex-1">Cancel</Link>
          <button onClick={save} className="btn-primary flex-1 h-12">Save</button>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="label-eyebrow">{label}</span>
      {children}
    </label>
  );
}
