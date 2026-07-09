import Dexie, { type Table } from 'dexie';

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
  image?: Blob;
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

class InspirationDB extends Dexie {
  items!: Table<Item, string>;
  folders!: Table<Folder, string>;

  constructor() {
    super('home-idea-db');
    this.version(1).stores({
      items: 'id, type, name, createdAt, *tags, *folderIds',
      folders: 'id, name, createdAt',
    });
  }
}

export const db = new InspirationDB();
