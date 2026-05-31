export async function loadCurrentUserAction({ api }) {
	try {
		const data = await api('/api/auth/me');
		return data.user || null;
	} catch (error) {
		if (String(error?.message || '').includes('Nicht angemeldet')) {
			return null;
		}
		throw error;
	}
}

export async function loginAction({ api, email, password }) {
	const data = await api('/api/auth/login', {
		method: 'POST',
		body: JSON.stringify({ email, password })
	});
	return data.user;
}

export async function registerAction({ api, email, password }) {
	const data = await api('/api/auth/register', {
		method: 'POST',
		body: JSON.stringify({ email, password })
	});
	return data.user;
}

export async function logoutAction({ api }) {
	await api('/api/auth/logout', { method: 'POST' });
}

