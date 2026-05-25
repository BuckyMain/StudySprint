function parseLegacyModules(rawModules, moduleColors) {
	if (!rawModules) return [];
	try {
		const parsed = JSON.parse(rawModules);
		if (!Array.isArray(parsed)) return [];
		if (parsed.length > 0 && typeof parsed[0] === 'string') {
			return parsed.map((name) => ({ name, color: moduleColors[0], semesterId: '' }));
		}
		return parsed;
	} catch {
		return [];
	}
}

export async function migrateLegacyLocalStorageIfNeeded({
	api,
	moduleColors,
	normalizeModules,
	asId
}) {
	let settingsDoc;
	let semestersInDb;
	let modulesInDb;
	try {
		[settingsDoc, semestersInDb, modulesInDb] = await Promise.all([
			api('/api/settings'),
			api('/api/semesters'),
			api('/api/modules')
		]);
	} catch {
		return;
	}

	if (Number(settingsDoc.migrationVersion || 0) >= 1) return;

	const legacySemesters = JSON.parse(localStorage.getItem('mySemesters') || '[]');
	const legacyModules = parseLegacyModules(localStorage.getItem('myModules'), moduleColors);
	const hasLegacyData = legacySemesters.length > 0 || legacyModules.length > 0 || localStorage.getItem('userName');
	const hasDbData = semestersInDb.length > 0 || modulesInDb.length > 0;

	if (!hasLegacyData || hasDbData) {
		await api('/api/settings', {
			method: 'PUT',
			body: JSON.stringify({
				...settingsDoc,
				migrationVersion: 1
			})
		});
		return;
	}

	const legacyActiveSemesterId = localStorage.getItem('activeSemesterId') || '';
	const semesterMap = new Map();
	for (const sem of legacySemesters) {
		if (!sem?.name) continue;
		const created = await api('/api/semesters', {
			method: 'POST',
			body: JSON.stringify({
				name: String(sem.name),
				color: String(sem.color || moduleColors[0]),
				isActive: sem.id === legacyActiveSemesterId
			})
		});
		semesterMap.set(String(sem.id || sem.name), String(created._id));
	}

	const firstSemesterId = semesterMap.values().next().value || '';
	for (const mod of legacyModules) {
		if (!mod?.name) continue;
		const mappedSemesterId = semesterMap.get(String(mod.semesterId || '')) || firstSemesterId;
		if (!mappedSemesterId) continue;
		await api('/api/modules', {
			method: 'POST',
			body: JSON.stringify({
				name: String(mod.name),
				color: String(mod.color || moduleColors[0]),
				semesterId: mappedSemesterId
			})
		});
	}

	const activeMappedId = semesterMap.get(legacyActiveSemesterId) || firstSemesterId;
	await api('/api/settings', {
		method: 'PUT',
		body: JSON.stringify({
			userName: localStorage.getItem('userName') || '',
			darkMode: localStorage.getItem('darkMode') === 'true',
			weeklyGoalHours: Number(localStorage.getItem('weeklyGoalHours') || '10'),
			activeSemesterId: activeMappedId || '',
			migrationVersion: 1
		})
	});

	const modulesAfterMigration = normalizeModules(await api('/api/modules'));
	const moduleNameToSemester = new Map(modulesAfterMigration.map((m) => [m.name, m.semesterId]));
	const allTasks = await api('/api/tasks');
	for (const task of allTasks) {
		if (task.semesterId) continue;
		const inferredSemesterId = moduleNameToSemester.get(task.module || task.moduleName || '') || activeMappedId;
		if (!inferredSemesterId) continue;
		const taskId = asId(task._id);
		if (!taskId) continue;
		await api(`/api/tasks/${taskId}`, {
			method: 'PATCH',
			body: JSON.stringify({
				semesterId: inferredSemesterId
			})
		});
	}
}
