import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from './Modal';
import { TagInput } from './TagInput';

export function BulkTagModal({
  allTags,
  selectedCount,
  initialTags,
  onApply,
  onClose,
}: {
  allTags: string[];
  selectedCount: number;
  initialTags: string[];
  onApply: (tags: string[]) => Promise<void>;
  onClose: () => void;
}) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [applying, setApplying] = useState(false);

  const changed = tags.length !== initialTags.length || tags.some((t) => !initialTags.includes(t));

  const handleApply = async () => {
    if (!changed) return;
    setApplying(true);
    try {
      await onApply(tags);
    } finally {
      setApplying(false);
    }
  };

  return (
    <Modal title={`已選取的 ${selectedCount} 項的標籤`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <TagInput tags={tags} onChange={setTags} existingTags={allTags} />
        <p className="text-xs text-ink-light">
          目前顯示的是每個選取項目都有的標籤,點 + 套用到全部,點標籤上的 x 從全部移除
        </p>
        <button
          onClick={handleApply}
          disabled={applying || !changed}
          className="flex items-center justify-center gap-1.5 rounded-full bg-sage py-2.5 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {applying && <Loader2 size={14} className="animate-spin" />}
          確定
        </button>
      </div>
    </Modal>
  );
}
