export async function apiClient(path, options = {}) {
	const response = await fetch(path, {
		headers: { 'content-type': 'application/json', ...(options.headers || {}) },
		...options
	});
	if (!response.ok) {
		let message = 'Fehler bei der Anfrage';
		try {
			const payload = await response.json();
			message = payload.error || message;
		} catch {
			message = response.statusText || message;
		}
		throw new Error(message);
	}
	return response.json();
}

export function asId(value) {
	return value ? String(value) : '';
}

export function normalizeSemesters(items) {
	return (items || []).map((sem) => ({ ...sem, id: asId(sem._id || sem.id) }));
}

export function normalizeModules(items) {
	return (items || []).map((mod) => ({ ...mod, id: asId(mod._id || mod.id) }));
}
