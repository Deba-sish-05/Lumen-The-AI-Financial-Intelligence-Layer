import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "stable";
  colorScheme?: "teal" | "info-blue" | "insight-purple" | "warning-orange";
}

export const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  colorScheme = "teal" 
}: StatCardProps) => {
  const colorClasses = {
    teal: "bg-teal text-teal-foreground",
    "info-blue": "bg-info-blue text-info-blue-foreground",
    "insight-purple": "bg-insight-purple text-insight-purple-foreground",
    "warning-orange": "bg-warning-orange text-warning-orange-foreground",
  };

  return (
    <Card className={`p-6 rounded-2xl shadow-lg ${colorClasses[colorScheme]} border-0`}>
      <div className="space-y-2">
        <p className="text-sm font-medium opacity-90">{title}</p>
        <div className="flex items-baseline gap-2">
          {trend === "up" && <span className="text-2xl">↑</span>}
          {trend === "down" && <span className="text-2xl">↓</span>}
          <p className="text-4xl font-bold">{value}</p>
        </div>
        {subtitle && (
          <p className="text-sm opacity-80 flex items-center gap-1">
            {subtitle}
          </p>
        )}
      </div>
    </Card>
  );
};
