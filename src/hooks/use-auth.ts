import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const UID_KEY = "biztrack:uid";

export function syncUidCache(user: User | null) {
  if (typeof localStorage === "undefined") return;
  if (user) localStorage.setItem(UID_KEY, user.id);
  else localStorage.removeItem(UID_KEY);
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      syncUidCache(s?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      syncUidCache(data.session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}

/** Convert a username into the synthetic email Supabase Auth requires. */
export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@biztrack.app`;
}