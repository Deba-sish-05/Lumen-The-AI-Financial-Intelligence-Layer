import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { Card } from "@/components/ui/card";
import { ReferenceLine } from "recharts";
import {
  Zap,
  ShoppingBasket,
  CreditCard,
  Fuel,
  Salad,
  UtensilsCrossed,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

const Dashboard = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  // Fetch all transactions
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/transactions/all?page=1");
        setTransactions(res.data.transactions || []);
      } catch (err) {
        console.error("Dashboard load error:", err);
      }
      setLoading(false);
    })();
  }, []);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // THIS MONTH TRANSACTIONS
  const monthlyTxns = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.transaction_date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [transactions, currentMonth, currentYear]);

  // TOTAL SPENT THIS MONTH
  const totalSpent = monthlyTxns.reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );

  // AVERAGE PER DAY
  const avgSpendPerDay = totalSpent / now.getDate();

  // RECENT TRANSACTIONS
  const recentTransactions = transactions.slice(0, 3);

  // CATEGORY BREAKDOWN
  const categoryTotals: Record<string, number> = {};
  monthlyTxns.forEach((t) => {
    const cat = t.category || "other";
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(Number(t.amount));
  });

  const categoryColors: any = {
    food: "hsl(250 75% 65%)",
    groceries: "hsl(207 90% 54%)",
    travel: "hsl(25 95% 53%)",
    bills: "hsl(174 62% 47%)",
    entertainment: "hsl(340 75% 60%)",
    health: "hsl(280 70% 60%)",
    education: "hsl(200 60% 50%)",
    other: "hsl(0 0% 60%)",
  };

  const categoryData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value,
    color: categoryColors[name] || "gray",
  }));

  // compute highest category safely (avoid mutating categoryData with sort)
  const highestCategory = useMemo(() => {
    if (!categoryData.length) return "N/A";
    const copy = [...categoryData];
    copy.sort((a, b) => b.value - a.value);
    return copy[0].name;
  }, [categoryData]);

  // MONTHLY TREND GRAPH
  const monthsOrder = [
    "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"
  ];

  const monthTotals: Record<string, number> = {};
  transactions.forEach((t) => {
    const d = new Date(t.transaction_date);
    const m = monthsOrder[d.getMonth()];
    // use signed amount: positive = income, negative = expense
    const amt = Number(t.amount) || 0;
    monthTotals[m] = (monthTotals[m] || 0) + amt;
  });


  const trendData = monthsOrder.map((m) => ({
    month: m,
    value: Number(-monthTotals[m] || 0),
  }));

  const trendYDomain = useMemo(() => {
    const vals = trendData.map((d) => {
      const n = Number(d.value);
      return Number.isFinite(n) ? n : 0;
    });

    if (vals.length === 0) return { rawMin: -1, rawMax: 1, min: -10, max: 10 };

    const vmin = Math.min(...vals);
    const vmax = Math.max(...vals);

    if (vmax === 0 && vmin === 0) {
      return { rawMin: 0, rawMax: 0, min: -10, max: 10 };
    }

    const range = vmax - vmin;
    const padding = range === 0 ? Math.max(1, Math.abs(vmax) * 0.1) : Math.abs(range) * 0.12;

    let paddedMin = vmin - padding;
    let paddedMax = vmax + padding;

    if (vmin < 0 && vmax > 0) {
      paddedMin = Math.min(paddedMin, vmin - padding, -padding);
      paddedMax = Math.max(paddedMax, vmax + padding, padding);
    }

    const roundDown10 = (x: number) => Math.floor(x / 10) * 10;
    const roundUp10 = (x: number) => Math.ceil(x / 10) * 10;

    let min = roundDown10(paddedMin);
    let max = roundUp10(paddedMax);

    if (min === max) {
      const base = Math.abs(min) || 10;
      min = min - 10;
      max = max + 10;
    }

    if (max - min < 10) {
      min = min - 10;
      max = max + 10;
      min = roundDown10(min);
      max = roundUp10(max);
    }

    return { rawMin: vmin, rawMax: vmax, min, max };
  }, [trendData]);

  const trendYTicks = useMemo(() => {
    const { min, max } = trendYDomain;
    const top = Number(max);
    if (!Number.isFinite(top)) return [];
    return [top];
  }, [trendYDomain]);

  function computeNextPurchase(category: string) {
    const filtered = transactions
      .filter((t) => t.category === category)
      .map((t) => new Date(t.transaction_date))
      .sort((a, b) => a.getTime() - b.getTime());

    if (filtered.length < 2) {
      return { status: "insufficient" };
    }

    const gaps: number[] = [];
    for (let i = 1; i < filtered.length; i++) {
      const diff =
        (filtered[i].getTime() - filtered[i - 1].getTime()) /
        (1000 * 60 * 60 * 24);
      gaps.push(diff);
    }

    gaps.sort((a, b) => a - b);
    const mid = Math.floor(gaps.length / 2);
    const median =
      gaps.length % 2 === 0 ? (gaps[mid - 1] + gaps[mid]) / 2 : gaps[mid];

    const lastDate = filtered[filtered.length - 1];
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + Math.round(median));

    return {
      status: "ok",
      last: lastDate.toDateString(),
      medianGap: Math.round(median),
      next: nextDate.toDateString(),
    };
  }

  const groceryPrediction = computeNextPurchase("groceries");
  const billsPrediction = computeNextPurchase("bills");
  const educationPrediction = computeNextPurchase("education");

  function foodSpikeDescription() {
    const weekMs = 7 * 24 * 3600 * 1000;
    const now = new Date();

    const thisWeek = transactions.filter(
      (t) =>
        t.category === "food" &&
        new Date(t.transaction_date) >= new Date(now.getTime() - weekMs)
    );

    const lastWeek = transactions.filter((t) => {
      const dt = new Date(t.transaction_date);
      return (
        t.category === "food" &&
        dt >= new Date(now.getTime() - 2 * weekMs) &&
        dt < new Date(now.getTime() - weekMs)
      );
    });

    const thisSum = thisWeek.reduce((a, b) => a + Number(b.amount), 0);
    const lastSum = lastWeek.reduce((a, b) => a + Number(b.amount), 0);

    return thisSum > lastSum * 1.3
      ? "Your food spending this week is unusually high."
      : "Your food spending pattern looks normal this week.";
  }

  function billsAnomalyDescription() {
    const billsTxns = transactions
      .filter((t) => t.category === "bills")
      .map((t) => Number(t.amount));

    if (billsTxns.length < 3) return "Not enough data to analyze bills spending.";

    const sorted = [...billsTxns].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

    const latest = billsTxns[billsTxns.length - 1];

    return latest > median * 1.4
      ? "bills bill above your usual pattern."
      : "bills spending is normal compared to your historical average.";
  }

  function groceryCycleDescription() {
    const groceryDates = transactions
      .filter((t) => t.category === "groceries")
      .map((t) => new Date(t.transaction_date))
      .sort((a, b) => a.getTime() - b.getTime());

    if (groceryDates.length < 3)
      return "Not enough history to detect a grocery cycle.";

    const diffs: number[] = [];
    for (let i = 1; i < groceryDates.length; i++) {
      const diff =
        (groceryDates[i].getTime() - groceryDates[i - 1].getTime()) /
        (1000 * 3600 * 24);
      diffs.push(diff);
    }

    const sorted = [...diffs].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];

    const consistentCount = diffs.filter(
      (g) => Math.abs(g - median) <= 2
    ).length;

    return consistentCount >= diffs.length * 0.7
      ? "Grocery buying cycle detected."
      : "Your grocery buying pattern is irregular.";
  }

  // RENDER
  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-lg">Loading dashboard...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* TOP STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Spent This Month"
            value={`₹${-totalSpent.toFixed(2)}`}
            subtitle="This month"
            trend="up"
            colorScheme="teal"
          />
          <StatCard
            title="Highest Category"
            value={highestCategory}
            subtitle="Top category"
            colorScheme="info-blue"
          />
          <StatCard
            title="Avg. Spend / Day"
            value={`₹${-avgSpendPerDay.toFixed(2)}`}
            subtitle="Daily average"
            colorScheme="insight-purple"
          />
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* TREND LINE */}
          <Card className="lg:col-span-2 p-6 rounded-2xl shadow-lg">
            <h3 className="font-bold text-lg mb-4">Monthly Spending Trend</h3>
           <div className="h-[300px] w-[700px] translate-y-5">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ top: 20, right: 12, bottom: 8, left: 8 }}
                >
                  <XAxis dataKey="month" />
                  <YAxis
                    domain={[-trendYDomain.min, trendYDomain.max]}
                    ticks={trendYTicks}
                    tickFormatter={(val) => `₹${Number(val).toFixed(0)}`}
                    axisLine={true}
                    tickLine={false}
                  />
                  <Tooltip />
                  <Line
                    type="natural"
                    dataKey="value"
                    stroke="hsl(var(--info-blue))"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* CATEGORY PIE */}
          <Card className="p-6 rounded-2xl shadow-lg">
            <h3 className="font-bold text-lg mb-4">Where Your Money Goes</h3>
            <div className="h-48 flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {categoryData.map((c, i) => (
                      <Cell key={i} fill={c.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 mt-4">
              {categoryData.map((c) => (
                <div key={c.name} className="flex justify-between text-sm">
                  <span>{c.name}</span>
                  <span>₹{c.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* AI PREDICTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6 rounded-2xl shadow-lg">
            <h3 className="font-bold text-xl mb-4">AI Predictions & Reminders</h3>

            <div className="space-y-4">

              <InsightCard
                icon={ShoppingBasket}
                title="Grocery Purchase Prediction"
                description={
                  groceryPrediction.status === "insufficient"
                    ? "Too little data for prediction"
                    : `Last: ${groceryPrediction.last} • Next Expected: ${groceryPrediction.next}`
                }
                iconBg="bg-teal/20"
              />

              <InsightCard
                icon={Zap}
                title="Bills Cycle Prediction"
                description={
                  billsPrediction.status === "insufficient"
                    ? "Not enough data"
                    : `Next Bill Expected: ${billsPrediction.next}`
                }
                iconBg="bg-warning-orange/20"
              />

              <InsightCard
                icon={CreditCard}
                title="Education Expense Prediction"
                description={
                  educationPrediction.status === "insufficient"
                    ? "Not enough history"
                    : `Next Expected: ${educationPrediction.next}`
                }
                iconBg="bg-insight-purple/20"
              />
            </div>
          </Card>

          {/* RECENT TRANSACTIONS */}
          <Card className="p-6 rounded-2xl shadow-lg">
            <h3 className="font-bold text-lg mb-4">Recent Transactions</h3>
            <div className="space-y-4">
              {recentTransactions.map((t, idx) => (
                <div
                  key={idx}
                  className="flex justify-between text-sm border-b pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium">{t.vendor || t.item_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.transaction_date).toLocaleDateString("en-IN")} • {t.category}
                    </p>
                  </div>
                  <p className="font-semibold">₹{t.amount}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ALERTS - always visible */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AlertCard
            icon={UtensilsCrossed}
            title="Food Spending Spike"
            description={foodSpikeDescription()}
            colorScheme="insight-purple"
          />

          <AlertCard
            icon={Fuel}
            title="Bills Anomaly"
            description={billsAnomalyDescription()}
            colorScheme="info-blue"
          />

          <AlertCard
            icon={Salad}
            title="Grocery Cycle"
            description={groceryCycleDescription()}
            colorScheme="teal"
          />
        </div>

      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
