import { json } from '@sveltejs/kit';

export function jsonError(message, status = 400) {
	return json({ error: message }, { status });
}

export async function readJsonBody(request) {
	try {
		return { ok: true, data: await request.json() };
	} catch {
		return { ok: false, response: jsonError('Ungültiger JSON-Body', 400) };
	}
}
