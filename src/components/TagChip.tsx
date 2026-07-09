import { X } from 'lucide-react';

export function TagChip({
  label,
  active,
  onClick,
  onRemove,
  tone = 'sage',
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  tone?: 'sage' | 'sky' | 'sand';
}) {
  const toneClasses = {
    sage: active
      ? 'bg-sage text-white border-sage'
      : 'bg-tag text-white border-transparent hover:opacity-90',
    sky: active
      ? 'bg-sky text-white border-sky'
      : 'bg-sky-light text-ink border-transparent hover:border-sky',
    sand: active
      ? 'bg-sand text-white border-sand'
      : 'bg-sand-light text-ink border-transparent hover:border-sand',
  }[tone];

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors ${toneClasses} ${
        onClick ? 'cursor-pointer select-none' : ''
      }`}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-full p-0.5 hover:bg-black/10"
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
}
