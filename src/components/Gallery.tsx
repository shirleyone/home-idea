import type { Item } from '../db';
import { ItemCard } from './ItemCard';
import { ImagePlus, SearchX } from 'lucide-react';

export function Gallery({
  items,
  onItemClick,
  onAddClick,
  isFiltering,
}: {
  items: Item[];
  onItemClick: (id: string) => void;
  onAddClick: () => void;
  isFiltering: boolean;
}) {
  if (items.length === 0 && isFiltering) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-ink-light">
        <SearchX size={40} strokeWidth={1.5} />
        <p className="text-sm">未找到符合條件的內容</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-ink-light">
        <ImagePlus size={40} strokeWidth={1.5} />
        <p className="text-sm">還沒有任何靈感,開始蒐集喜歡的圖片或連結吧</p>
        <button
          onClick={onAddClick}
          className="rounded-full bg-sage px-5 py-2 text-sm text-white transition-opacity hover:opacity-90"
        >
          新增靈感
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} onClick={() => onItemClick(item.id)} />
      ))}
    </div>
  );
}
