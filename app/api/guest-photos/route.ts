// /app/api/guest-photos/route.js
import { supabaseAdmin } from '../..//lib/supabaseAdmin';

const BUCKET = 'guest-photos';      // crea este bucket en Supabase (Privado)
const ROOT_PATH = '';               // opcional: subcarpeta, ej.: 'wedding-2026'
const SIGN_TTL_SECONDS = 60 * 10;   // 10 min

export async function GET() {
  try {
    // Listar objetos del bucket (puedes pasar 'path' si usas subcarpetas)
    const { data, error } = await supabaseAdmin
      .storage
      .from(BUCKET)
      .list(ROOT_PATH, { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });

    if (error) throw error;

    // Crear signed URLs para cada objeto
    const items = data || [];

    // Mapeamos a { id, path, signedUrl, created_at }
    // Nota: list() suele traer { name, id, updated_at, created_at, ... }
    const photos = await Promise.all(items.map(async (obj) => {
      const objPath = ROOT_PATH ? `${ROOT_PATH}/${obj.name}` : obj.name;
      const signed = await supabaseAdmin.storage
        .from(BUCKET)
        .createSignedUrl(objPath, SIGN_TTL_SECONDS);

      return {
        id: obj.id || objPath,          // fallback por si 'id' no viene
        path: objPath,
        signedUrl: signed?.data?.signedUrl || null,
        created_at: obj.created_at || null,
      };
    }));

    return Response.json({ ok: true, photos }, { status: 200 });
  } catch (err) {
    console.error('[GET /api/guest-photos]', err);
    return Response.json({ ok: false, error: 'Failed to list photos' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get('file');

    if (!file || typeof file === 'string') {
      return Response.json({ ok: false, error: 'Missing file' }, { status: 400 });
    }

    // Validaciones básicas
    const type = file.type || 'image/jpeg';
    const size = file.size || 0;
    if (!type.startsWith('image/')) {
      return Response.json({ ok: false, error: 'Invalid file type' }, { status: 400 });
    }
    if (size > 12 * 1024 * 1024) { // 12MB
      return Response.json({ ok: false, error: 'File too large' }, { status: 400 });
    }

    // Nombre único
    const ext = type.split('/')[1] || 'jpg';
    const key = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const uploadPath = ROOT_PATH ? `${ROOT_PATH}/${key}` : key;

    // Subir a bucket privado
    const arrayBuffer = await file.arrayBuffer();
    const { data: up, error: upErr } = await supabaseAdmin
      .storage
      .from(BUCKET)
      .upload(uploadPath, Buffer.from(arrayBuffer), { contentType: type, upsert: false });

    if (upErr) throw upErr;

    // Puedes devolver una signedUrl inmediata si quieres (no es obligatorio)
    const { data: sig } = await supabaseAdmin
      .storage
      .from(BUCKET)
      .createSignedUrl(uploadPath, SIGN_TTL_SECONDS);

    const saved = {
      id: up?.id || uploadPath,
      path: up?.path || uploadPath,
      created_at: new Date().toISOString(),
      signedUrl: sig?.signedUrl || null,
    };

    return Response.json({ ok: true, saved }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/guest-photos]', err);
    return Response.json({ ok: false, error: 'Upload failed' }, { status: 500 });
  }
}

export function OPTIONS() {
  // CORS simple si lo necesitas (opcional según tu setup)
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    },
  });
}
