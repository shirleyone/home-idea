import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from './Modal';
import { FolderPicker } from './FolderPicker';
import type { Folder } from '../db';

export function BulkFolderModal({
  folders,
  selectedCount,
  initialFolderIds,
  onApply,
  onClose,
}: {
  folders: Folder[];
  selectedCount: number;
  initialFolderIds: string[];
  onApply: (folderIds: string[]) => Promise<void>;
  onClose: () => void;
}) {
  const [folderIds, setFolderIds] = useState<string[]>(initialFolderIds);
  const [applying, setApplying] = useState(false);

  const changed =
    folderIds.length !== initialFolderIds.length || folderIds.some((f) => !initialFolderIds.includes(f));

  const handleApply = async () => {
    if (!changed) return;
    setApplying(true);
    try {
      await onApply(folderIds);
    } finally {
      setApplying(false);
    }
  };

  return (
    <Modal title={`已選取的 ${selectedCount} 項的收藏夾`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <FolderPicker folders={folders} selected={folderIds} onChange={setFolderIds} />
        <p className="text-xs text-ink-light">
          目前勾選的是每個選取項目都在的收藏夾,勾選加入全部,取消勾選則從全部移除
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
