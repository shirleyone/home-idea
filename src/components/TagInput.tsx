import { useState } from 'react';
import { TagChip } from './TagChip';
import { SUGGESTED_TAG_GROUPS } from '../utils';

export function TagInput({
  tags,
  onChange,
  existingTags = [],
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  existingTags?: string[];
}) {
  const [draft, setDraft] = useState('');

  const commit = (raw: string) => {
    const value = raw.trim();
    if (!value || tags.includes(value)) return;
    onChange([...tags, value]);
  };

  const suggestionPool = [
    ...new Set([...existingTags, ...SUGGESTED_TAG_GROUPS.flatMap((g) => g.tags)]),
  ].filter((t) => !tags.includes(t));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-line bg-white p-2">
        {tags.map((t) => (
          <TagChip key={t} label={t} onRemove={() => onChange(tags.filter((x) => x !== t))} />
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              commit(draft);
              setDraft('');
            } else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
              onChange(tags.slice(0, -1));
            }
          }}
          onBlur={() => {
            if (draft) {
              commit(draft);
              setDraft('');
            }
          }}
          placeholder={tags.length === 0 ? '輸入標籤後按 Enter' : ''}
          className="min-w-[80px] flex-1 outline-none"
        />
      </div>
      {suggestionPool.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestionPool.slice(0, 12).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChange([...tags, t])}
              className="rounded-full border border-line px-2.5 py-1 text-xs text-ink-light hover:border-tag hover:text-tag"
            >
              + {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
