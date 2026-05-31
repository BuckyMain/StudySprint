import assert from 'node:assert/strict';

const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';

class SessionClient {
	constructor() {
		this.cookie = '';
	}

	async request(path, options = {}) {
		const headers = new Headers(options.headers || {});
		if (!headers.has('content-type') && options.body) {
			headers.set('content-type', 'application/json');
		}
		if (this.cookie) {
			headers.set('cookie', this.cookie);
		}

		const response = await fetch(`${baseUrl}${path}`, {
			...options,
			headers
		});

		const setCookie = response.headers.get('set-cookie');
		if (setCookie) {
			this.cookie = setCookie.split(';')[0];
		}

		let data = null;
		try {
			data = await response.json();
		} catch {
			// no-op
		}

		return { response, data };
	}

	post(path, payload) {
		return this.request(path, { method: 'POST', body: JSON.stringify(payload) });
	}

	get(path) {
		return this.request(path, { method: 'GET' });
	}

	delete(path) {
		return this.request(path, { method: 'DELETE' });
	}
}

function uniqueEmail(prefix) {
	return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1_000_000)}@example.com`;
}

async function registerAndSeedTask(client, prefix) {
	const email = uniqueEmail(prefix);
	const password = 'StudySprint123!';

	const registerResult = await client.post('/api/auth/register', { email, password });
	assert.equal(registerResult.response.status, 200, `register failed for ${prefix}`);

	const taskResult = await client.post('/api/tasks', {
		title: `${prefix}-task`,
		module: 'IsolationTest',
		priority: '3',
		status: 'offen'
	});
	assert.equal(taskResult.response.status, 200, `create task failed for ${prefix}`);

	return { email };
}

async function fetchTaskCount(client) {
	const result = await client.get('/api/tasks');
	assert.equal(result.response.status, 200, 'fetch tasks failed');
	return Array.isArray(result.data) ? result.data.length : 0;
}

async function main() {
	const user1 = new SessionClient();
	const user2 = new SessionClient();

	await registerAndSeedTask(user1, 'user1');
	await registerAndSeedTask(user2, 'user2');

	const beforeUser1Count = await fetchTaskCount(user1);
	const beforeUser2Count = await fetchTaskCount(user2);
	assert.equal(beforeUser1Count, 1, 'user1 should have one task before reset');
	assert.equal(beforeUser2Count, 1, 'user2 should have one task before reset');

	const resetResult = await user1.delete('/api/data/reset');
	assert.equal(resetResult.response.status, 200, 'user1 reset failed');

	const afterUser1Count = await fetchTaskCount(user1);
	const afterUser2Count = await fetchTaskCount(user2);
	assert.equal(afterUser1Count, 0, 'user1 data should be deleted by reset');
	assert.equal(afterUser2Count, 1, 'user2 data must remain untouched');

	console.log('Auth isolation reset test passed.');
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});

