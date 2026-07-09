import { Menu, Plus, Search, X } from 'lucide-react';

export function TopBar({
  search,
  onSearchChange,
  onAddClick,
  onMenuClick,
  resultCount,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  onAddClick: () => void;
  onMenuClick: () => void;
  resultCount: number;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-line bg-cream/80 px-4 py-3 backdrop-blur">
      <button onClick={onMenuClick} className="rounded-full p-1.5 hover:bg-cream-dark md:hidden">
        <Menu size={20} />
      </button>
      <div className="relative flex-1">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-light"
        />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="搜尋品牌、關鍵字、標籤..."
          className="w-full rounded-full border border-line bg-white py-2 pl-9 pr-8 text-sm outline-none focus:border-sage"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-cream-dark"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <span className="hidden shrink-0 text-xs text-ink-light sm:inline">{resultCount} 項</span>
      <button
        onClick={onAddClick}
        className="flex shrink-0 items-center gap-1 rounded-full bg-sage px-4 py-2 text-sm text-white transition-opacity hover:opacity-90"
      >
        <Plus size={16} />
        新增
      </button>
    </div>
  );
}
