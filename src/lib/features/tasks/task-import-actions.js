async function ensureActiveSemesterForTaskImportAction({ activeSemesterId, refreshData, getActiveSemesterId }) {
	if (activeSemesterId) return activeSemesterId;
	await refreshData();
	const refreshedActiveSemesterId = getActiveSemesterId();
	if (refreshedActiveSemesterId) return refreshedActiveSemesterId;
	throw new Error('Bitte zuerst im Profil ein aktives Semester auswählen oder erstellen.');
}

export async function extractDeadlinesAction({
	api,
	activeModules,
	deadlineInput,
	normalizeExtractedDeadlines
}) {
	if (activeModules.length === 0) {
		throw new Error('Bitte zuerst im Profil mindestens ein Modul im aktiven Semester erstellen.');
	}

	const payload = await api('/api/deadlines/extract', {
		method: 'POST',
		body: JSON.stringify({ text: deadlineInput })
	});
	const extractedDeadlines = normalizeExtractedDeadlines(payload.items || []);
	return {
		extractedDeadlines,
		importSelectedModule: '',
		deadlineSuccess: extractedDeadlines.length
			? `${extractedDeadlines.length} Deadline(s) erkannt.`
			: 'Keine Deadline erkannt.'
	};
}

export async function extractDeadlinesWithOcrAction({
	api,
	activeModules,
	semesterplanImageBase64,
	semesterplanMimeType,
	normalizeExtractedDeadlines
}) {
	if (activeModules.length === 0) {
		throw new Error('Bitte zuerst im Profil mindestens ein Modul im aktiven Semester erstellen.');
	}
	if (!semesterplanImageBase64) {
		throw new Error('Bitte zuerst eine Datei auswählen.');
	}

	const payload = await api('/api/deadlines/ocr', {
		method: 'POST',
		body: JSON.stringify({ imageBase64: semesterplanImageBase64, mimeType: semesterplanMimeType })
	});
	const extractedDeadlines = normalizeExtractedDeadlines(payload.items || []);
	return {
		extractedDeadlines,
		importSelectedModule: '',
		deadlineSuccess: extractedDeadlines.length
			? `${extractedDeadlines.length} Deadline(s) per OCR erkannt.`
			: 'Keine Deadline gefunden.'
	};
}

export async function addDeadlineAsTaskAction({
	api,
	item,
	idx,
	importSelectedModule,
	activeModules,
	mySemesters,
	activeSemester,
	activeSemesterId,
	refreshData,
	getActiveSemesterId,
	extractedDeadlines
}) {
	const semesterId = await ensureActiveSemesterForTaskImportAction({
		activeSemesterId,
		refreshData,
		getActiveSemesterId
	});
	const semesterName = mySemesters.find((s) => s.id === semesterId)?.name || activeSemester?.name || '';
	const selectedModule = activeModules.find((m) => m.name === importSelectedModule);
	if (!selectedModule) {
		throw new Error('Bitte oben zuerst ein Modul aus dem Profil auswählen.');
	}

	await api('/api/tasks', {
		method: 'POST',
		body: JSON.stringify({
			title: item.title,
			module: selectedModule.name,
			moduleName: selectedModule.name,
			moduleId: selectedModule?.id || '',
			dueDate: item.dueDate,
			duration: 45,
			priority: item.priority || '3',
			semesterId,
			semesterName
		})
	});

	return {
		extractedDeadlines: extractedDeadlines.filter((_, i) => i !== idx),
		deadlineSuccess: `"${item.title}" wurde zur Aufgabenliste hinzugefügt.`
	};
}

export async function addAllDeadlinesAsTasksAction({
	api,
	extractedDeadlines,
	canAdoptAllDeadlines,
	importSelectedModule,
	activeModules,
	mySemesters,
	activeSemester,
	activeSemesterId,
	refreshData,
	getActiveSemesterId
}) {
	if (extractedDeadlines.length === 0) {
		return { added: 0, lastError: '' };
	}
	if (!canAdoptAllDeadlines) {
		throw new Error('Bitte oben zuerst ein Modul aus dem Profil auswählen.');
	}

	const items = [...extractedDeadlines];
	let added = 0;
	let semesterId = '';
	let semesterName = '';
	let lastError = '';

	for (const item of items) {
		try {
			if (!semesterId) {
				semesterId = await ensureActiveSemesterForTaskImportAction({
					activeSemesterId,
					refreshData,
					getActiveSemesterId
				});
				semesterName = mySemesters.find((s) => s.id === semesterId)?.name || activeSemester?.name || '';
			}
			const selectedModule = activeModules.find((m) => m.name === importSelectedModule);
			if (!selectedModule) continue;
			await api('/api/tasks', {
				method: 'POST',
				body: JSON.stringify({
					title: item.title,
					module: selectedModule.name,
					moduleName: selectedModule.name,
					moduleId: selectedModule?.id || '',
					dueDate: item.dueDate,
					duration: 45,
					priority: item.priority || '3',
					semesterId,
					semesterName
				})
			});
			added++;
		} catch (error) {
			lastError = error.message;
		}
	}

	return { added, lastError };
}
