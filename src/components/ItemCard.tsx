import { useState } from 'react';
import { Check, Link2, Maximize2, Pencil } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Item } from '../db';
import { domainFromUrl } from '../utils';

export function ItemCard({
  item,
  onClick,
  onImageClick,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: {
  item: Item;
  onClick: () => void;
  onImageClick: (url: string) => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const [remoteThumbnailFailed, setRemoteThumbnailFailed] = useState(false);
  const displayUrl = item.imageUrl ?? (!remoteThumbnailFailed ? item.linkThumbnailUrl : undefined);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: selectionMode,
  });

  const handleCardClick = () => {
    if (selectionMode) {
      onToggleSelect?.();
      return;
    }
    onClick();
  };

  return (
    <button
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
      {...(selectionMode ? {} : attributes)}
      {...(selectionMode ? {} : listeners)}
      onClick={handleCardClick}
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition-shadow hover:shadow-md ${
        selectionMode ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
      } ${selected ? 'border-sage ring-2 ring-sage' : 'border-line'}`}
    >
      <div
        className="group/image relative aspect-[4/3] w-full overflow-hidden bg-cream-dark"
        onClick={
          displayUrl && !selectionMode
            ? (e) => {
                e.stopPropagation();
                onImageClick(displayUrl);
              }
            : undefined
        }
      >
        {displayUrl ? (
          <>
            <img
              src={displayUrl}
              alt={item.name}
              onError={() => setRemoteThumbnailFailed(true)}
              className="h-full w-full object-cover transition-transform duration-300 group-hover/image:scale-105"
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover/image:bg-black/20">
              <Maximize2
                size={20}
                className="text-white opacity-0 transition-opacity group-hover/image:opacity-100"
              />
            </div>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-light">
            <Link2 size={28} />
            <span className="max-w-[80%] truncate text-xs">
              {item.linkUrl ? domainFromUrl(item.linkUrl) : '連結'}
            </span>
          </div>
        )}
        {selectionMode && (
          <div
            className={`absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 shadow-sm ${
              selected ? 'border-sage bg-sage text-white' : 'border-white bg-white/70 text-transparent'
            }`}
          >
            <Check size={14} />
          </div>
        )}
      </div>
      <div className="relative flex flex-1 flex-col gap-2 p-3 pr-9">
        <p className="truncate text-sm font-medium text-ink">{item.name || '未命名'}</p>
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-full bg-tag px-2 py-0.5 text-xs text-white"
              >
                {t}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="text-xs text-ink-light">+{item.tags.length - 3}</span>
            )}
          </div>
        )}
        {!selectionMode && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="absolute bottom-2 right-2 rounded-full border border-line bg-white p-1.5 text-ink-light opacity-0 shadow-sm transition-opacity hover:border-sage hover:text-sage group-hover:opacity-100"
          >
            <Pencil size={13} />
          </div>
        )}
      </div>
    </button>
  );
}
