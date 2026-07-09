import type { Folder } from '../db';

export function FolderPicker({
  folders,
  selected,
  onChange,
}: {
  folders: Folder[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  if (folders.length === 0) {
    return <p className="text-xs text-ink-light">尚未建立收藏夾(可在左側新增)</p>;
  }

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {folders.map((f) => (
        <label
          key={f.id}
          className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${
            selected.includes(f.id)
              ? 'border-sky bg-sky-light text-ink'
              : 'border-line text-ink-light hover:border-sky'
          }`}
        >
          <input
            type="checkbox"
            checked={selected.includes(f.id)}
            onChange={() => toggle(f.id)}
            className="hidden"
          />
          {f.name}
        </label>
      ))}
    </div>
  );
}
