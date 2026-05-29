import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db, formatRpShort, formatRp } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — BizTrack" }] }),
  component: Analytics,
});

const COLORS = ["oklch(0.93 0.27 135)", "oklch(0.4 0 0)", "oklch(0.55 0 0)", "oklch(0.7 0 0)"];

function Analytics() {
  const data = useLiveQuery(async () => {
    const orders = await db.orders.filter((o) => !o.isArchived && o.status === "PAID").toArray();
    const items = await db.orderItems.toArray();
    const contacts = await db.contacts.toArray();
    const products = await db.products.toArray();
    const categories = await db.productCategories.toArray();
    const expenses = await db.expenses.toArray();

    const orderRev = (oid: number) => items.filter((i) => i.orderId === oid).reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const totalRev = orders.reduce((s, o) => s + orderRev(o.id!), 0);

    const now = Date.now();
    const week = 7 * 86400000;
    const weeks = [3, 2, 1, 0].map((w) => {
      const start = now - (w + 1) * week, end = now - w * week;
      const rev = orders.filter((o) => o.orderDate >= start && o.orderDate < end).reduce((s, o) => s + orderRev(o.id!), 0);
      const exp = expenses.filter((e) => e.date >= start && e.date < end).reduce((s, e) => s + e.amount, 0);
      return { label: `W${4 - w}`, rev, exp };
    });

    const months: { label: string; rev: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i); d.setDate(1); d.setHours(0, 0, 0, 0);
      const next = new Date(d); next.setMonth(next.getMonth() + 1);
      const rev = orders.filter((o) => o.orderDate >= d.getTime() && o.orderDate < next.getTime()).reduce((s, o) => s + orderRev(o.id!), 0);
      months.push({ label: d.toLocaleDateString("en-US", { month: "short" }), rev });
    }

    const byCat = new Map<number, number>();
    for (const o of orders) for (const i of items.filter((it) => it.orderId === o.id)) {
      const p = products.find((x) => x.id === i.productId); if (!p) continue;
      byCat.set(p.categoryId, (byCat.get(p.categoryId) ?? 0) + i.unitPrice * i.quantity);
    }
    const categoryShare = [...byCat.entries()].map(([cid, v]) => ({ name: categories.find((c) => c.id === cid)?.name ?? "—", value: v }));

    const byClient = new Map<number, number>();
    for (const o of orders) byClient.set(o.contactId, (byClient.get(o.contactId) ?? 0) + orderRev(o.id!));
    const topClients = [...byClient.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([cid, v]) => ({ name: contacts.find((c) => c.id === cid)?.name ?? "—", total: v }));

    const byProd = new Map<number, number>();
    for (const i of items) byProd.set(i.productId, (byProd.get(i.productId) ?? 0) + i.unitPrice * i.quantity);
    const topProducts = [...byProd.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([pid, v]) => ({ name: products.find((p) => p.id === pid)?.name ?? "—", total: v }));

    const highest = Math.max(...months.map((m) => m.rev));
    const lowest = Math.min(...months.map((m) => m.rev));
    const avg = months.reduce((s, m) => s + m.rev, 0) / months.length;

    return { totalRev, weeks, months, categoryShare, topClients, topProducts, highest, lowest, avg };
  }, []);

  return (
    <AppShell>
      <header className="flex items-center gap-3 pt-3 pb-2">
        <Link to="/more" className="text-primary"><ArrowLeft size={24} /></Link>
      </header>

      <div className="flex items-center justify-between pt-3 pb-1">
        <div>
          <div className="label-eyebrow">Total Revenue</div>
          <div className="text-[28px] font-bold mt-1">{formatRp(data?.totalRev ?? 0)}</div>
        </div>
        <span className="bg-primary/15 border border-primary/40 text-primary text-xs font-bold tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1">
          <TrendingUp size={12} /> +12.5%
        </span>
      </div>

      <div className="label-eyebrow flex items-center gap-2 mt-5 mb-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Revenue vs Expenses</div>
      <div className="card-bz" style={{ height: 200 }}>
        <SimpleBarChart data={data?.weeks ?? []} />
      </div>
      <div className="flex items-center gap-4 text-xs mt-2">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Revenue</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-muted-foreground" /> Expenses</span>
      </div>

      <div className="label-eyebrow flex items-center gap-2 mt-6 mb-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> 6-Month Trend</div>
      <div className="card-bz" style={{ height: 200 }}>
        <SimpleLineChart data={data?.months ?? []} />
      </div>
      <div className="grid grid-cols-3 gap-3 mt-3">
        <Stat label="Highest" v={data?.highest ?? 0} />
        <Stat label="Lowest" v={data?.lowest ?? 0} />
        <Stat label="Average" v={data?.avg ?? 0} />
      </div>

      <div className="label-eyebrow flex items-center gap-2 mt-6 mb-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Category Share</div>
      <div className="card-bz flex items-center gap-4">
        <SimplePie data={data?.categoryShare ?? []} />
        <div className="flex-1 flex flex-col gap-2 text-sm">
          {data?.categoryShare.map((c, i) => {
            const total = data.categoryShare.reduce((s, x) => s + x.value, 0);
            return (
              <div key={i} className="flex items-center justify-between">
                <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{c.name}</span>
                <span className="font-bold">{total ? Math.round((c.value / total) * 100) : 0}%</span>
              </div>
            );
          })}
          {(!data || data.categoryShare.length === 0) && <div className="text-sm text-muted-foreground text-center">No data</div>}
        </div>
      </div>

      <div className="label-eyebrow mt-6 mb-3">Top Clients</div>
      <div className="card-bz flex flex-col gap-3">
        {data?.topClients.map((c, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="font-semibold flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" />{c.name}</span>
            <span className="font-bold text-primary">{formatRpShort(c.total)}</span>
          </div>
        ))}
        {(!data || data.topClients.length === 0) && <div className="text-sm text-muted-foreground text-center">No data</div>}
      </div>

      <div className="label-eyebrow flex items-center gap-2 mt-6 mb-3"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Top Products</div>
      <div className="card-bz flex flex-col gap-3 mb-4">
        {data?.topProducts.map((p, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="font-semibold flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" />{p.name}</span>
            <span className="font-bold text-primary">{formatRpShort(p.total)}</span>
          </div>
        ))}
        {(!data || data.topProducts.length === 0) && <div className="text-sm text-muted-foreground text-center">No data</div>}
      </div>
    </AppShell>
  );
}

