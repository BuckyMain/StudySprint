export async function createTaskAction({
	api,
	activeSemesterId,
	creatingTaskModule,
	taskFormNewModuleName,
	taskForm,
	activeModules,
	taskFormNewModuleColor,
	activeSemester,
	asId,
	moduleColors,
	buildNewTaskFormDefaults
}) {
	if (!activeSemesterId) {
		throw new Error('Bitte zuerst ein aktives Semester im Profil auswählen.');
	}
	const moduleName = String(
		creatingTaskModule ? taskFormNewModuleName : taskForm.module
	).trim();
	if (!moduleName) {
		throw new Error('Bitte ein Modul auswählen oder neu anlegen.');
	}

	let selectedModule = activeModules.find((m) => m.name === moduleName);
	if (!selectedModule) {
		const createdModule = await api('/api/modules', {
			method: 'POST',
			body: JSON.stringify({
				name: moduleName,
				color: taskFormNewModuleColor,
				semesterId: activeSemesterId
			})
		});
		selectedModule = { ...createdModule, id: asId(createdModule._id || createdModule.id) };
	}

	const payload = {
		...taskForm,
		module: moduleName,
		duration: Number(taskForm.duration || 25),
		moduleId: selectedModule?.id || '',
		moduleName: moduleName,
		semesterId: activeSemesterId || taskForm.semesterId || '',
		semesterName: activeSemester?.name || taskForm.semesterName || ''
	};
	await api('/api/tasks', { method: 'POST', body: JSON.stringify(payload) });

	return {
		taskForm: buildNewTaskFormDefaults(),
		creatingTaskModule: false,
		taskFormNewModuleName: '',
		taskFormNewModuleColor: moduleColors[0],
		taskSubView: 'list'
	};
}

export async function updateTaskAction({
	api,
	editingTaskId,
	editTaskForm,
	activeModules
}) {
	const selectedModule = activeModules.find((m) => m.name === editTaskForm.module);
	await api(`/api/tasks/${editingTaskId}`, {
		method: 'PATCH',
		body: JSON.stringify({
			...editTaskForm,
			moduleId: selectedModule?.id || '',
			moduleName: editTaskForm.module
		})
	});
}

export async function setTaskStatusAction({ api, taskId, status }) {
	await api(`/api/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

export async function deleteTaskAction({ api, taskId }) {
	await api(`/api/tasks/${taskId}`, { method: 'DELETE' });
}
