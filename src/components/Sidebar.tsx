import { useState } from 'react';
import { Folder as FolderIcon, Pencil, Plus, Tags, Trash2, X } from 'lucide-react';
import type { Folder } from '../db';
import { addFolder, deleteFolder, renameFolder } from '../hooks';
import { TagChip } from './TagChip';

export function Sidebar({
  folders,
  allTags,
  selectedFolderId,
  onSelectFolder,
  selectedTags,
  onToggleTag,
  onOpenTagManager,
  onClose,
}: {
  folders: Folder[];
  allTags: string[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onOpenTagManager: () => void;
  onClose?: () => void;
}) {
  const [newFolderName, setNewFolderName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAddFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    await addFolder(name);
    setNewFolderName('');
  };

  const startEdit = (f: Folder) => {
    setEditingId(f.id);
    setEditingName(f.name);
  };

  const commitEdit = async () => {
    if (editingId && editingName.trim()) {
      await renameFolder(editingId, editingName.trim());
    }
    setEditingId(null);
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('刪除此收藏夾?內容不會被刪除,只會移出收藏夾。')) return;
    if (selectedFolderId === id) onSelectFolder(null);
    await deleteFolder(id);
  };

  return (
    <div className="flex h-full w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r border-line bg-cream p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium text-ink">裝潢家居參考</h1>
        {onClose && (
          <button onClick={onClose} className="rounded-full p-1 hover:bg-cream-dark md:hidden">
            <X size={18} />
          </button>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-ink-light">
          <FolderIcon size={16} />
          收藏夾
        </div>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onSelectFolder(null)}
            className={`rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
              selectedFolderId === null ? 'bg-sage-light text-ink' : 'text-ink-light hover:bg-cream-dark'
            }`}
          >
            全部靈感
          </button>
          {folders.map((f) =>
            editingId === f.id ? (
              <input
                key={f.id}
                autoFocus
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                className="rounded-lg border border-sage px-3 py-1.5 text-sm outline-none"
              />
            ) : (
              <div
                key={f.id}
                className={`group flex items-center justify-between rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  selectedFolderId === f.id ? 'bg-sage-light text-ink' : 'text-ink-light hover:bg-cream-dark'
                }`}
              >
                <button onClick={() => onSelectFolder(f.id)} className="flex-1 truncate text-left">
                  {f.name}
                </button>
                <span className="hidden shrink-0 items-center gap-1 group-hover:flex">
                  <button onClick={() => startEdit(f)} className="rounded p-0.5 hover:bg-black/10">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => handleDeleteFolder(f.id)} className="rounded p-0.5 hover:bg-black/10">
                    <Trash2 size={12} />
                  </button>
                </span>
              </div>
            ),
          )}
        </div>
        <div className="mt-2 flex gap-1">
          <input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()}
            placeholder="新增收藏夾"
            className="w-full rounded-lg border border-line bg-white px-2 py-1 text-sm outline-none focus:border-sage"
          />
          <button
            onClick={handleAddFolder}
            className="rounded-lg border border-line bg-white p-1.5 text-ink-light hover:border-sage hover:text-sage"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-sm font-medium text-ink-light">
          <span className="flex items-center gap-2">
            <Tags size={16} />
            標籤篩選
          </span>
          <button onClick={onOpenTagManager} className="text-xs underline hover:text-sage">
            管理標籤
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {allTags.length === 0 && <p className="text-xs text-ink-light">尚無標籤</p>}
          {allTags.map((tag) => (
            <TagChip
              key={tag}
              label={tag}
              active={selectedTags.includes(tag)}
              onClick={() => onToggleTag(tag)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
