import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usernameToEmail, syncUidCache } from "@/hooks/use-auth";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setErr("Username 3-20 karakter (huruf, angka, _)"); return;
    }
    if (password.length < 8) {
      setErr("Password minimal 8 karakter"); return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: usernameToEmail(username),
      password,
      options: {
        data: { username: username.trim().toLowerCase() },
        emailRedirectTo: window.location.origin,
      },
    });
    setBusy(false);
    if (error) {
      setErr(error.message.includes("already") ? "Username sudah dipakai" : error.message);
      return;
    }
    syncUidCache(data.user);
    window.location.assign("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold mb-2">Daftar</h1>
        <input
          dir="ltr" autoComplete="username" autoCapitalize="none"
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base"
          placeholder="Username" value={username}
          onChange={(e) => setUsername(e.target.value)} required
        />
        <input
          dir="ltr" autoComplete="new-password" type="password"
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base"
          placeholder="Password (min 8)" value={password}
          onChange={(e) => setPassword(e.target.value)} required
        />
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "Memuat..." : "Daftar"}
        </button>
        <p className="text-sm text-center text-muted-foreground">
          Sudah punya akun?{" "}
          <Link to="/login" className="text-primary underline">Masuk</Link>
        </p>
      </form>
    </div>
  );
}