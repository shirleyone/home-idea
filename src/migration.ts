import { legacyDb } from './legacyDb';
import { supabase } from './supabaseClient';
import { uploadImage } from './hooks';

export async function countLegacyData() {
  const [itemCount, folderCount] = await Promise.all([
    legacyDb.items.count(),
    legacyDb.folders.count(),
  ]);
  return itemCount + folderCount;
}

export async function migrateLegacyData(onProgress?: (done: number, total: number) => void) {
  const [legacyItems, legacyFolders] = await Promise.all([
    legacyDb.items.toArray(),
    legacyDb.folders.toArray(),
  ]);

  const total = legacyItems.length + legacyFolders.length;
  let done = 0;

  for (const folder of legacyFolders) {
    const { error } = await supabase.from('folders').insert({
      id: folder.id,
      name: folder.name,
      created_at: new Date(folder.createdAt).toISOString(),
    });
    if (error) throw error;
    done++;
    onProgress?.(done, total);
  }

  for (const item of legacyItems) {
    let imageUrl: string | undefined;
    if (item.image) {
      const ext = item.image.type.split('/')[1] ?? 'jpg';
      imageUrl = await uploadImage(item.image, item.id, `image.${ext}`);
    }
    const { error } = await supabase.from('items').insert({
      id: item.id,
      type: item.type,
      name: item.name,
      note: item.note ?? null,
      tags: item.tags,
      folder_ids: item.folderIds,
      link_url: item.linkUrl ?? null,
      link_thumbnail_url: item.linkThumbnailUrl ?? null,
      image_url: imageUrl ?? null,
      created_at: new Date(item.createdAt).toISOString(),
      updated_at: new Date(item.updatedAt).toISOString(),
      sort_order: item.order,
    });
    if (error) throw error;
    done++;
    onProgress?.(done, total);
  }

  await legacyDb.items.clear();
  await legacyDb.folders.clear();
}
