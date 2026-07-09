import { useState } from 'react';
import { Link2 } from 'lucide-react';
import type { Item } from '../db';
import { useObjectUrl, domainFromUrl } from '../utils';

export function ItemCard({ item, onClick }: { item: Item; onClick: () => void }) {
  const imageUrl = useObjectUrl(item.image);
  const [remoteThumbnailFailed, setRemoteThumbnailFailed] = useState(false);
  const displayUrl = imageUrl ?? (!remoteThumbnailFailed ? item.linkThumbnailUrl : undefined);

  return (
    <button
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-cream-dark">
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={item.name}
            onError={() => setRemoteThumbnailFailed(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-light">
            <Link2 size={28} />
            <span className="max-w-[80%] truncate text-xs">
              {item.linkUrl ? domainFromUrl(item.linkUrl) : '連結'}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="truncate text-sm font-medium text-ink">{item.name || '未命名'}</p>
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-full bg-sage-light px-2 py-0.5 text-xs text-ink-light"
              >
                {t}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="text-xs text-ink-light">+{item.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
