export async function saveSettingsAction({
	api,
	userName,
	darkMode,
	weeklyGoalHours,
	activeSemesterId,
	overrides = {}
}) {
	await api('/api/settings', {
		method: 'PUT',
		body: JSON.stringify({
			userName,
			darkMode,
			weeklyGoalHours,
			activeSemesterId,
			migrationVersion: 1,
			...overrides
		})
	});
}

export async function setActiveSemesterAction({
	api,
	id
}) {
	if (!id) return;
	await api(`/api/semesters/${id}`, {
		method: 'PATCH',
		body: JSON.stringify({ isActive: true })
	});
}

export async function addSemesterAction({ api, name, color }) {
	return api('/api/semesters', {
		method: 'POST',
		body: JSON.stringify({ name, color })
	});
}

export async function removeSemesterAction({ api, id }) {
	await api(`/api/semesters/${id}`, { method: 'DELETE' });
}

export async function addModuleAction({ api, name, color, semesterId }) {
	await api('/api/modules', {
		method: 'POST',
		body: JSON.stringify({ name, color, semesterId })
	});
}

export async function removeModuleAction({ api, id }) {
	await api(`/api/modules/${id}`, { method: 'DELETE' });
}

export async function deleteAllDataAction({ api }) {
	await api('/api/data/reset', { method: 'DELETE' });
}
