import Dexie, { type Table } from "dexie";

export interface DiscountTier {
  id?: number;
  name: string;
  discountPercent: number;
}

export interface Contact {
  id?: number;
  name: string;
  phone: string;
  address: string;
  discountTierId?: number | null;
  personalDiscountPercent?: number | null;
  isArchived: boolean;
  createdAt: number;
}

export interface ProductCategory {
  id?: number;
  name: string;
}

export interface Product {
  id?: number;
  name: string;
  categoryId: number;
  realPrice: number;
  stockCount: number;
  isArchived: boolean;
  createdAt: number;
}

export interface ProductTierDiscount {
  id?: number;
  productId: number;
  tierId: number;
  discountPercent: number;
}

export type OrderStatus = "DUE" | "PAID";

export interface Order {
  id?: number;
  contactId: number;
  orderDate: number;
  dueDate: number;
  status: OrderStatus;
  isArchived: boolean;
  notes?: string | null;
}

export interface OrderItem {
  id?: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  originalUnitPrice: number;
}

export interface RestockLog {
  id?: number;
  productId: number;
  amount: number;
  date: number;
  notes?: string | null;
}

export interface ExpenseCategory {
  id?: number;
  name: string;
}

export interface Expense {
  id?: number;
  categoryId: number;
  amount: number;
  date: number;
  notes?: string | null;
}

class BizTrackDB extends Dexie {
  contacts!: Table<Contact, number>;
  discountTiers!: Table<DiscountTier, number>;
  productCategories!: Table<ProductCategory, number>;
  products!: Table<Product, number>;
  productTierDiscounts!: Table<ProductTierDiscount, number>;
  orders!: Table<Order, number>;
  orderItems!: Table<OrderItem, number>;
  restockLogs!: Table<RestockLog, number>;
  expenseCategories!: Table<ExpenseCategory, number>;
  expenses!: Table<Expense, number>;

  constructor() {
    super("biztrack");
    this.version(1).stores({
      contacts: "++id, name, isArchived",
      discountTiers: "++id, name",
      productCategories: "++id, name",
      products: "++id, name, categoryId, isArchived",
      productTierDiscounts: "++id, productId, tierId, [productId+tierId]",
      orders: "++id, contactId, orderDate, status, isArchived",
      orderItems: "++id, orderId, productId",
      restockLogs: "++id, productId, date",
      expenseCategories: "++id, name",
      expenses: "++id, categoryId, date",
    });
  }
}

export const db = new BizTrackDB();

let seeded = false;
export async function ensureSeed() {
  if (seeded) return;
  seeded = true;
  const count = await db.contacts.count();
  if (count > 0) return;

  await db.transaction(
    "rw",
    [
      db.contacts, db.discountTiers, db.productCategories, db.products,
      db.productTierDiscounts, db.orders, db.orderItems, db.expenseCategories, db.expenses,
    ],
    async () => {
      const resellerId = await db.discountTiers.add({ name: "Reseller", discountPercent: 10 });
      const vipId = await db.discountTiers.add({ name: "VIP", discountPercent: 15 });

      const minumanId = await db.productCategories.add({ name: "Minuman" });
      const makananId = await db.productCategories.add({ name: "Makanan" });

      const now = Date.now();
      const c1 = await db.contacts.add({
        name: "Budi Santoso", phone: "+62 812 3456 7890", address: "Jl. Mawar 12, Jakarta",
        discountTierId: resellerId, personalDiscountPercent: null, isArchived: false, createdAt: now,
      });
      const c2 = await db.contacts.add({
        name: "Siti Rahma", phone: "+62 813 9876 5432", address: "Jl. Melati 5, Bandung",
        discountTierId: null, personalDiscountPercent: 15, isArchived: false, createdAt: now,
      });
      await db.contacts.add({
        name: "Ahmad Fauzi", phone: "+62 821 1122 3344", address: "Jl. Anggrek 8, Surabaya",
        discountTierId: null, personalDiscountPercent: null, isArchived: false, createdAt: now,
      });
      await db.contacts.add({
        name: "Dewi Lestari", phone: "+62 856 5544 2211", address: "Jl. Kenanga 3, Yogyakarta",
        discountTierId: null, personalDiscountPercent: null, isArchived: false, createdAt: now,
      });

      const kopi = await db.products.add({ name: "Kopi Susu", categoryId: minumanId, realPrice: 15000, stockCount: 42, isArchived: false, createdAt: now });
      const teh = await db.products.add({ name: "Es Teh", categoryId: minumanId, realPrice: 8000, stockCount: -2, isArchived: false, createdAt: now });
      const nasi = await db.products.add({ name: "Nasi Goreng", categoryId: makananId, realPrice: 25000, stockCount: 15, isArchived: false, createdAt: now });
      const mie = await db.products.add({ name: "Mie Ayam", categoryId: makananId, realPrice: 20000, stockCount: 0, isArchived: false, createdAt: now });

      await db.productTierDiscounts.bulkAdd([
        { productId: kopi, tierId: resellerId, discountPercent: 10 },
        { productId: nasi, tierId: resellerId, discountPercent: 10 },
      ]);

      // Seed orders
      const day = 86400000;
      const o1Date = now - 2 * 60 * 60 * 1000;
      const o1 = await db.orders.add({
        contactId: c1, orderDate: o1Date, dueDate: o1Date + 30 * day,
        status: "DUE", isArchived: false, notes: null,
      });
      await db.orderItems.bulkAdd([
        { orderId: o1, productId: kopi, quantity: 3, unitPrice: 13500, originalUnitPrice: 15000 },
        { orderId: o1, productId: nasi, quantity: 2, unitPrice: 22500, originalUnitPrice: 25000 },
      ]);

      const o2Date = now - 5 * 60 * 60 * 1000;
      const o2 = await db.orders.add({
        contactId: c2, orderDate: o2Date, dueDate: o2Date + 30 * day,
        status: "PAID", isArchived: false, notes: null,
      });
      await db.orderItems.add({ orderId: o2, productId: teh, quantity: 4, unitPrice: 6800, originalUnitPrice: 8000 });

      // Expenses
      const rentId = await db.expenseCategories.add({ name: "Rent" });
      const suppliesId = await db.expenseCategories.add({ name: "Supplies" });
      await db.expenseCategories.add({ name: "Utilities" });
      await db.expenses.bulkAdd([
        { categoryId: rentId, amount: 2500000, date: now - 7 * day, notes: "Monthly rent" },
        { categoryId: suppliesId, amount: 450000, date: now - 3 * day, notes: "Coffee beans" },
        { categoryId: suppliesId, amount: 280000, date: now - 1 * day, notes: "Cups & napkins" },
      ]);
    },
  );
}

