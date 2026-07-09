import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuid } from 'uuid';
import { db, type Item, type Folder } from './db';

export function useItems() {
  return useLiveQuery(() => db.items.orderBy('order').reverse().toArray(), [], []);
}

export function useFolders() {
  return useLiveQuery(() => db.folders.orderBy('createdAt').toArray(), [], []);
}

export function useAllTags() {
  const items = useItems();
  return useLiveQuery(async () => {
    const set = new Set<string>();
    (items ?? []).forEach((it) => it.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'zh-Hant'));
  }, [items], []);
}

export async function addItem(input: {
  type: 'image' | 'link';
  name: string;
  note?: string;
  tags: string[];
  folderIds: string[];
  linkUrl?: string;
  linkThumbnailUrl?: string;
  image?: Blob;
}) {
  const now = Date.now();
  const item: Item = {
    id: uuid(),
    createdAt: now,
    updatedAt: now,
    order: now,
    tags: input.tags,
    folderIds: input.folderIds,
    name: input.name,
    note: input.note,
    type: input.type,
    linkUrl: input.linkUrl,
    linkThumbnailUrl: input.linkThumbnailUrl,
    image: input.image,
  };
  await db.items.add(item);
  return item;
}

export async function updateItem(id: string, changes: Partial<Item>) {
  await db.items.update(id, { ...changes, updatedAt: Date.now() });
}

export async function reorderItem(id: string, above: Item | undefined, below: Item | undefined) {
  // Items sort by `order` descending, so `above` (appears earlier) must end up
  // with a larger order value than `below` (appears later).
  const newOrder =
    above && below
      ? (above.order + below.order) / 2
      : above
        ? above.order - 1000
        : below
          ? below.order + 1000
          : Date.now();
  await db.items.update(id, { order: newOrder });
}

export async function deleteItem(id: string) {
  const item = await db.items.get(id);
  await db.items.delete(id);
  return item;
}

export async function restoreItem(item: Item) {
  await db.items.add(item);
}

export async function renameTagEverywhere(oldTag: string, newTag: string) {
  const items = await db.items.where('tags').equals(oldTag).toArray();
  await db.transaction('rw', db.items, async () => {
    for (const item of items) {
      const tags = Array.from(new Set(item.tags.map((t) => (t === oldTag ? newTag : t))));
      await db.items.update(item.id, { tags, updatedAt: Date.now() });
    }
  });
}

export async function deleteTagEverywhere(tag: string) {
  const items = await db.items.where('tags').equals(tag).toArray();
  await db.transaction('rw', db.items, async () => {
    for (const item of items) {
      const tags = item.tags.filter((t) => t !== tag);
      await db.items.update(item.id, { tags, updatedAt: Date.now() });
    }
  });
}

export async function addFolder(name: string) {
  const folder: Folder = { id: uuid(), name, createdAt: Date.now() };
  await db.folders.add(folder);
  return folder;
}

export async function renameFolder(id: string, name: string) {
  await db.folders.update(id, { name });
}

export async function deleteFolder(id: string) {
  const items = await db.items.where('folderIds').equals(id).toArray();
  await db.transaction('rw', db.items, db.folders, async () => {
    for (const item of items) {
      await db.items.update(item.id, { folderIds: item.folderIds.filter((f) => f !== id) });
    }
    await db.folders.delete(id);
  });
}