function Stat({ label, v }: { label: string; v: number }) {
  return (
    <div className="card-bz py-3">
      <div className="label-eyebrow">{label}</div>
      <div className="font-bold text-primary mt-1">{formatRpShort(v)}</div>
    </div>
  );
}

function SimpleBarChart({ data }: { data: { label: string; rev: number; exp: number }[] }) {
  const max = Math.max(...data.map((d) => Math.max(d.rev, d.exp)), 1);
  const h = 200;
  const pad = { t: 10, r: 10, b: 20, l: 5 };
  const cw = 300 - pad.l - pad.r;
  const ch = h - pad.t - pad.b;
  const n = Math.max(data.length, 1);
  const groupW = cw / n;
  const barW = groupW * 0.35;
  const gap = groupW * 0.15;

  return (
    <svg viewBox={`0 0 300 ${h}`} className="w-full h-full">
      {data.map((d, i) => {
        const gx = pad.l + i * groupW + gap / 2;
        const revH = (d.rev / max) * ch;
        const expH = (d.exp / max) * ch;
        return (
          <g key={i}>
            <rect x={gx} y={pad.t + ch - revH} width={barW} height={revH} rx={3} fill="var(--primary)" />
            <rect x={gx + barW + 2} y={pad.t + ch - expH} width={barW} height={expH} rx={3} fill="oklch(0.3 0 0)" />
            <text x={gx + barW + 1} y={pad.t + ch + 14} textAnchor="middle" fill="oklch(0.62 0 0)" fontSize="10">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function SimpleLineChart({ data }: { data: { label: string; rev: number }[] }) {
  const max = Math.max(...data.map((d) => d.rev), 1);
  const h = 200;
  const pad = { t: 20, r: 10, b: 20, l: 5 };
  const cw = 300 - pad.l - pad.r;
  const ch = h - pad.t - pad.b;
  const n = Math.max(data.length, 1);

  const points = data.map((d, i) => {
    const x = pad.l + (n <= 1 ? 0.5 : i / (n - 1)) * cw;
    const y = pad.t + ch - (d.rev / max) * ch;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 300 ${h}`} className="w-full h-full">
      {[0, 0.33, 0.66, 1].map((p, i) => {
        const y = pad.t + ch * (1 - p);
        return <line key={i} x1={pad.l} y1={y} x2={pad.l + cw} y2={y} stroke="oklch(0.22 0 0)" strokeDasharray="3 3" />;
      })}
      {data.length > 1 && (
        <polyline points={points} fill="none" stroke="var(--primary)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      )}
      {data.map((d, i) => {
        const x = pad.l + (n <= 1 ? 0.5 : i / (n - 1)) * cw;
        const y = pad.t + ch - (d.rev / max) * ch;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={4} fill="var(--primary)" />
            <text x={x} y={pad.t + ch + 14} textAnchor="middle" fill="oklch(0.62 0 0)" fontSize="10">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function SimplePie({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const size = 130;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 55;
  const innerRadius = 35;

  let startAngle = -Math.PI / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {total === 0 && <circle cx={cx} cy={cy} r={radius} fill="none" stroke="oklch(0.22 0 0)" strokeWidth={radius - innerRadius} />}
      {data.map((d, i) => {
        const angle = (d.value / total) * 2 * Math.PI;
        const endAngle = startAngle + angle;

        const x1 = cx + innerRadius * Math.cos(startAngle);
        const y1 = cy + innerRadius * Math.sin(startAngle);
        const x2 = cx + radius * Math.cos(startAngle);
        const y2 = cy + radius * Math.sin(startAngle);
        const x3 = cx + radius * Math.cos(endAngle);
        const y3 = cy + radius * Math.sin(endAngle);
        const x4 = cx + innerRadius * Math.cos(endAngle);
        const y4 = cy + innerRadius * Math.sin(endAngle);

        const largeArc = angle > Math.PI ? 1 : 0;
        const path = [
          `M ${x1} ${y1}`,
          `L ${x2} ${y2}`,
          `A ${radius} ${radius} 0 ${largeArc} 1 ${x3} ${y3}`,
          `L ${x4} ${y4}`,
          `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1} ${y1}`,
          "Z",
        ].join(" ");

        startAngle = endAngle;
        return <path key={i} d={path} fill={COLORS[i % COLORS.length]} />;
      })}
    </svg>
  );
}