/* ------- Business logic ------- */

export async function resolveUnitPrice(productId: number, contactId: number): Promise<{ unit: number; original: number }> {
  const product = await db.products.get(productId);
  if (!product) throw new Error("Product missing");
  const original = product.realPrice;
  const contact = await db.contacts.get(contactId);
  if (!contact) return { unit: original, original };

  if (contact.personalDiscountPercent != null) {
    return { unit: round(original * (1 - contact.personalDiscountPercent / 100)), original };
  }
  if (contact.discountTierId) {
    const tierDiscount = await db.productTierDiscounts
      .where({ productId, tierId: contact.discountTierId }).first();
    if (tierDiscount) {
      return { unit: round(original * (1 - tierDiscount.discountPercent / 100)), original };
    }
  }
  return { unit: original, original };
}

const round = (n: number) => Math.round(n);

export async function createOrder(input: {
  contactId: number;
  items: { productId: number; quantity: number; unitPrice: number; originalUnitPrice: number }[];
  notes?: string;
}): Promise<number> {
  const now = Date.now();
  const dueDate = now + 30 * 86400000;
  return db.transaction("rw", [db.orders, db.orderItems, db.products], async () => {
    const orderId = await db.orders.add({
      contactId: input.contactId, orderDate: now, dueDate,
      status: "DUE", isArchived: false, notes: input.notes ?? null,
    });
    for (const it of input.items) {
      await db.orderItems.add({ orderId, ...it });
      const p = await db.products.get(it.productId);
      if (p) await db.products.update(it.productId, { stockCount: p.stockCount - it.quantity });
    }
    return orderId;
  });
}

export async function deleteOrder(orderId: number) {
  await db.transaction("rw", [db.orders, db.orderItems, db.products], async () => {
    const items = await db.orderItems.where({ orderId }).toArray();
    for (const it of items) {
      const p = await db.products.get(it.productId);
      if (p) await db.products.update(it.productId, { stockCount: p.stockCount + it.quantity });
    }
    await db.orderItems.where({ orderId }).delete();
    await db.orders.delete(orderId);
  });
}

export async function markOrderPaid(orderId: number) {
  await db.orders.update(orderId, { status: "PAID" });
}

export async function restockProduct(productId: number, amount: number, notes?: string) {
  await db.transaction("rw", [db.products, db.restockLogs], async () => {
    const p = await db.products.get(productId);
    if (!p) return;
    await db.products.update(productId, { stockCount: p.stockCount + amount });
    await db.restockLogs.add({ productId, amount, date: Date.now(), notes: notes ?? null });
  });
}

export function formatRp(n: number): string {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export function formatRpShort(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `Rp ${Math.round(n / 1_000)}k`;
  return `Rp ${Math.round(n)}`;
}

export function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}
