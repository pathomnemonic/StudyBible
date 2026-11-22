// OPTIONAL "Also remove my sign-in" for StudyBible (a separate, secondary action: "Delete my StudyBible account" is the normal deletion and does not come here).
//
// A browser cannot delete a sign-in: that needs the project's service key, which must never be in the app. This function holds it (Supabase puts it in the
// function's environment) and uses it for ONE thing, after checking who is asking: delete the caller's own sign-in. Because the sign-in is shared by every app
// on the project, this removes it for all of them, and whatever those apps keep against it (their tables reference auth.users). The app warns about this and
// asks for the password again before calling. "Delete my StudyBible account" (studybible.delete_account) is the separate, narrower action and does not come here.
//
// Deploy:  supabase functions deploy studybible-delete-account        (verify_jwt stays ON: the platform rejects calls with no valid token before this runs)
// Optional secret: STUDYBIBLE_ORIGINS = comma-separated web addresses allowed to call it (default: https://pathomnemonic.github.io)
import { createClient } from 'npm:@supabase/supabase-js@2';

const ALLOWED = (Deno.env.get('STUDYBIBLE_ORIGINS') ?? 'https://pathomnemonic.github.io').split(',').map((s) => s.trim()).filter(Boolean);

function cors(origin: string | null): Record<string, string> {
  const ok = origin && ALLOWED.includes(origin);
  return { 'Access-Control-Allow-Origin': ok ? origin! : ALLOWED[0] ?? '', 'Vary': 'Origin', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
}
const reply = (status: number, body: unknown, origin: string | null) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors(origin) } });

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== 'POST') return reply(405, { ok: false, error: 'Use POST.' }, origin);

  const url = Deno.env.get('SUPABASE_URL'), anon = Deno.env.get('SUPABASE_ANON_KEY'), service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anon || !service) return reply(500, { ok: false, error: 'The service is not set up.' }, origin);

  // who is asking: from their own token, never from anything in the request body
  const token = req.headers.get('Authorization') ?? '';
  const asCaller = createClient(url, anon, { global: { headers: { Authorization: token } }, auth: { persistSession: false } });
  const { data, error } = await asCaller.auth.getUser();
  const user = data?.user;
  if (error || !user) return reply(401, { ok: false, error: 'Not signed in.' }, origin);
  if (user.is_anonymous) return reply(403, { ok: false, error: 'Anonymous visitors have no account to delete.' }, origin);

  let body: { confirm?: string } = {};
  try { body = await req.json(); } catch { /* handled below */ }
  if (body.confirm !== 'delete-everywhere') return reply(400, { ok: false, error: 'Confirmation is missing.' }, origin);

  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  // StudyBible's own rows go with the sign-in: its tables reference auth.users with ON DELETE CASCADE (tested in tests/supabaseSchema.test.ts)
  const { error: delError } = await admin.auth.admin.deleteUser(user.id);
  if (delError) return reply(500, { ok: false, error: 'The account could not be deleted. Nothing else was changed.' }, origin);
  return reply(200, { ok: true }, origin);
});
