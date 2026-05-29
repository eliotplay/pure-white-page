import { useEffect, useReducer } from "react";

export type Lang = "EN" | "ID";

const dict: Record<Lang, Record<string, string>> = {
  EN: {
    "nav.home": "Home", "nav.orders": "Orders", "nav.contacts": "Clients",
    "nav.products": "Stock", "nav.more": "More",
    "greet.morning": "Good morning", "greet.afternoon": "Good afternoon", "greet.evening": "Good evening",
    "welcome": "Welcome back",
    "total_revenue": "Total Revenue", "expenses": "Expenses", "net_profit": "Net Profit",
    "pending_payments": "Pending Payments", "outstanding": "Outstanding Clients",
    "financial_health": "Financial Health", "recent_orders": "recent orders", "view_all": "View all",
    "no_orders": "No orders yet.",
    "more": "More", "reminders": "Reminders", "calendar": "Calendar", "finance": "Finance",
    "analytics": "Analytics", "inventory": "Inventory", "settings": "Settings", "archive": "Archive",
    "profile": "Profile", "display_name": "Display Name", "save": "Save", "saved": "Saved!",
    "username_help": "This name appears in your greeting.",
    "general": "General", "language": "Language", "backup": "Backup",
    "app_version": "App Version", "offline_note": "100% offline · Data stays on this device",
    "this_month": "This Month", "all": "All", "entries": "Entries",
    "no_expenses": "No expenses recorded.",
  },
  ID: {
    "nav.home": "Beranda", "nav.orders": "Pesanan", "nav.contacts": "Klien",
    "nav.products": "Stok", "nav.more": "Lainnya",
    "greet.morning": "Selamat pagi", "greet.afternoon": "Selamat siang", "greet.evening": "Selamat malam",
    "welcome": "Selamat datang kembali",
    "total_revenue": "Total Pendapatan", "expenses": "Pengeluaran", "net_profit": "Laba Bersih",
    "pending_payments": "Pembayaran Tertunda", "outstanding": "Klien Belum Bayar",
    "financial_health": "Kesehatan Finansial", "recent_orders": "pesanan terbaru", "view_all": "Lihat semua",
    "no_orders": "Belum ada pesanan.",
    "more": "Lainnya", "reminders": "Pengingat", "calendar": "Kalender", "finance": "Keuangan",
    "analytics": "Analitik", "inventory": "Inventaris", "settings": "Pengaturan", "archive": "Arsip",
    "profile": "Profil", "display_name": "Nama Tampilan", "save": "Simpan", "saved": "Tersimpan!",
    "username_help": "Nama ini muncul di sapaan Anda.",
    "general": "Umum", "language": "Bahasa", "backup": "Cadangan",
    "app_version": "Versi Aplikasi", "offline_note": "100% offline · Data tetap di perangkat ini",
    "this_month": "Bulan Ini", "all": "Semua", "entries": "Catatan",
    "no_expenses": "Belum ada pengeluaran.",
  },
};

const LANG_KEY = "biztrack:lang";
const NAME_KEY = "biztrack:username";

let _lang: Lang = "EN";
let _name = "Owner";
if (typeof window !== "undefined") {
  _lang = (localStorage.getItem(LANG_KEY) as Lang) || "EN";
  _name = localStorage.getItem(NAME_KEY) || "Owner";
}

const subs = new Set<() => void>();
const notify = () => subs.forEach((f) => f());

export const getLang = () => _lang;
export const setLang = (l: Lang) => {
  _lang = l;
  if (typeof window !== "undefined") localStorage.setItem(LANG_KEY, l);
  notify();
};

export const getUsername = () => _name;
export const setUsername = (n: string) => {
  _name = n.trim() || "Owner";
  if (typeof window !== "undefined") localStorage.setItem(NAME_KEY, _name);
  notify();
};

export function t(key: string): string {
  return dict[_lang][key] ?? key;
}

export function useI18n() {
  const [, force] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    subs.add(force);
    return () => { subs.delete(force); };
  }, []);
  return { t, lang: _lang, setLang, username: _name, setUsername };
}
