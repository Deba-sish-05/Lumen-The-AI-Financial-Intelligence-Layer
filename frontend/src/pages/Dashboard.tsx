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

const trendData = [
  { month: "Jul", value: 8200 },
  { month: "Feb", value: 9800 },
  { month: "Mar", value: 11200 },
  { month: "Apr", value: 10800 },
  { month: "May", value: 11900 },
  { month: "Jun", value: 12470 },
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
            <ChartContainer config={{}} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis hide />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--info-blue))"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
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
