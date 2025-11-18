import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type CustomerFilter = 'all' | 'new' | 'recurring' | 'at_risk' | 'inactive';

interface FilterTagsProps {
  activeFilter: CustomerFilter;
  onFilterChange: (filter: CustomerFilter) => void;
  counts: {
    all: number;
    new: number;
    recurring: number;
    at_risk: number;
    inactive: number;
  };
}

export const FilterTags = ({ activeFilter, onFilterChange, counts }: FilterTagsProps) => {
  const filters: { value: CustomerFilter; label: string; count: number }[] = [
    { value: 'all', label: 'Todos', count: counts.all },
    { value: 'new', label: 'Novos', count: counts.new },
    { value: 'recurring', label: 'Recorrentes', count: counts.recurring },
    { value: 'at_risk', label: 'Em risco', count: counts.at_risk },
    { value: 'inactive', label: 'Inativos', count: counts.inactive },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Badge
          key={filter.value}
          variant={activeFilter === filter.value ? 'default' : 'outline'}
          className={cn(
            'cursor-pointer px-4 py-2 text-sm font-medium transition-all hover:shadow-md',
            activeFilter === filter.value
              ? 'bg-[#007BFF] text-white border-[#007BFF] shadow-sm hover:bg-[#0056D2]'
              : 'bg-white text-[#4F4F4F] border-gray-300 hover:bg-[#E8F1FF] hover:border-[#007BFF] hover:text-[#007BFF]'
          )}
          onClick={() => onFilterChange(filter.value)}
        >
          {filter.label} ({filter.count})
        </Badge>
      ))}
    </div>
  );
};
