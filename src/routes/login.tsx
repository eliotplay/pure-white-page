import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usernameToEmail, syncUidCache } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });
    setBusy(false);
    if (error) { setErr("Username atau password salah"); return; }
    syncUidCache(data.user);
    // Full reload so Dexie reopens with the new per-user DB name.
    window.location.assign("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold mb-2">Masuk</h1>
        <input
          dir="ltr" autoComplete="username" autoCapitalize="none"
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base"
          placeholder="Username" value={username}
          onChange={(e) => setUsername(e.target.value)} required
        />
        <input
          dir="ltr" autoComplete="current-password" type="password"
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base"
          placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)} required
        />
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "Memuat..." : "Masuk"}
        </button>
        <p className="text-sm text-center text-muted-foreground">
          Belum punya akun?{" "}
          <Link to="/signup" className="text-primary underline">Daftar</Link>
        </p>
      </form>
    </div>
  );
}