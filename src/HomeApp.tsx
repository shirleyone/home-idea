import { useMemo, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Gallery } from './components/Gallery';
import { AddModal } from './components/AddModal';
import { ItemDrawer } from './components/ItemDrawer';
import { TagManager } from './components/TagManager';
import { MigrationBanner } from './components/MigrationBanner';
import { useAllTags, useFolders, useItems, deleteItem, restoreItem } from './hooks';
import type { Item } from './db';

export function HomeApp({ userEmail }: { userEmail?: string }) {
  const items = useItems();
  const folders = useFolders();
  const allTags = useAllTags();

  const [search, setSearch] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ item: Item; timer: ReturnType<typeof setTimeout> } | null>(null);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (items ?? []).filter((item) => {
      if (selectedFolderId && !item.folderIds.includes(selectedFolderId)) return false;
      if (selectedTags.length > 0 && !selectedTags.every((t) => item.tags.includes(t))) return false;
      if (q) {
        const haystack = [item.name, item.note ?? '', ...item.tags].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [items, selectedFolderId, selectedTags, search]);

  const activeItem = (items ?? []).find((i) => i.id === activeItemId) ?? null;

  const handleDelete = async (id: string) => {
    setActiveItemId(null);
    const removed = await deleteItem(id);
    if (!removed) return;
    if (undo) clearTimeout(undo.timer);
    const timer = setTimeout(() => setUndo(null), 6000);
    setUndo({ item: removed, timer });
  };

  const handleUndo = async () => {
    if (!undo) return;
    clearTimeout(undo.timer);
    await restoreItem(undo.item);
    setUndo(null);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-cream text-ink">
      <div className="hidden md:block">
        <Sidebar
          folders={folders ?? []}
          allTags={allTags ?? []}
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
          selectedTags={selectedTags}
          onToggleTag={toggleTag}
          onOpenTagManager={() => setTagManagerOpen(true)}
          userEmail={userEmail}
        />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <Sidebar
            folders={folders ?? []}
            allTags={allTags ?? []}
            selectedFolderId={selectedFolderId}
            onSelectFolder={(id) => {
              setSelectedFolderId(id);
              setSidebarOpen(false);
            }}
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
            onOpenTagManager={() => setTagManagerOpen(true)}
            onClose={() => setSidebarOpen(false)}
            userEmail={userEmail}
          />
          <div className="flex-1 bg-black/30" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <MigrationBanner />
        <TopBar
          search={search}
          onSearchChange={setSearch}
          onAddClick={() => setAddOpen(true)}
          onMenuClick={() => setSidebarOpen(true)}
          resultCount={filteredItems.length}
        />
        <div className="flex-1 overflow-y-auto">
          <Gallery
            items={filteredItems}
            onItemClick={setActiveItemId}
            onAddClick={() => setAddOpen(true)}
            isFiltering={Boolean(search.trim() || selectedFolderId || selectedTags.length > 0)}
          />
        </div>
      </div>

      {addOpen && (
        <AddModal folders={folders ?? []} allTags={allTags ?? []} onClose={() => setAddOpen(false)} />
      )}

      {activeItem && (
        <ItemDrawer
          item={activeItem}
          folders={folders ?? []}
          allTags={allTags ?? []}
          onClose={() => setActiveItemId(null)}
          onDelete={handleDelete}
        />
      )}

      {tagManagerOpen && <TagManager allTags={allTags ?? []} onClose={() => setTagManagerOpen(false)} />}

      {undo && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-ink px-5 py-3 text-sm text-white shadow-lg">
          已刪除「{undo.item.name}」
          <button onClick={handleUndo} className="font-medium underline">
            復原
          </button>
        </div>
      )}
    </div>
  );
}
