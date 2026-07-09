export type ItemType = 'image' | 'link';

export interface Item {
  id: string;
  type: ItemType;
  name: string;
  note?: string;
  tags: string[];
  folderIds: string[];
  linkUrl?: string;
  linkThumbnailUrl?: string;
  imageUrl?: string;
  createdAt: number;
  updatedAt: number;
  order: number;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

export interface ItemRow {
  id: string;
  type: ItemType;
  name: string;
  note: string | null;
  tags: string[];
  folder_ids: string[];
  link_url: string | null;
  link_thumbnail_url: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  sort_order: number;
}

export interface FolderRow {
  id: string;
  name: string;
  created_at: string;
}

export function rowToItem(row: ItemRow): Item {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    note: row.note ?? undefined,
    tags: row.tags ?? [],
    folderIds: row.folder_ids ?? [],
    linkUrl: row.link_url ?? undefined,
    linkThumbnailUrl: row.link_thumbnail_url ?? undefined,
    imageUrl: row.image_url ?? undefined,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    order: row.sort_order,
  };
}

export function rowToFolder(row: FolderRow): Folder {
  return {
    id: row.id,
    name: row.name,
    createdAt: new Date(row.created_at).getTime(),
  };
}
