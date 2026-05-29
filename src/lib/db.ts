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
  icon?: string;
}

export interface Product {
  id?: number;
  name: string;
  categoryId: number;
  realPrice: number;
  stockCount: number;
  isArchived: boolean;
  createdAt: number;
  icon?: string;
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
  // Wipe any previously-seeded demo data so users start from a clean slate.
  const flag = "biztrack_seed_cleared_v1";
  if (typeof localStorage !== "undefined" && !localStorage.getItem(flag)) {
    await db.transaction(
      "rw",
      [
        db.contacts, db.discountTiers, db.productCategories, db.products,
        db.productTierDiscounts, db.orders, db.orderItems, db.restockLogs,
        db.expenseCategories, db.expenses,
      ],
      async () => {
        await Promise.all([
          db.contacts.clear(),
          db.discountTiers.clear(),
          db.productCategories.clear(),
          db.products.clear(),
          db.productTierDiscounts.clear(),
          db.orders.clear(),
          db.orderItems.clear(),
          db.restockLogs.clear(),
          db.expenseCategories.clear(),
          db.expenses.clear(),
        ]);
      },
    );
    localStorage.setItem(flag, "1");
  }
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
