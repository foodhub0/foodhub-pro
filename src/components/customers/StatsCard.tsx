import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

export const StatsCard = ({ title, value, icon: Icon, description, trend, variant = 'default' }: StatsCardProps) => {
  const variantStyles = {
    default: 'bg-white border-gray-200',
    primary: 'bg-gradient-to-br from-blue-50 to-white border-blue-200',
    success: 'bg-gradient-to-br from-green-50 to-white border-green-200',
    warning: 'bg-gradient-to-br from-yellow-50 to-white border-yellow-200',
    danger: 'bg-gradient-to-br from-red-50 to-white border-red-200',
  };

  const iconStyles = {
    default: 'text-gray-600 bg-gray-100',
    primary: 'text-[#007BFF] bg-[#E8F1FF]',
    success: 'text-green-600 bg-green-100',
    warning: 'text-yellow-600 bg-yellow-100',
    danger: 'text-red-600 bg-red-100',
  };

  return (
    <Card className={`p-6 border-2 ${variantStyles[variant]} transition-all hover:shadow-lg`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-[#4F4F4F] mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          {description && (
            <p className="text-xs text-gray-600 mb-2">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1">
              <span
                className={`text-xs font-semibold ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
              <span className="text-xs text-gray-500">vs. mês anterior</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconStyles[variant]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
};
