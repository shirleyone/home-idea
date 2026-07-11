import { ImagePlus, Link2, LayoutGrid } from 'lucide-react';
import type { ItemType } from '../db';

export type TypeFilter = 'all' | ItemType;

const TABS: { value: TypeFilter; label: string; icon: typeof LayoutGrid }[] = [
  { value: 'all', label: '全部', icon: LayoutGrid },
  { value: 'image', label: '圖片', icon: ImagePlus },
  { value: 'link', label: '連結', icon: Link2 },
];

export function TypeTabs({
  value,
  onChange,
}: {
  value: TypeFilter;
  onChange: (v: TypeFilter) => void;
}) {
  return (
    <div className="flex gap-1 border-b border-line bg-cream/80 px-4 pt-2 backdrop-blur">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`flex items-center gap-1.5 rounded-t-lg border-b-2 px-3 py-2 text-sm transition-colors ${
            value === tab.value
              ? 'border-sage text-ink font-medium'
              : 'border-transparent text-ink-light hover:text-ink'
          }`}
        >
          <tab.icon size={14} />
          {tab.label}
        </button>
      ))}
    </div>
  );
}
