import { useEffect, useRef, useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import type { Item } from '../db';
import { ItemCard } from './ItemCard';
import { Lightbox } from './Lightbox';
import { ImagePlus, SearchX } from 'lucide-react';
import { reorderItem } from '../hooks';

const PAGE_SIZE = 15;

export function Gallery({
  items,
  onItemClick,
  onAddClick,
  isFiltering,
  filterKey,
  selectionMode = false,
  selectedIds,
  onToggleSelect,
}: {
  items: Item[];
  onItemClick: (id: string) => void;
  onAddClick: () => void;
  isFiltering: boolean;
  filterKey: string;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filterKey]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, items.length));
        }
      },
      { rootMargin: '400px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [items.length]);

  const visibleItems = items.slice(0, visibleCount);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    const movedIndex = reordered.findIndex((i) => i.id === active.id);
    const above = reordered[movedIndex - 1];
    const below = reordered[movedIndex + 1];
    await reorderItem(active.id as string, above, below);
  };

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
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={visibleItems.map((i) => i.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {visibleItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onClick={() => onItemClick(item.id)}
              onImageClick={setLightboxUrl}
              selectionMode={selectionMode}
              selected={selectedIds?.has(item.id) ?? false}
              onToggleSelect={() => onToggleSelect?.(item.id)}
            />
          ))}
        </div>
      </SortableContext>
      {visibleCount < items.length && <div ref={sentinelRef} className="h-1 w-full" />}
      {lightboxUrl && <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </DndContext>
  );
}
