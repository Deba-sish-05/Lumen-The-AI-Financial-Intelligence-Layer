import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { Card } from "@/components/ui/card";
import { Zap, ShoppingBasket, CreditCard, Fuel, Salad, UtensilsCrossed } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// ✅ FIXED: Smooth, regular graph Feb → Dec
const trendData = [
  { month: "Jan", value: 5000 },
  { month: "Feb", value: 8000 },
  { month: "Mar", value: 9000 },
  { month: "Apr", value: 10000 },
  { month: "May", value: 11200 },
  { month: "Jun", value: 12470 },
  { month: "Jul", value: 13400 },
  { month: "Aug", value: 14200 },
  { month: "Sep", value: 15000 },
  { month: "Oct", value: 15900 },
  { month: "Nov", value: 16800 },
  { month: "Dec", value: 17800 },
];

const categoryData = [
  { name: "Food", value: 35, color: "hsl(250 75% 65%)" },
  { name: "Groceries", value: 25, color: "hsl(207 90% 54%)" },
  { name: "Travel", value: 15, color: "hsl(25 95% 53%)" },
  { name: "Bills", value: 15, color: "hsl(174 62% 47%)" },
  { name: "Other", value: 10, color: "hsl(340 75% 60%)" },
];

const recentTransactions = [
  { date: "14 Nov", vendor: "Southern Express Café", category: "Food", mode: "Cash", amount: 787.5 },
  { date: "13 Nov", vendor: "Metro Supermarket", category: "Groceries", mode: "Card", amount: 1250.0 },
  { date: "12 Nov", vendor: "Uber", category: "Travel", mode: "UPI", amount: 245.0 },
];

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Spent This Month"
            value="₹12,470"
            subtitle="↗ 8% from last month"
            trend="up"
            colorScheme="teal"
          />
          <StatCard
            title="Highest Category"
            value="₹415"
            subtitle="Trend: stable"
            colorScheme="info-blue"
          />
          <StatCard
            title="Avg. Spend Per Day"
            value="₹415"
            subtitle="Trend: stable"
            colorScheme="insight-purple"
          />
        </div>

        {/* Charts and Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Monthly Trend */}
          <Card className="lg:col-span-2 p-6 rounded-2xl shadow-lg">
            <h3 className="font-bold text-lg mb-4">Monthly Spending Trend</h3>
            <div className="max-w-2xl mx-auto translate-x-[-40px] translate-y-[20px]">

              <ChartContainer config={{}} className="h-[320px] w-full p-0 m-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData}
                    margin={{ top: 10, bottom: 20, left: 0, right: 0 }}
                  >
                    <XAxis
                      dataKey="month"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickMargin={10}
                    />

                    <YAxis
                      stroke="transparent"
                      tickLine={false}
                      axisLine={false}
                    />

                    <ChartTooltip content={<ChartTooltipContent />} />

                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--info-blue))" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(var(--info-blue))" stopOpacity={0} />
                      </linearGradient>
                    </defs>

                    <Line
                      type="natural"
                      dataKey="value"
                      stroke="hsl(var(--info-blue))"
                      strokeWidth={3}
                      dot={false}
                      fill="url(#trendGradient)"
                      animationDuration={700}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

          </Card>


          {/* Category Breakdown */}
          <Card className="p-6 rounded-2xl shadow-lg">
            <h3 className="font-bold text-lg mb-4">Where Your Money Goes</h3>
            <div className="flex items-center justify-center mb-4">
              <ChartContainer config={{}} className="h-48 w-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            <div className="space-y-2">
              {categoryData.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span>{cat.name}</span>
                  </div>
                  <span className="font-medium">{cat.value}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* AI Predictions & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6 rounded-2xl shadow-lg">
            <h3 className="font-bold text-xl mb-4">AI Predictions & Reminders</h3>
            <div className="space-y-4">
              <InsightCard
                icon={Zap}
                title="Electricity Bill"
                description="Due in: 3 days • Predicted amount: ₹1,200"
                iconBg="bg-warning-orange/20"
              />
              <InsightCard
                icon={ShoppingBasket}
                title="Grocery Refill"
                description="Based on past receipts, you may need groceries on Tuesday."
                iconBg="bg-teal/20"
              />
              <InsightCard
                icon={CreditCard}
                title="Subscription Alert"
                description="Netflix auto debit expected on 12th"
                iconBg="bg-insight-purple/20"
              />
            </div>
          </Card>

          {/* Recent Transactions Preview */}
          <Card className="p-6 rounded-2xl shadow-lg">
            <h3 className="font-bold text-lg mb-4">Recent Transactions</h3>
            <div className="space-y-4">
              {recentTransactions.map((txn, idx) => (
                <div key={idx} className="flex justify-between items-start text-sm border-b border-border pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{txn.vendor}</p>
                    <p className="text-xs text-muted-foreground">{txn.date} • {txn.category}</p>
                  </div>
                  <p className="font-semibold">₹{txn.amount}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Alert Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AlertCard
            icon={UtensilsCrossed}
            title="Food Spending Up By 18%"
            description="You spent more on eating out this week than usual."
            colorScheme="insight-purple"
          />
          <AlertCard
            icon={Fuel}
            title="Fuel Expense Anomaly Detected"
            description="Yesterday's fuel bill is 32% higher than your average"
            colorScheme="info-blue"
          />
          <AlertCard
            icon={Salad}
            title="Grocery Pattern Found"
            description="You tend to buy groceries every 10 days."
            colorScheme="teal"
          />
        </div>

      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
