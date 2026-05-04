import { json } from '@sveltejs/kit';
import { clearAuthCookie } from '$lib/server/auth';

export async function POST({ cookies }) {
	clearAuthCookie(cookies);
	return json({ ok: true });
}
