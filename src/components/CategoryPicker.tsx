import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Plus, Trash2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export interface CategoryItem { id?: number; name: string; icon?: string }

interface Props {
  value: number | "";
  onChange: (id: number | "") => void;
  items: CategoryItem[] | undefined;
  onCreate: (name: string, icon?: string) => Promise<number>;
  onDelete: (id: number) => Promise<void>;
  placeholder?: string;
}

export function CategoryPicker({ value, onChange, items, onCreate, onDelete, placeholder }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("");
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
    const n = newName.trim();
    if (!n) return;
    const id = await onCreate(n, newIcon.trim() || undefined);
    onChange(id);
    setNewName(""); setNewIcon(""); setAdding(false); setOpen(false);
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
          {selected ? `${selected.icon ? selected.icon + " " : ""}${selected.name}` : (placeholder ?? `— ${t("select")} —`)}
        </span>
        <ChevronDown size={18} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-40 mt-2 w-full rounded-xl border border-border bg-surface-elevated shadow-2xl overflow-hidden">
          <div className="max-h-64 overflow-y-auto py-1">
            {(items ?? []).length === 0 && !adding && (
              <div className="px-4 py-3 text-sm text-muted-foreground italic">{t("none")}</div>
            )}
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
                    <span className={active ? "font-semibold text-primary" : ""}>
                      {c.icon ? `${c.icon} ` : ""}{c.name}
                    </span>
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
                <Plus size={16} /> {t("add")} {t("category").toLowerCase()}
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  className="input-bz text-center text-lg"
                  style={{ height: 44, width: 56 }}
                  maxLength={4}
                  placeholder="🏷️"
                  value={newIcon}
                  onChange={(e) => setNewIcon(e.target.value)}
                />
                <input
                  autoFocus
                  className="input-bz flex-1"
                  style={{ height: 44 }}
                  placeholder={t("new_category")}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreate(); } }}
                />
                <button type="button" onClick={handleCreate} className="h-11 px-3 rounded-lg bg-primary text-primary-foreground font-bold">
                  <Check size={16} />
                </button>
                <button type="button" onClick={() => { setAdding(false); setNewName(""); }} className="h-11 px-3 rounded-lg border border-border">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {confirmId != null && (
        <ConfirmDialog
          title={t("delete_category_q")}
          message={t("delete_category_warn")}
          confirmLabel={t("delete")}
          cancelLabel={t("cancel")}
          onCancel={() => setConfirmId(null)}
          onConfirm={() => handleDelete(confirmId)}
        />
      )}
    </div>
  );
}

export function ConfirmDialog({
  title, message, confirmLabel, cancelLabel, onConfirm, onCancel,
}: {
  title: string; message?: string; confirmLabel: string; cancelLabel: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-end max-w-md mx-auto" onClick={onCancel}>
      <div className="bg-surface w-full rounded-t-3xl p-5 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
        <div className="h-1 w-10 bg-border rounded-full mx-auto" />
        <div className="font-bold text-lg">{title}</div>
        {message && <div className="text-sm text-muted-foreground">{message}</div>}
        <div className="flex gap-2 mt-2">
          <button onClick={onCancel} className="btn-secondary flex-1">{cancelLabel}</button>
          <button onClick={onConfirm} className="btn-danger flex-1 font-bold">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}