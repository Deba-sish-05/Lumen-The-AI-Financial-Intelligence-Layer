import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface InsightCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconBg?: string;
}

export const InsightCard = ({ 
  icon: Icon, 
  title, 
  description,
  iconBg = "bg-warning-orange/20"
}: InsightCardProps) => {
  return (
    <div className="flex gap-3 items-start">
      <div className={`p-3 rounded-xl ${iconBg}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};
