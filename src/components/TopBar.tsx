import { Check, FolderPlus, ListChecks, Menu, Plus, Search, Tag, Trash2, X } from 'lucide-react';

export function TopBar({
  search,
  onSearchChange,
  onAddClick,
  onMenuClick,
  resultCount,
  selectionMode,
  onToggleSelectionMode,
  allSelected,
  onToggleSelectAll,
  selectedCount,
  onBulkDelete,
  onBulkTag,
  onBulkFolder,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  onAddClick: () => void;
  onMenuClick: () => void;
  resultCount: number;
  selectionMode: boolean;
  onToggleSelectionMode: () => void;
  allSelected: boolean;
  onToggleSelectAll: () => void;
  selectedCount: number;
  onBulkDelete: () => void;
  onBulkTag: () => void;
  onBulkFolder: () => void;
}) {
  if (selectionMode) {
    return (
      <div className="flex items-center gap-3 border-b border-line bg-cream/80 px-4 py-3 backdrop-blur">
        <button
          onClick={onToggleSelectAll}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 md:hidden ${
            allSelected ? 'border-sage bg-sage text-white' : 'border-line bg-white text-transparent'
          }`}
          aria-label="全選"
        >
          <Check size={14} />
        </button>
        <button
          onClick={onToggleSelectAll}
          className="hidden shrink-0 items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-sm text-ink hover:border-sage md:flex"
        >
          <span
            className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
              allSelected ? 'border-sage bg-sage text-white' : 'border-line text-transparent'
            }`}
          >
            <Check size={10} />
          </span>
          全選
        </button>
        <span className="flex-1 text-sm text-ink-light">已選取 {selectedCount} 項</span>
        <button
          onClick={onBulkTag}
          disabled={selectedCount === 0}
          className="flex shrink-0 items-center gap-1 rounded-full border border-line px-3 py-2 text-sm text-ink-light hover:border-sage hover:text-sage disabled:opacity-40"
        >
          <Tag size={14} />
          <span className="hidden sm:inline">標籤</span>
        </button>
        <button
          onClick={onBulkFolder}
          disabled={selectedCount === 0}
          className="flex shrink-0 items-center gap-1 rounded-full border border-line px-3 py-2 text-sm text-ink-light hover:border-sage hover:text-sage disabled:opacity-40"
        >
          <FolderPlus size={14} />
          <span className="hidden sm:inline">收藏夾</span>
        </button>
        <button
          onClick={onBulkDelete}
          disabled={selectedCount === 0}
          className="flex shrink-0 items-center gap-1 rounded-full border border-line px-4 py-2 text-sm text-ink-light hover:border-red-300 hover:text-red-500 disabled:opacity-40"
        >
          <Trash2 size={14} />
          <span className="hidden sm:inline">刪除</span>
        </button>
        <button
          onClick={onToggleSelectionMode}
          className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm text-white transition-opacity hover:opacity-90"
        >
          取消
        </button>
      </div>
    );
  }

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
        onClick={onToggleSelectionMode}
        className="flex shrink-0 items-center gap-1 rounded-full border border-line px-3 py-2 text-sm text-ink-light hover:border-sage hover:text-sage"
      >
        <ListChecks size={16} />
        <span className="hidden sm:inline">選取</span>
      </button>
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
