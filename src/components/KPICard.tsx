import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
}

const KPICard = ({ title, value, trend, subtitle }: KPICardProps) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-5 w-5 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-5 w-5 text-green-500" />;
      default:
        return <Minus className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-red-600';
      case 'down':
        return 'text-green-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className="p-6 bg-card border border-border shadow-soft hover:shadow-glow transition-all duration-300">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </h3>
        {trend && getTrendIcon()}
      </div>
      
      <div className={`text-3xl font-bold mb-1 ${getTrendColor()}`}>
        {value}
      </div>
      
      {subtitle && (
        <p className="text-sm text-muted-foreground">
          {subtitle}
        </p>
      )}
    </Card>
  );
};

export default KPICard;