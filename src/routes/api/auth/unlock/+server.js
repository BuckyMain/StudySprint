import { json } from '@sveltejs/kit';
import { setAuthCookie } from '$lib/server/auth';

export async function POST({ request, cookies }) {
	const { password } = await request.json();
	const expectedPassword = process.env.APP_PASSWORD || 'studysprint';

	if (!password || password !== expectedPassword) {
		return json({ error: 'Ungueltiges Passwort' }, { status: 401 });
	}

	setAuthCookie(cookies);
	return json({ ok: true });
}
