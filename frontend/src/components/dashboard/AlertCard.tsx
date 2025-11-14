import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface AlertCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  colorScheme: "teal" | "info-blue" | "insight-purple" | "warning-orange";
}

export const AlertCard = ({ 
  icon: Icon, 
  title, 
  description,
  colorScheme 
}: AlertCardProps) => {
  const colorClasses = {
    teal: "bg-teal text-teal-foreground",
    "info-blue": "bg-info-blue text-info-blue-foreground",
    "insight-purple": "bg-insight-purple text-insight-purple-foreground",
    "warning-orange": "bg-warning-orange text-warning-orange-foreground",
  };

  return (
    <Card className={`p-6 rounded-2xl shadow-lg ${colorClasses[colorScheme]} border-0`}>
      <div className="flex gap-4">
        <Icon className="h-12 w-12 shrink-0" />
        <div className="space-y-1">
          <h3 className="font-bold text-lg">{title}</h3>
          <p className="text-sm opacity-90">{description}</p>
        </div>
      </div>
    </Card>
  );
};
