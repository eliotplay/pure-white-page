import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useState, useMemo } from "react";
import { db, formatRp } from "@/lib/db";
import { AppShell, FAB } from "@/components/AppShell";
import { ArrowLeft, Plus, X } from "lucide-react";

export const Route = createFileRoute("/expenses")({
  head: () => ({ meta: [{ title: "Expenses — BizTrack" }] }),
  component: Expenses,
});

function Expenses() {
  const [cat, setCat] = useState<number | "ALL">("ALL");
  const [add, setAdd] = useState(false);

  const data = useLiveQuery(async () => {
    const cats = await db.expenseCategories.toArray();
    const expenses = (await db.expenses.toArray()).sort((a, b) => b.date - a.date);
    const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
    const monthTotal = expenses.filter((e) => e.date >= start.getTime()).reduce((s, e) => s + e.amount, 0);
    return { cats, expenses, monthTotal };
  }, []);

  const list = useMemo(() => (data?.expenses ?? []).filter((e) => cat === "ALL" ? true : e.categoryId === cat), [data, cat]);
  const catName = (id: number) => data?.cats.find((c) => c.id === id)?.name ?? "—";

  return (
    <AppShell>
      <header className="flex items-center gap-3 pt-3 pb-2">
        <Link to="/more" className="text-primary"><ArrowLeft size={24} /></Link>
      </header>
      <h1 className="text-[28px] font-bold pt-3">Expenses</h1>

      <div className="card-bz mt-4">
        <div className="label-eyebrow">This Month</div>
        <div className="text-[28px] font-bold mt-1 text-warning">{formatRp(data?.monthTotal ?? 0)}</div>

      </div>

      <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-none">
        <button className={`chip ${cat === "ALL" ? "chip-active" : ""}`} onClick={() => setCat("ALL")}>All</button>
        {data?.cats.map((c) => (
          <button key={c.id} className={`chip ${cat === c.id ? "chip-active" : ""}`} onClick={() => setCat(c.id!)}>{c.name}</button>
        ))}
      </div>

      <div className="label-eyebrow mt-6 mb-3">Entries</div>
      <div className="flex flex-col gap-3 mb-4">
        {list.map((e) => (
          <div key={e.id} className="card-bz flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground italic">{new Date(e.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</div>
              <div className="font-bold mt-1">{e.notes || catName(e.categoryId)}</div>
              <span className="text-[10px] mt-1 inline-flex font-bold tracking-widest uppercase bg-surface-elevated border border-border px-2 py-0.5 rounded">{catName(e.categoryId)}</span>
            </div>
            <div className="text-warning font-bold">-{formatRp(e.amount)}</div>

          </div>
        ))}
        {list.length === 0 && <div className="card-bz text-center text-sm text-muted-foreground">No expenses recorded.</div>}
      </div>

      <FAB onClick={() => setAdd(true)}><Plus size={24} strokeWidth={2.5} /></FAB>
      {add && <AddExpense onClose={() => setAdd(false)} cats={data?.cats ?? []} />}
    </AppShell>
  );
}

function AddExpense({ onClose, cats }: { onClose: () => void; cats: { id?: number; name: string }[] }) {
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [newCat, setNewCat] = useState("");
  const [newCatMode, setNewCatMode] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  async function save() {
    if (!amount) return;
    let cid = categoryId;
    if (newCatMode && newCat.trim()) cid = await db.expenseCategories.add({ name: newCat.trim() });
    if (cid === "" || cid == null) return;
    await db.expenses.add({
      categoryId: Number(cid), amount: Number(amount),
      date: new Date(date).getTime(), notes: notes || null,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end max-w-md mx-auto" onClick={onClose}>
      <div className="bg-surface w-full rounded-t-3xl p-5 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
        <div className="h-1 w-10 bg-border rounded-full mx-auto" />
        <div className="font-bold text-lg">Add Expense</div>
        <input type="number" placeholder="Amount" className="input-bz" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} />
        {!newCatMode ? (
          <div className="flex gap-2">
            <select className="input-bz flex-1" value={categoryId} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")}>
              <option value="">— Category —</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button className="btn-secondary" onClick={() => setNewCatMode(true)}><Plus size={16} /></button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input className="input-bz flex-1" placeholder="New category" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
            <button className="btn-secondary" onClick={() => setNewCatMode(false)}><X size={16} /></button>
          </div>
        )}
        <input type="date" className="input-bz" value={date} onChange={(e) => setDate(e.target.value)} />
        <input placeholder="Notes" className="input-bz" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <button onClick={save} className="btn-primary w-full mt-2">Save</button>
      </div>
    </div>
  );
}
