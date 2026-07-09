import { useState } from 'react';
import { ExternalLink, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { Modal } from './Modal';
import { TagInput } from './TagInput';
import { FolderPicker } from './FolderPicker';
import { updateItem } from '../hooks';
import type { Folder, Item } from '../db';
import { useObjectUrl, domainFromUrl, fetchLinkThumbnail } from '../utils';

export function ItemDrawer({
  item,
  folders,
  allTags,
  onClose,
  onDelete,
}: {
  item: Item;
  folders: Folder[];
  allTags: string[];
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState(item.name);
  const [note, setNote] = useState(item.note ?? '');
  const [tags, setTags] = useState(item.tags);
  const [folderIds, setFolderIds] = useState(item.folderIds);
  const [refetching, setRefetching] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const imageUrl = useObjectUrl(item.image);
  const displayUrl = imageUrl ?? (!thumbnailFailed ? item.linkThumbnailUrl : undefined);

  const save = async (changes: Partial<Item>) => {
    await updateItem(item.id, changes);
  };

  const handleRefetchThumbnail = async () => {
    if (!item.linkUrl) return;
    setRefetching(true);
    try {
      const thumb = await fetchLinkThumbnail(item.linkUrl);
      setThumbnailFailed(false);
      await save({ linkThumbnailUrl: thumb, image: undefined });
    } finally {
      setRefetching(false);
    }
  };

  const handleUploadImage = async (file: File | undefined) => {
    if (!file) return;
    await save({ image: file });
  };

  return (
    <Modal title="編輯靈感" onClose={onClose} wide>
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="w-full shrink-0 sm:w-56">
          <div className="aspect-[4/3] overflow-hidden rounded-xl bg-cream-dark">
            {refetching ? (
              <div className="flex h-full w-full items-center justify-center text-ink-light">
                <Loader2 size={20} className="animate-spin" />
              </div>
            ) : displayUrl ? (
              <img
                src={displayUrl}
                onError={() => setThumbnailFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-ink-light">
                {item.linkUrl ? domainFromUrl(item.linkUrl) : '連結'}
              </div>
            )}
          </div>
          {item.linkUrl && (
            <a
              href={item.linkUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex items-center gap-1 text-sm text-sky hover:underline"
            >
              <ExternalLink size={14} />
              開啟原始連結
            </a>
          )}
          <div className="mt-2 flex flex-col gap-1.5">
            {item.linkUrl && (
              <button
                onClick={handleRefetchThumbnail}
                disabled={refetching}
                className="flex items-center gap-1 text-xs text-ink-light hover:text-sage disabled:opacity-50"
              >
                <RefreshCw size={12} />
                重新抓取縮圖
              </button>
            )}
            <label className="flex w-fit cursor-pointer items-center gap-1 text-xs text-ink-light hover:text-sage">
              上傳自訂縮圖
              <input
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                className="hidden"
                onChange={(e) => handleUploadImage(e.target.files?.[0])}
              />
            </label>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div>
            <p className="mb-1 text-sm font-medium text-ink-light">名稱</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => save({ name })}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-sage"
            />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-ink-light">標籤</p>
            <TagInput
              tags={tags}
              onChange={(t) => {
                setTags(t);
                save({ tags: t });
              }}
              existingTags={allTags}
            />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-ink-light">收藏夾</p>
            <FolderPicker
              folders={folders}
              selected={folderIds}
              onChange={(ids) => {
                setFolderIds(ids);
                save({ folderIds: ids });
              }}
            />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-ink-light">備註(選填)</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={() => save({ note })}
              rows={2}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-sage"
            />
          </div>

          <button
            onClick={() => onDelete(item.id)}
            className="mt-2 flex w-fit items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm text-ink-light hover:border-red-300 hover:text-red-500"
          >
            <Trash2 size={14} />
            刪除
          </button>
        </div>
      </div>
    </Modal>
  );
}
