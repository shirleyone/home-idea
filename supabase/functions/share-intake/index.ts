// Supabase Edge Function: share-intake
//
// Lets the iOS Shortcuts share-sheet action add an item directly, without
// going through the web app's normal authenticated session. Auth is a
// shared secret (SHARE_SECRET) checked against the `x-share-token` header,
// not a Supabase user session — this function uses the service role key
// and bypasses RLS entirely, so the secret is the only gate.
//
// Deploy via the Supabase Dashboard: Edge Functions -> New Function ->
// name it "share-intake" -> paste this file's contents -> Deploy.
// Then set the SHARE_SECRET secret (Edge Functions -> share-intake ->
// Secrets). SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided
// automatically by the platform, no need to set them.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SHARE_SECRET = Deno.env.get('SHARE_SECRET')!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-share-token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  });
}

function domainFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

async function getDomainDefaults(domain: string): Promise<{ tags: string[]; folderIds: string[] }> {
  const { data } = await supabase
    .from('items')
    .select('tags, folder_ids, link_url')
    .eq('type', 'link')
    .order('updated_at', { ascending: false })
    .limit(50);
  const match = (data ?? []).find((row) => row.link_url && domainFromUrl(row.link_url) === domain);
  return { tags: match?.tags ?? [], folderIds: match?.folder_ids ?? [] };
}

async function fetchThumbnail(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}&palette=false`);
    if (!res.ok) return undefined;
    const json = await res.json();
    return json?.data?.image?.url ?? json?.data?.logo?.url ?? undefined;
  } catch {
    return undefined;
  }
}

async function handleImageUpload(id: string, file: Blob, filename: string, name: string) {
  const safeName = filename.replace(/[^\w.-]/g, '_');
  const path = `${id}/${crypto.randomUUID()}-${safeName}`;
  const contentType = file.type || 'image/jpeg';

  const { error: uploadError } = await supabase.storage
    .from('images')
    .upload(path, file, { contentType, upsert: false });
  if (uploadError) throw uploadError;

  const { data: pub } = supabase.storage.from('images').getPublicUrl(path);

  const { error } = await supabase.from('items').insert({
    id,
    type: 'image',
    name: name || '透過捷徑分享',
    tags: [],
    folder_ids: [],
    image_url: pub.publicUrl,
    sort_order: Date.now(),
  });
  if (error) throw error;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method not allowed' }, 405);
  }

  if (req.headers.get('x-share-token') !== SHARE_SECRET) {
    return jsonResponse({ error: 'unauthorized' }, 401);
  }

  const id = crypto.randomUUID();
  const contentType = req.headers.get('content-type') ?? '';

  try {
    // Multipart form upload — the preferred path for images (avoids the
    // client having to base64-encode a large file into a JSON string,
    // which is slow/unreliable in iOS Shortcuts).
    if (contentType.startsWith('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('image');
      const name = String(form.get('name') ?? '');
      if (!(file instanceof File)) {
        return jsonResponse({ error: 'missing "image" file field in form data' }, 400);
      }
      await handleImageUpload(id, file, file.name || 'shared.jpg', name);
      return jsonResponse({ ok: true, id });
    }

    // JSON path — used for links, and kept for base64 image uploads too.
    const body = await req.json();

    if (body.type === 'image' && typeof body.imageBase64 === 'string') {
      const binary = Uint8Array.from(atob(body.imageBase64), (c) => c.charCodeAt(0));
      const filename = String(body.filename || 'shared.jpg');
      const name = typeof body.name === 'string' ? body.name : '';
      await handleImageUpload(id, new Blob([binary], { type: body.contentType || 'image/jpeg' }), filename, name);
      return jsonResponse({ ok: true, id });
    }

    if (body.type === 'link' && typeof body.url === 'string') {
      const domain = domainFromUrl(body.url);
      const [thumb, defaults] = await Promise.all([fetchThumbnail(body.url), getDomainDefaults(domain)]);
      const { error } = await supabase.from('items').insert({
        id,
        type: 'link',
        name: typeof body.name === 'string' && body.name ? body.name : domain,
        tags: defaults.tags,
        folder_ids: defaults.folderIds,
        link_url: body.url,
        link_thumbnail_url: thumb ?? null,
        sort_order: Date.now(),
      });
      if (error) throw error;
      return jsonResponse({ ok: true, id });
    }

    return jsonResponse({ error: 'invalid payload: expected { type: "link", url } or { type: "image", imageBase64 }' }, 400);
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500);
  }
});
