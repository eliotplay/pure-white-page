import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Plus, Trash2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { ConfirmDialog } from "@/components/CategoryPicker";

export interface TierItem { id?: number; name: string; discountPercent: number }

interface Props {
  value: number | "" | null;
  onChange: (id: number | "") => void;
  items: TierItem[] | undefined;
  onCreate: (name: string, pct: number) => Promise<number>;
  onDelete: (id: number) => Promise<void>;
  placeholder?: string;
}

export function TierPicker({ value, onChange, items, onCreate, onDelete, placeholder }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [pct, setPct] = useState("");
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const selected = items?.find((c) => c.id === value);

  async function handleCreate() {
    const n = name.trim();
    const p = Number(pct);
    if (!n || !Number.isFinite(p)) return;
    const id = await onCreate(n, p);
    onChange(id);
    setName(""); setPct(""); setAdding(false); setOpen(false);
  }

  async function handleDelete(id: number) {
    await onDelete(id);
    if (value === id) onChange("");
    setConfirmId(null);
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input-bz flex items-center justify-between text-left pr-4"
      >
        <span className={selected ? "" : "text-muted-foreground"}>
          {selected ? `${selected.name} (${selected.discountPercent}%)` : placeholder ?? `— ${t("none")} —`}
        </span>
        <ChevronDown size={18} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-40 mt-2 w-full rounded-xl border border-border bg-surface-elevated shadow-2xl overflow-hidden">
          <div className="max-h-64 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-surface"
            >
              <Check size={16} className={!value ? "text-primary" : "opacity-0"} />
              <span className="text-muted-foreground italic">— {t("none")} —</span>
            </button>
            {items?.map((c) => {
              const active = c.id === value;
              return (
                <div key={c.id} className="flex items-stretch group hover:bg-surface">
                  <button
                    type="button"
                    onClick={() => { onChange(c.id!); setOpen(false); }}
                    className="flex-1 flex items-center gap-2 px-4 py-3 text-left"
                  >
                    <Check size={16} className={active ? "text-primary" : "opacity-0"} />
                    <span className={active ? "font-semibold text-primary" : ""}>{c.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{c.discountPercent}%</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setConfirmId(c.id!); }}
                    className="px-3 text-muted-foreground hover:text-danger"
                    aria-label={t("delete")}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border p-2">
            {!adding ? (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-lg text-primary text-sm font-bold tracking-wide hover:bg-primary/10"
              >
                <Plus size={16} /> {t("add")} {t("tier").toLowerCase()}
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  autoFocus
                  className="input-bz flex-1"
                  style={{ height: 44 }}
                  placeholder={t("tier")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <input
                  type="number"
                  className="input-bz w-20"
                  style={{ height: 44 }}
                  placeholder="%"
                  value={pct}
                  onChange={(e) => setPct(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreate(); } }}
                />
                <button type="button" onClick={handleCreate} className="h-11 px-3 rounded-lg bg-primary text-primary-foreground font-bold">
                  <Check size={16} />
                </button>
                <button type="button" onClick={() => { setAdding(false); setName(""); setPct(""); }} className="h-11 px-3 rounded-lg border border-border">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {confirmId != null && (
        <ConfirmDialog
          title={t("delete") + " " + t("tier") + "?"}
          confirmLabel={t("delete")}
          cancelLabel={t("cancel")}
          onCancel={() => setConfirmId(null)}
          onConfirm={() => handleDelete(confirmId)}
        />
      )}
    </div>
  );
}