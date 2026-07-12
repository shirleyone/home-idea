import { useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { supabase } from './supabaseClient';
import { rowToItem, rowToFolder, type Item, type Folder, type ItemRow, type FolderRow } from './db';

export function useItems() {
  const [items, setItems] = useState<Item[] | undefined>(undefined);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('sort_order', { ascending: false });
      if (!active) return;
      if (error) {
        console.error(error);
        return;
      }
      setItems((data as ItemRow[]).map(rowToItem));
    }

    load();
    const channel = supabase
      .channel(`items-changes-${uuid()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, load)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return items;
}

export function useFolders() {
  const [folders, setFolders] = useState<Folder[] | undefined>(undefined);

  const load = async () => {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      console.error(error);
      return;
    }
    setFolders((data as FolderRow[]).map(rowToFolder));
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`folders-changes-${uuid()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'folders' }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [folders, load] as const;
}

export function useAllTags() {
  const items = useItems();
  const set = new Set<string>();
  (items ?? []).forEach((it) => it.tags.forEach((t) => set.add(t)));
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'zh-Hant'));
}

export function useTagRegistry() {
  const [tags, setTags] = useState<string[] | undefined>(undefined);

  const load = async () => {
    const { data, error } = await supabase
      .from('tags')
      .select('name')
      .order('created_at', { ascending: true });
    if (error) {
      console.error(error);
      return;
    }
    setTags((data as { name: string }[]).map((r) => r.name));
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`tags-changes-${uuid()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tags' }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [tags, load] as const;
}

export async function addTag(name: string) {
  const { error } = await supabase.from('tags').upsert({ name }, { onConflict: 'name' });
  if (error) throw error;
}

export async function uploadImage(file: File | Blob, itemId: string, filename = 'image'): Promise<string> {
  const safeName = filename.replace(/[^\w.-]/g, '_');
  const path = `${itemId}/${uuid()}-${safeName}`;
  const { error } = await supabase.storage.from('images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('images').getPublicUrl(path);
  return data.publicUrl;
}

export async function addItem(input: {
  type: 'image' | 'link';
  name: string;
  note?: string;
  tags: string[];
  folderIds: string[];
  linkUrl?: string;
  linkThumbnailUrl?: string;
  image?: File;
}) {
  const id = uuid();
  let imageUrl: string | undefined;
  if (input.image) {
    imageUrl = await uploadImage(input.image, id, input.image.name);
  }

  const { data, error } = await supabase
    .from('items')
    .insert({
      id,
      type: input.type,
      name: input.name,
      note: input.note ?? null,
      tags: input.tags,
      folder_ids: input.folderIds,
      link_url: input.linkUrl ?? null,
      link_thumbnail_url: input.linkThumbnailUrl ?? null,
      image_url: imageUrl ?? null,
      sort_order: Date.now(),
    })
    .select()
    .single();

  if (error) throw error;
  return rowToItem(data as ItemRow);
}

function itemChangesToRow(changes: Partial<Item>) {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ('name' in changes) row.name = changes.name;
  if ('note' in changes) row.note = changes.note ?? null;
  if ('tags' in changes) row.tags = changes.tags;
  if ('folderIds' in changes) row.folder_ids = changes.folderIds;
  if ('linkUrl' in changes) row.link_url = changes.linkUrl ?? null;
  if ('linkThumbnailUrl' in changes) row.link_thumbnail_url = changes.linkThumbnailUrl ?? null;
  if ('imageUrl' in changes) row.image_url = changes.imageUrl ?? null;
  if ('order' in changes) row.sort_order = changes.order;
  return row;
}

export async function updateItem(id: string, changes: Partial<Item>) {
  const { error } = await supabase.from('items').update(itemChangesToRow(changes)).eq('id', id);
  if (error) throw error;
}

export async function deleteItem(id: string): Promise<Item | undefined> {
  const { data } = await supabase.from('items').select('*').eq('id', id).single();
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) throw error;
  return data ? rowToItem(data as ItemRow) : undefined;
}

export async function restoreItem(item: Item) {
  const { error } = await supabase.from('items').insert({
    id: item.id,
    type: item.type,
    name: item.name,
    note: item.note ?? null,
    tags: item.tags,
    folder_ids: item.folderIds,
    link_url: item.linkUrl ?? null,
    link_thumbnail_url: item.linkThumbnailUrl ?? null,
    image_url: item.imageUrl ?? null,
    sort_order: item.order,
  });
  if (error) throw error;
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
  await updateItem(id, { order: newOrder });
}

export async function renameTagEverywhere(oldTag: string, newTag: string) {
  const { data, error } = await supabase.from('items').select('*').contains('tags', [oldTag]);
  if (error) throw error;
  for (const row of (data as ItemRow[]) ?? []) {
    const tags = Array.from(new Set(row.tags.map((t) => (t === oldTag ? newTag : t))));
    await supabase.from('items').update({ tags, updated_at: new Date().toISOString() }).eq('id', row.id);
  }
  await supabase.from('tags').delete().eq('name', oldTag);
  await supabase.from('tags').upsert({ name: newTag }, { onConflict: 'name' });
}

export async function deleteTagEverywhere(tag: string) {
  const { data, error } = await supabase.from('items').select('*').contains('tags', [tag]);
  if (error) throw error;
  for (const row of (data as ItemRow[]) ?? []) {
    const tags = row.tags.filter((t) => t !== tag);
    await supabase.from('items').update({ tags, updated_at: new Date().toISOString() }).eq('id', row.id);
  }
  await supabase.from('tags').delete().eq('name', tag);
}

export async function addFolder(name: string) {
  const { data, error } = await supabase.from('folders').insert({ id: uuid(), name }).select().single();
  if (error) throw error;
  return rowToFolder(data as FolderRow);
}

export async function renameFolder(id: string, name: string) {
  const { error } = await supabase.from('folders').update({ name }).eq('id', id);
  if (error) throw error;
}

export async function deleteFolder(id: string) {
  const { data, error } = await supabase.from('items').select('*').contains('folder_ids', [id]);
  if (error) throw error;
  for (const row of (data as ItemRow[]) ?? []) {
    const folderIds = row.folder_ids.filter((f) => f !== id);
    await supabase.from('items').update({ folder_ids: folderIds }).eq('id', row.id);
  }
  const { error: deleteError } = await supabase.from('folders').delete().eq('id', id);
  if (deleteError) throw deleteError;
}
