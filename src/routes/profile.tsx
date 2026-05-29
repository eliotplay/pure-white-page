import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — BizTrack" }] }),
  component: Profile,
});

const ICONS = ["🦊", "🐻", "🐼", "🐱", "🐶", "🦁", "🐯", "🐸", "🐧", "🐙", "🦄", "🐝"];

function Profile() {
  const { t, username, setUsername } = useI18n();
  const [name, setName] = useState(username);
  const [icon, setIcon] = useState<string>(() =>
    (typeof window !== "undefined" && localStorage.getItem("biztrack:avatar")) || ICONS[0]
  );
  const [savedFlag, setSavedFlag] = useState(false);

  function save() {
    setUsername(name);
    if (typeof window !== "undefined") localStorage.setItem("biztrack:avatar", icon);
    setSavedFlag(true);
    setTimeout(() => setSavedFlag(false), 1500);
  }

  return (
    <AppShell>
      <header className="flex items-center gap-3 pt-3 pb-2">
        <Link to="/" className="text-primary"><ArrowLeft size={24} /></Link>
      </header>
      <h1 className="text-[28px] font-bold pt-3 pb-4">{t("profile")}</h1>

      <div className="card-bz flex items-center gap-4">
        <span className="h-16 w-16 rounded-full bg-primary/15 border border-primary/40 grid place-items-center text-3xl">
          {icon || <User size={28} className="text-primary" />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="label-eyebrow">{t("display_name")}</div>
          <div className="font-bold text-lg truncate">{username}</div>
        </div>
      </div>

      <div className="label-eyebrow mt-6 mb-3">{t("display_name")}</div>
      <input
        className="input-bz"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Owner"
        maxLength={32}
      />
      <p className="text-xs text-muted-foreground italic mt-2">{t("username_help")}</p>

      <div className="label-eyebrow mt-6 mb-3">Avatar</div>
      <div className="grid grid-cols-6 gap-2">
        {ICONS.map((i) => (
          <button
            key={i}
            onClick={() => setIcon(i)}
            className={`aspect-square rounded-xl text-2xl grid place-items-center border transition ${
              icon === i ? "bg-primary/20 border-primary glow-primary-sm" : "bg-surface-elevated border-border"
            }`}
          >
            {i}
          </button>
        ))}
      </div>

      <button onClick={save} className="btn-primary w-full mt-6 mb-4">
        {savedFlag ? t("saved") : t("save")}
      </button>
    </AppShell>
  );
}
