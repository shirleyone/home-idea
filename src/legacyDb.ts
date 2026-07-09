import Dexie, { type Table } from 'dexie';

export type LegacyItemType = 'image' | 'link';

export interface LegacyItem {
  id: string;
  type: LegacyItemType;
  name: string;
  note?: string;
  tags: string[];
  folderIds: string[];
  linkUrl?: string;
  linkThumbnailUrl?: string;
  image?: Blob;
  createdAt: number;
  updatedAt: number;
  order: number;
}

export interface LegacyFolder {
  id: string;
  name: string;
  createdAt: number;
}

class LegacyInspirationDB extends Dexie {
  items!: Table<LegacyItem, string>;
  folders!: Table<LegacyFolder, string>;

  constructor() {
    super('home-idea-db');
    this.version(1).stores({
      items: 'id, type, name, createdAt, *tags, *folderIds',
      folders: 'id, name, createdAt',
    });
    this.version(2)
      .stores({
        items: 'id, type, name, createdAt, order, *tags, *folderIds',
        folders: 'id, name, createdAt',
      })
      .upgrade(async (tx) => {
        await tx
          .table('items')
          .toCollection()
          .modify((item) => {
            item.order = item.createdAt;
          });
      });
  }
}

export const legacyDb = new LegacyInspirationDB();
