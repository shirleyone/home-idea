import { useEffect, useState } from 'react';

export function useObjectUrl(blob?: Blob) {
  const [url, setUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!blob) {
      setUrl(undefined);
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  return url;
}

export function domainFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function isValidHttpUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function fetchLinkThumbnail(url: string): Promise<string | undefined> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}&palette=false`, {
      signal: controller.signal,
    });
    if (!res.ok) return undefined;
    const json = await res.json();
    return json?.data?.image?.url ?? json?.data?.logo?.url ?? undefined;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

const STYLE_TAGS = ['北歐', '現代簡約', '工業風', '日式簡約', '美式', '中式', '法式', '波西米亞', '溫馨鄉村'];
const ROOM_TAGS = ['客廳', '臥室', '廚房', '浴室', '玄關', '書房', '餐廳', '陽台'];
const CATEGORY_TAGS = ['家具', '照明', '裝飾品', '五金配件', '窗簾', '地毯', '家電'];
const PURPOSE_TAGS = ['收納', '點綴', '功能性', '採光'];

export const SUGGESTED_TAG_GROUPS: { label: string; tags: string[] }[] = [
  { label: '風格', tags: STYLE_TAGS },
  { label: '場域', tags: ROOM_TAGS },
  { label: '類別', tags: CATEGORY_TAGS },
  { label: '用途', tags: PURPOSE_TAGS },
];
