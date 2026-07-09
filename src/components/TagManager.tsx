import { useState } from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { Modal } from './Modal';
import { deleteTagEverywhere, renameTagEverywhere } from '../hooks';

export function TagManager({ allTags, onClose }: { allTags: string[]; onClose: () => void }) {
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const startEdit = (tag: string) => {
    setEditingTag(tag);
    setEditingValue(tag);
  };

  const commitEdit = async () => {
    if (editingTag && editingValue.trim() && editingValue.trim() !== editingTag) {
      await renameTagEverywhere(editingTag, editingValue.trim());
    }
    setEditingTag(null);
  };

  const handleDelete = async (tag: string) => {
    if (!confirm(`刪除標籤「${tag}」?相關內容會保留,只會移除此標籤。`)) return;
    await deleteTagEverywhere(tag);
  };

  return (
    <Modal title="管理標籤" onClose={onClose}>
      {allTags.length === 0 ? (
        <p className="text-sm text-ink-light">尚無任何標籤</p>
      ) : (
        <div className="flex flex-col gap-1">
          {allTags.map((tag) => (
            <div key={tag} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-cream-dark">
              {editingTag === tag ? (
                <div className="flex flex-1 items-center gap-1">
                  <input
                    autoFocus
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                    className="flex-1 rounded-lg border border-sage px-2 py-1 text-sm outline-none"
                  />
                  <button onClick={commitEdit} className="rounded p-1 text-sage hover:bg-sage-light">
                    <Check size={14} />
                  </button>
                  <button onClick={() => setEditingTag(null)} className="rounded p-1 hover:bg-cream-dark">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-sm text-ink">{tag}</span>
                  <span className="flex items-center gap-1">
                    <button onClick={() => startEdit(tag)} className="rounded p-1 text-ink-light hover:bg-white">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(tag)} className="rounded p-1 text-ink-light hover:bg-white">
                      <Trash2 size={14} />
                    </button>
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
