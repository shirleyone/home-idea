import { useEffect, useState } from 'react';
import { CloudUpload, X } from 'lucide-react';
import { countLegacyData, migrateLegacyData } from '../migration';

export function MigrationBanner() {
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState<'idle' | 'migrating' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    countLegacyData()
      .then(setCount)
      .catch(() => setCount(0));
  }, []);

  if (dismissed || count === 0 || status === 'done') return null;

  const handleMigrate = async () => {
    setStatus('migrating');
    try {
      await migrateLegacyData((done, total) => setProgress({ done, total }));
      setStatus('done');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 border-b border-line bg-sand-light px-4 py-2.5 text-sm">
      <div className="flex items-center gap-2 text-ink">
        <CloudUpload size={16} />
        {status === 'migrating' ? (
          <span>
            搬移中...({progress.done}/{progress.total})
          </span>
        ) : status === 'error' ? (
          <span>搬移失敗,請重試</span>
        ) : (
          <span>偵測到本機還有 {count} 筆尚未搬到雲端的資料</span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {status !== 'migrating' && (
          <button
            onClick={handleMigrate}
            className="rounded-full bg-sage px-3 py-1 text-xs text-white hover:opacity-90"
          >
            搬到雲端
          </button>
        )}
        <button onClick={() => setDismissed(true)} className="rounded-full p-1 hover:bg-white/50">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
