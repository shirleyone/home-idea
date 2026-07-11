import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Link2, Loader2, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import { Modal } from './Modal';
import { TagInput } from './TagInput';
import { FolderPicker } from './FolderPicker';
import { addItem } from '../hooks';
import type { Folder } from '../db';
import { fetchLinkThumbnail, isValidHttpUrl } from '../utils';

const MAX_BATCH = 10;

interface Draft {
  file: File;
  previewUrl: string;
  name: string;
  tags: string[];
}

export function AddModal({
  folders,
  allTags,
  onClose,
}: {
  folders: Folder[];
  allTags: string[];
  onClose: () => void;
}) {
  const [mode, setMode] = useState<'image' | 'link'>('image');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [sharedFolderIds, setSharedFolderIds] = useState<string[]>([]);
  const [batchTagInput, setBatchTagInput] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [linkTags, setLinkTags] = useState<string[]>([]);
  const [linkImage, setLinkImage] = useState<File | null>(null);
  const [autoThumbnailUrl, setAutoThumbnailUrl] = useState<string | undefined>(undefined);
  const [thumbnailStatus, setThumbnailStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const lastFetchedUrl = useRef<string>('');

  useEffect(() => {
    if (!isValidHttpUrl(linkUrl)) return;
    const handle = setTimeout(async () => {
      if (linkUrl === lastFetchedUrl.current) return;
      lastFetchedUrl.current = linkUrl;
      setThumbnailStatus('loading');
      const thumb = await fetchLinkThumbnail(linkUrl);
      if (lastFetchedUrl.current !== linkUrl) return;
      setAutoThumbnailUrl(thumb);
      setThumbnailStatus(thumb ? 'done' : 'error');
    }, 600);
    return () => clearTimeout(handle);
  }, [linkUrl]);

  const refetchThumbnail = async () => {
    if (!isValidHttpUrl(linkUrl)) return;
    setThumbnailStatus('loading');
    const thumb = await fetchLinkThumbnail(linkUrl);
    setAutoThumbnailUrl(thumb);
    setThumbnailStatus(thumb ? 'done' : 'error');
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setError('');
    const incoming = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const combined = [...drafts.map((d) => d.file), ...incoming];
    if (combined.length > MAX_BATCH) {
      setError(`單次最多上傳 ${MAX_BATCH} 個內容,請分次上傳`);
      return;
    }
    const newDrafts = incoming.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name.replace(/\.[^/.]+$/, ''),
      tags: [],
    }));
    setDrafts((prev) => [...prev, ...newDrafts]);
  };

  const removeDraft = (index: number) => {
    setDrafts((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDraft = (index: number, changes: Partial<Draft>) => {
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...changes } : d)));
  };

  const applyBatchTags = () => {
    if (batchTagInput.length === 0) return;
    setDrafts((prev) =>
      prev.map((d) => ({ ...d, tags: Array.from(new Set([...d.tags, ...batchTagInput])) })),
    );
  };

  const handleSaveImages = async () => {
    if (drafts.length === 0) return;
    setSaving(true);
    try {
      for (const draft of drafts) {
        if (draft.file.size > 30 * 1024 * 1024) continue;
        await addItem({
          type: 'image',
          name: draft.name || '未命名',
          tags: draft.tags,
          folderIds: sharedFolderIds,
          image: draft.file,
        });
      }
      window.location.reload();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLink = async () => {
    if (!isValidHttpUrl(linkUrl)) {
      setError('連結格式不正確');
      return;
    }
    setSaving(true);
    try {
      await addItem({
        type: 'link',
        name: linkName || linkUrl,
        tags: linkTags,
        folderIds: sharedFolderIds,
        linkUrl,
        linkThumbnailUrl: autoThumbnailUrl,
        image: linkImage ?? undefined,
      });
      window.location.reload();
    } finally {
      setSaving(false);
    }
  };

  const oversized = drafts.some((d) => d.file.size > 30 * 1024 * 1024);

  return (
    <Modal title="新增靈感" onClose={onClose} wide>
      <div className="mb-4 flex gap-2 rounded-full bg-cream-dark p-1">
        <button
          onClick={() => setMode('image')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-sm transition-colors ${
            mode === 'image' ? 'bg-white shadow-sm' : 'text-ink-light'
          }`}
        >
          <ImagePlus size={16} />
          上傳圖片
        </button>
        <button
          onClick={() => setMode('link')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-sm transition-colors ${
            mode === 'link' ? 'bg-white shadow-sm' : 'text-ink-light'
          }`}
        >
          <Link2 size={16} />
          貼上連結
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded-lg bg-sand-light px-3 py-2 text-sm text-ink">{error}</div>
      )}

      {mode === 'image' ? (
        <div className="flex flex-col gap-4">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-cream/50 py-8 text-ink-light hover:border-sage">
            <UploadCloud size={28} />
            <span className="text-sm">點擊或拖曳圖片到這裡(單次最多 {MAX_BATCH} 張,單張 30MB 內)</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>

          {drafts.length > 0 && (
            <>
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-ink-light">套用到全部圖片的標籤</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <TagInput tags={batchTagInput} onChange={setBatchTagInput} existingTags={allTags} />
                  </div>
                  <button
                    onClick={applyBatchTags}
                    className="shrink-0 rounded-full border border-sage px-3 py-1.5 text-sm text-sage hover:bg-sage-light"
                  >
                    套用全部
                  </button>
                </div>
              </div>

              <div>
                <p className="mb-1 text-sm font-medium text-ink-light">收藏夾(套用到全部)</p>
                <FolderPicker folders={folders} selected={sharedFolderIds} onChange={setSharedFolderIds} />
              </div>

              <div className="flex flex-col gap-3">
                {drafts.map((d, i) => (
                  <div key={i} className="flex gap-3 rounded-xl border border-line p-3">
                    <img src={d.previewUrl} className="h-20 w-20 shrink-0 rounded-lg object-cover" />
                    <div className="flex flex-1 flex-col gap-2">
                      <input
                        value={d.name}
                        onChange={(e) => updateDraft(i, { name: e.target.value })}
                        placeholder="命名這張圖片"
                        className="rounded-lg border border-line px-2 py-1 text-sm outline-none focus:border-sage"
                      />
                      <TagInput
                        tags={d.tags}
                        onChange={(tags) => updateDraft(i, { tags })}
                        existingTags={allTags}
                      />
                      {d.file.size > 30 * 1024 * 1024 && (
                        <p className="text-xs text-red-500">檔案過大,將略過此圖片</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeDraft(i)}
                      className="h-fit shrink-0 rounded-full p-1.5 text-ink-light hover:bg-cream-dark"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSaveImages}
                disabled={saving}
                className="rounded-full bg-sage py-2.5 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? '儲存中...' : `新增 ${drafts.length} 個內容${oversized ? '(略過過大檔案)' : ''}`}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-1 text-sm font-medium text-ink-light">連結網址</p>
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-sage"
            />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-ink-light">命名(選填)</p>
            <input
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
              placeholder="例如:IKEA 床架 - 原木色"
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-sage"
            />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-ink-light">縮圖</p>
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-cream-dark">
                {linkImage ? (
                  <img src={URL.createObjectURL(linkImage)} className="h-full w-full object-cover" />
                ) : thumbnailStatus === 'loading' ? (
                  <Loader2 size={18} className="animate-spin text-ink-light" />
                ) : autoThumbnailUrl ? (
                  <img src={autoThumbnailUrl} className="h-full w-full object-cover" />
                ) : (
                  <Link2 size={18} className="text-ink-light" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <p className="text-xs text-ink-light">
                  {thumbnailStatus === 'loading' && '正在自動抓取縮圖...'}
                  {thumbnailStatus === 'done' && !linkImage && '已自動抓取縮圖,可自行上傳圖片覆蓋'}
                  {thumbnailStatus === 'error' && '無法自動抓取縮圖,將顯示網域佔位圖,可自行上傳'}
                  {thumbnailStatus === 'idle' && '輸入連結後將自動抓取縮圖'}
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    onChange={(e) => setLinkImage(e.target.files?.[0] ?? null)}
                    className="text-xs"
                  />
                  {isValidHttpUrl(linkUrl) && (
                    <button
                      type="button"
                      onClick={refetchThumbnail}
                      className="flex shrink-0 items-center gap-1 rounded-full border border-line px-2 py-1 text-xs text-ink-light hover:border-sage hover:text-sage"
                    >
                      <RefreshCw size={12} />
                      重新抓取
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-ink-light">標籤</p>
            <TagInput tags={linkTags} onChange={setLinkTags} existingTags={allTags} />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-ink-light">收藏夾</p>
            <FolderPicker folders={folders} selected={sharedFolderIds} onChange={setSharedFolderIds} />
          </div>
          <button
            onClick={handleSaveLink}
            disabled={saving || !linkUrl}
            className="rounded-full bg-sage py-2.5 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? '儲存中...' : '新增連結'}
          </button>
        </div>
      )}
    </Modal>
  );
}
