import { useMemo, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Gallery } from './components/Gallery';
import { AddModal } from './components/AddModal';
import { ItemDrawer } from './components/ItemDrawer';
import { TagManager } from './components/TagManager';
import { MigrationBanner } from './components/MigrationBanner';
import { BulkTagModal } from './components/BulkTagModal';
import { BulkFolderModal } from './components/BulkFolderModal';
import { TypeTabs, type TypeFilter } from './components/TypeTabs';
import {
  useAllTags,
  useFolders,
  useItems,
  useTagRegistry,
  deleteItem,
  restoreItem,
  updateItem,
} from './hooks';
import type { Item } from './db';

export function HomeApp({ userEmail }: { userEmail?: string }) {
  const items = useItems();
  const [folders, refetchFolders] = useFolders();
  const itemDerivedTags = useAllTags();
  const [tagRegistry, refetchTags] = useTagRegistry();
  const allTags = useMemo(
    () =>
      Array.from(new Set([...itemDerivedTags, ...(tagRegistry ?? [])])).sort((a, b) =>
        a.localeCompare(b, 'zh-Hant'),
      ),
    [itemDerivedTags, tagRegistry],
  );

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ item: Item; timer: ReturnType<typeof setTimeout> } | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTagOpen, setBulkTagOpen] = useState(false);
  const [bulkFolderOpen, setBulkFolderOpen] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (items ?? []).filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (selectedFolderId && !item.folderIds.includes(selectedFolderId)) return false;
      if (selectedTags.length > 0 && !selectedTags.every((t) => item.tags.includes(t))) return false;
      if (q) {
        const haystack = [item.name, item.note ?? '', ...item.tags].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [items, typeFilter, selectedFolderId, selectedTags, search]);

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

  const toggleSelectionMode = () => {
    setSelectionMode((prev) => !prev);
    setSelectedIds(new Set());
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = filteredItems.length > 0 && filteredItems.every((i) => selectedIds.has(i.id));

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(filteredItems.map((i) => i.id)));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`確定要刪除已選取的 ${selectedIds.size} 項嗎?`)) return;
    await Promise.all(Array.from(selectedIds).map((id) => deleteItem(id)));
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  const selectedItems = useMemo(
    () => (items ?? []).filter((i) => selectedIds.has(i.id)),
    [items, selectedIds],
  );

  const commonTags = useMemo(
    () =>
      selectedItems.length === 0
        ? []
        : selectedItems.reduce<string[]>(
            (acc, item) => acc.filter((t) => item.tags.includes(t)),
            selectedItems[0].tags,
          ),
    [selectedItems],
  );

  const commonFolderIds = useMemo(
    () =>
      selectedItems.length === 0
        ? []
        : selectedItems.reduce<string[]>(
            (acc, item) => acc.filter((f) => item.folderIds.includes(f)),
            selectedItems[0].folderIds,
          ),
    [selectedItems],
  );

  const handleBulkApplyTags = async (nextTags: string[]) => {
    const toAdd = nextTags.filter((t) => !commonTags.includes(t));
    const toRemove = commonTags.filter((t) => !nextTags.includes(t));
    await Promise.all(
      selectedItems.map((item) => {
        const tags = new Set(item.tags);
        toAdd.forEach((t) => tags.add(t));
        toRemove.forEach((t) => tags.delete(t));
        return updateItem(item.id, { tags: Array.from(tags) });
      }),
    );
    window.location.reload();
  };

  const handleBulkApplyFolders = async (nextFolderIds: string[]) => {
    const toAdd = nextFolderIds.filter((f) => !commonFolderIds.includes(f));
    const toRemove = commonFolderIds.filter((f) => !nextFolderIds.includes(f));
    await Promise.all(
      selectedItems.map((item) => {
        const folderIds = new Set(item.folderIds);
        toAdd.forEach((f) => folderIds.add(f));
        toRemove.forEach((f) => folderIds.delete(f));
        return updateItem(item.id, { folderIds: Array.from(folderIds) });
      }),
    );
    window.location.reload();
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
          onFolderAdded={refetchFolders}
          onTagAdded={refetchTags}
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
            onFolderAdded={refetchFolders}
            onTagAdded={refetchTags}
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
          selectionMode={selectionMode}
          onToggleSelectionMode={toggleSelectionMode}
          allSelected={allSelected}
          onToggleSelectAll={toggleSelectAll}
          selectedCount={selectedIds.size}
          onBulkDelete={handleBulkDelete}
          onBulkTag={() => setBulkTagOpen(true)}
          onBulkFolder={() => setBulkFolderOpen(true)}
        />
        <TypeTabs value={typeFilter} onChange={setTypeFilter} />
        <div className="flex-1 overflow-y-auto">
          <Gallery
            items={filteredItems}
            onItemClick={setActiveItemId}
            onAddClick={() => setAddOpen(true)}
            isFiltering={Boolean(
              search.trim() || selectedFolderId || selectedTags.length > 0 || typeFilter !== 'all',
            )}
            filterKey={`${search}|${typeFilter}|${selectedFolderId ?? ''}|${selectedTags.slice().sort().join(',')}`}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelectItem}
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

      {bulkTagOpen && (
        <BulkTagModal
          allTags={allTags ?? []}
          selectedCount={selectedIds.size}
          initialTags={commonTags}
          onApply={handleBulkApplyTags}
          onClose={() => setBulkTagOpen(false)}
        />
      )}

      {bulkFolderOpen && (
        <BulkFolderModal
          folders={folders ?? []}
          selectedCount={selectedIds.size}
          initialFolderIds={commonFolderIds}
          onApply={handleBulkApplyFolders}
          onClose={() => setBulkFolderOpen(false)}
        />
      )}

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
