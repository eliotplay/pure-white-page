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
    "search_products": "Search products…", "search_inventory": "Search inventory…",
    "product_list": "Product List", "best_seller": "Best Seller", "low_stock": "Low Stock",
    "items": "Items", "stock": "Stock", "units": "Units",
    "restock": "Restock", "restock_logs": "Restock Logs", "no_restock": "No restock activity yet.",
    "out_of_stock": "Out of Stock", "low_stock_status": "Low Stock", "healthy": "Healthy",
    "cancel": "Cancel", "confirm": "Confirm", "delete": "Delete", "add": "Add",
    "edit": "Edit", "new": "New", "product": "Product",
    "new_product": "New Product", "edit_product": "Edit Product",
    "new_contact": "New Contact", "edit_contact": "Edit Contact",
    "name": "Name", "phone": "Phone", "address": "Address",
    "category": "Category", "select": "Select", "none": "None",
    "real_price": "Real Price", "stock_count": "Stock Count",
    "tier_discounts": "Tier Discounts", "discount_tier": "Discount Tier",
    "personal_override": "Personal Override % (replaces tier)",
    "tier": "Tier", "new_category": "New category",
    "amount": "Amount", "notes": "Notes", "notes_optional": "Notes (optional)",
    "add_expense": "Add Expense", "no_tier_discounts": "No tier discounts",
    "delete_category_q": "Delete this category?",
    "delete_category_warn": "Products using it will keep their data.",
    "manage_categories": "Manage categories",
    "manage": "Manage", "done": "Done",
    "icon": "Icon (Emoji)", "icon_help": "Optional emoji",
    "filter_all": "All", "growth_trajectory": "Growth trajectory",
    "this_week": "this week", "quantity": "Quantity",
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
    "search_products": "Cari produk…", "search_inventory": "Cari stok…",
    "product_list": "Daftar Produk", "best_seller": "Terlaris", "low_stock": "Stok Tipis",
    "items": "Item", "stock": "Stok", "units": "Unit",
    "restock": "Isi Ulang", "restock_logs": "Log Isi Ulang", "no_restock": "Belum ada isi ulang.",
    "out_of_stock": "Habis", "low_stock_status": "Stok Tipis", "healthy": "Aman",
    "cancel": "Batal", "confirm": "Konfirmasi", "delete": "Hapus", "add": "Tambah",
    "edit": "Ubah", "new": "Baru", "product": "Produk",
    "new_product": "Produk Baru", "edit_product": "Ubah Produk",
    "new_contact": "Klien Baru", "edit_contact": "Ubah Klien",
    "name": "Nama", "phone": "Telepon", "address": "Alamat",
    "category": "Kategori", "select": "Pilih", "none": "Tidak ada",
    "real_price": "Harga Asli", "stock_count": "Jumlah Stok",
    "tier_discounts": "Diskon Tier", "discount_tier": "Tier Diskon",
    "personal_override": "Diskon Khusus % (ganti tier)",
    "tier": "Tier", "new_category": "Kategori baru",
    "amount": "Jumlah", "notes": "Catatan", "notes_optional": "Catatan (opsional)",
    "add_expense": "Tambah Pengeluaran", "no_tier_discounts": "Tidak ada diskon tier",
    "delete_category_q": "Hapus kategori ini?",
    "delete_category_warn": "Produk yang memakainya tetap aman.",
    "manage_categories": "Kelola kategori",
    "manage": "Kelola", "done": "Selesai",
    "icon": "Ikon (Emoji)", "icon_help": "Emoji opsional",
    "filter_all": "Semua", "growth_trajectory": "Pertumbuhan",
    "this_week": "minggu ini", "quantity": "Jumlah",
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
