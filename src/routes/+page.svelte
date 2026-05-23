<script>
	import { onMount, onDestroy } from 'svelte';

	const tabs = ['home', 'tasks', 'focus', 'progress', 'profile'];
	const tabLabels = { home: 'Home', tasks: 'Aufgaben', focus: 'Fokus', progress: 'Fortschritt', profile: 'Profil' };
	const tabIcons = { home: 'bi-house', tasks: 'bi-list-check', focus: 'bi-stopwatch', progress: 'bi-bar-chart', profile: 'bi-person' };
	const priorities = ['1', '2', '3', '4', '5'];
	const priorityLabels = { '1': 'Höchste', '2': 'Hoch', '3': 'Mittel', '4': 'Niedrig', '5': 'Niedrigste' };
	const focusRatings = ['Sehr fokussiert', 'Okay', 'Abgelenkt'];

	// Module color palette
	const MODULE_COLORS = [
		'#2563eb', '#7c3aed', '#db2777', '#059669',
		'#d97706', '#0891b2', '#dc2626', '#65a30d',
		'#6366f1', '#f59e0b', '#0284c7', '#9333ea'
	];

	let activeTab = $state('home');
	let loading = $state(false);
	let error = $state('');

	let tasks = $state([]);
	let reflections = $state([]);

	// User settings (loaded from backend API on mount)
	let userName = $state('');
	let darkMode = $state(false);
	let focusDuration = $state(25);
	let weeklyGoalHours = $state(10);
	let mySemesters = $state([]); // [{ id, name, color }]
	let activeSemesterId = $state('');
	let myModules = $state([]); // [{ id, name, color, semesterId }]
	let newSemesterInput = $state('');
	let newSemesterColor = $state(MODULE_COLORS[0]);
	let newModuleInput = $state('');
	let newModuleColor = $state(MODULE_COLORS[0]);
	let settingsSaved = $state(false);

	// Tasks sub-view: 'list' | 'new' | 'import' | 'edit'
	let taskSubView = $state('list');
	let taskSortBy = $state('priority');
	let taskFilterModule = $state('');
	let taskFilterStatus = $state('open');
	let deletingTaskId = $state(null);
	let deletingSemesterId = $state('');
	let deletingModuleId = $state('');
	let confirmingDeleteAllData = $state(false);

	let taskForm = $state({
		title: '',
		module: '',
		dueDate: '',
		duration: 25,
		priority: '3',
		notes: '',
		semesterId: '',
		semesterName: ''
	});

	let editingTaskId = $state('');
	let editTaskForm = $state({
		title: '',
		module: '',
		dueDate: '',
		duration: 25,
		priority: '3',
		notes: '',
		semesterId: '',
		semesterName: ''
	});

	let deadlineInput = $state('');
	let extractedDeadlines = $state([]);
	let editingDeadlineIdx = $state(-1);
	let editingDeadlineData = $state({ title: '', dueDate: '', priority: '3' });
	let importSelectedModule = $state('');
	let semesterplanFileName = $state('');
	let semesterplanImageBase64 = $state('');
	let semesterplanMimeType = $state('');
	let ocrLoading = $state(false);
	let deadlineSuccess = $state('');
	let adoptingAll = $state(false);

	let selectedTaskId = $state('');
	let focusSecondsLeft = $state(25 * 60);
	let isFocusRunning = $state(false);
	let focusTimerHandle = null;
	let focusHasStarted = $state(false);
	let reflectionRating = $state('Okay');
	let reflectionNote = $state('');

	// Progress filter
	let progressFilterSemester = $state('');
	let progressFilterModule = $state('');

	const completedTasks = $derived(tasks.filter((t) => t.status === 'erledigt'));
	const openTasks = $derived(tasks.filter((t) => t.status !== 'erledigt'));
	const totalFocusMinutes = $derived(
		reflections.reduce((sum, r) => sum + Number(r.focusMinutes || 0), 0)
	);
	const selectedTask = $derived(tasks.find((t) => t._id === selectedTaskId) ?? null);

	const nearestDeadline = $derived(
		[...openTasks]
			.filter((t) => t.dueDate)
			.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0] ?? null
	);

	const highestPriorityTask = $derived(
		[...openTasks].sort((a, b) => Number(a.priority) - Number(b.priority))[0] ?? null
	);

	const modules = $derived([...new Set(tasks.map((t) => t.module).filter(Boolean))]);
	const allModuleNames = $derived([...new Set([...myModules.map((m) => m.name), ...modules])]);
	const activeModules = $derived(
		activeSemesterId ? myModules.filter((m) => m.semesterId === activeSemesterId) : myModules
	);
	const activeSemester = $derived(mySemesters.find((s) => s.id === activeSemesterId) ?? null);
	const tasksInActiveSemester = $derived.by(() => {
		if (!activeSemesterId) return tasks;
		return tasks.filter((t) => taskBelongsToSemester(t, activeSemesterId));
	});
	const taskFilterModules = $derived([
		...new Set(tasksInActiveSemester.map((t) => t.module).filter(Boolean))
	]);
	const canAdoptAllDeadlines = $derived.by(() => {
		if (activeModules.length === 0 || extractedDeadlines.length === 0) return false;
		return Boolean(importSelectedModule && activeModules.some((m) => m.name === importSelectedModule));
	});
	const thisWeekFocusMinutes = $derived.by(() => {
		const now = new Date();
		const dow = now.getDay();
		const diffToMon = dow === 0 ? -6 : 1 - dow;
		const weekStart = new Date(now);
		weekStart.setDate(now.getDate() + diffToMon);
		weekStart.setHours(0, 0, 0, 0);
		return reflections
			.filter((r) => new Date(r.createdAt) >= weekStart)
			.reduce((sum, r) => sum + Number(r.focusMinutes || 0), 0);
	});

	const filteredSortedTasks = $derived.by(() => {
		let list = tasksInActiveSemester;
		if (taskFilterStatus === 'open') list = list.filter((t) => t.status !== 'erledigt');
		else if (taskFilterStatus) list = list.filter((t) => t.status === taskFilterStatus);
		if (taskFilterModule) list = list.filter((t) => t.module === taskFilterModule);
		return [...list].sort((a, b) => {
			if (taskSortBy === 'priority') return Number(a.priority) - Number(b.priority);
			if (taskSortBy === 'dueDate') {
				if (!a.dueDate && !b.dueDate) return 0;
				if (!a.dueDate) return 1;
				if (!b.dueDate) return -1;
				return new Date(a.dueDate) - new Date(b.dueDate);
			}
			if (taskSortBy === 'duration') return Number(a.duration) - Number(b.duration);
			return 0;
		});
	});

	const upcomingTasks = $derived.by(() => {
		const now = new Date();
		const nextWeek = new Date(now.getTime() + 7 * 86400000);
		return [...openTasks]
			.filter((t) => t.dueDate && new Date(t.dueDate) <= nextWeek)
			.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
			.slice(0, 5);
	});

	const thisWeekCompleted = $derived.by(() => {
		const now = new Date();
		const dow = now.getDay();
		const diffToMon = dow === 0 ? -6 : 1 - dow;
		const weekStart = new Date(now);
		weekStart.setDate(now.getDate() + diffToMon);
		weekStart.setHours(0, 0, 0, 0);
		return reflections.filter((r) => new Date(r.createdAt) >= weekStart).length;
	});

	const weeklyData = $derived.by(() => {
		const labels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
		const counts = Array(7).fill(0);
		const now = new Date();
		const dow = now.getDay();
		const diffToMon = dow === 0 ? -6 : 1 - dow;
		const weekStart = new Date(now);
		weekStart.setDate(now.getDate() + diffToMon);
		weekStart.setHours(0, 0, 0, 0);
		const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
		for (const r of reflections) {
			const d = new Date(r.createdAt);
			if (d >= weekStart && d < weekEnd) counts[(d.getDay() + 6) % 7]++;
		}
		const todayIdx = (now.getDay() + 6) % 7;
		return labels.map((label, i) => ({ label, count: counts[i], isToday: i === todayIdx }));
	});

	const maxWeeklyCount = $derived(Math.max(1, ...weeklyData.map((d) => d.count)));

	const progressTasks = $derived.by(() => {
		if (!progressFilterSemester) return tasks;
		return tasks.filter((t) => taskBelongsToSemester(t, progressFilterSemester));
	});
	const progressTaskIds = $derived.by(() => new Set(progressTasks.map((t) => t._id)));
	const progressReflections = $derived.by(() => {
		if (!progressFilterSemester) return reflections;
		return reflections.filter((r) => r.taskId && progressTaskIds.has(String(r.taskId)));
	});
	const progressCompletedTasks = $derived(progressTasks.filter((t) => t.status === 'erledigt'));
	const progressModules = $derived([...new Set(progressTasks.map((t) => t.module).filter(Boolean))]);
	const progressTotalFocusMinutes = $derived(
		progressReflections.reduce((sum, r) => sum + Number(r.focusMinutes || 0), 0)
	);
	const progressThisWeekFocusMinutes = $derived.by(() => {
		const now = new Date();
		const dow = now.getDay();
		const diffToMon = dow === 0 ? -6 : 1 - dow;
		const weekStart = new Date(now);
		weekStart.setDate(now.getDate() + diffToMon);
		weekStart.setHours(0, 0, 0, 0);
		return progressReflections
			.filter((r) => new Date(r.createdAt) >= weekStart)
			.reduce((sum, r) => sum + Number(r.focusMinutes || 0), 0);
	});
	const progressWeeklyData = $derived.by(() => {
		const labels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
		const counts = Array(7).fill(0);
		const now = new Date();
		const dow = now.getDay();
		const diffToMon = dow === 0 ? -6 : 1 - dow;
		const weekStart = new Date(now);
		weekStart.setDate(now.getDate() + diffToMon);
		weekStart.setHours(0, 0, 0, 0);
		const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
		for (const r of progressReflections) {
			const d = new Date(r.createdAt);
			if (d >= weekStart && d < weekEnd) counts[(d.getDay() + 6) % 7]++;
		}
		const todayIdx = (now.getDay() + 6) % 7;
		return labels.map((label, i) => ({ label, count: counts[i], isToday: i === todayIdx }));
	});
	const progressMaxWeeklyCount = $derived(Math.max(1, ...progressWeeklyData.map((d) => d.count)));
	const progressModuleStats = $derived.by(() => {
		return progressModules.map((mod) => {
			const modTasks = progressTasks.filter((t) => t.module === mod);
			const modDone = modTasks.filter((t) => t.status === 'erledigt').length;
			const pct = modTasks.length ? Math.round((modDone / modTasks.length) * 100) : 0;
			return { mod, total: modTasks.length, done: modDone, pct, color: getModuleColor(mod) };
		});
	});
	const filteredProgressCompletedTasks = $derived.by(() => {
		if (!progressFilterModule) return progressCompletedTasks;
		return progressCompletedTasks.filter((t) => t.module === progressFilterModule);
	});

	$effect(() => {
		if (taskFilterModule && !taskFilterModules.includes(taskFilterModule)) {
			taskFilterModule = '';
		}
	});
	$effect(() => {
		if (progressFilterModule && !progressModules.includes(progressFilterModule)) {
			progressFilterModule = '';
		}
	});

	function getModuleColor(mod) {
		if (!mod) return '#6b7280';
		const found = myModules.find((m) => m.name === mod);
		if (found) return found.color;
		const idx = modules.indexOf(mod);
		if (idx === -1) return '#6b7280';
		return MODULE_COLORS[idx % MODULE_COLORS.length];
	}

	function getSemesterNameById(id) {
		if (!id) return '';
		const sem = mySemesters.find((s) => s.id === id);
		return sem?.name || '';
	}

	function taskBelongsToSemester(task, semesterId) {
		if (!semesterId) return true;
		if (task.semesterId) return task.semesterId === semesterId;
		if (!task.module) return false;
		const moduleEntry = myModules.find((m) => m.name === task.module);
		return moduleEntry?.semesterId === semesterId;
	}

	function buildNewTaskFormDefaults() {
		return {
			title: '',
			module: '',
			dueDate: '',
			duration: Number(focusDuration) || 25,
			priority: '3',
			notes: '',
			semesterId: activeSemesterId || '',
			semesterName: activeSemester?.name || ''
		};
	}

	function openNewTaskForm() {
		taskForm = buildNewTaskFormDefaults();
		taskSubView = 'new';
	}

	function priorityBadgeClass(p) {
		const n = Number(p);
		if (n === 1) return 'text-bg-danger';
		if (n === 2) return 'text-bg-warning text-dark';
		if (n === 3) return 'text-bg-primary';
		if (n === 4) return 'text-bg-info text-dark';
		return 'text-bg-secondary';
	}

	function statusBadgeClass(status) {
		if (status === 'erledigt') return 'text-bg-success';
		if (status === 'in Bearbeitung') return 'text-bg-warning text-dark';
		return 'text-bg-light text-dark border';
	}

	function statusLabel(status) {
		if (status === 'erledigt') return 'Erledigt';
		if (status === 'in Bearbeitung') return 'In Bearbeitung';
		return 'Offen';
	}

	async function api(path, options = {}) {
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

	function asId(value) {
		return value ? String(value) : '';
	}

	function normalizeSemesters(items) {
		return (items || []).map((sem) => ({ ...sem, id: asId(sem._id || sem.id) }));
	}

	function normalizeModules(items) {
		return (items || []).map((mod) => ({ ...mod, id: asId(mod._id || mod.id) }));
	}

	function normalizeExtractedDeadlines(items = []) {
		const normalizePriority = (value) => {
			const raw = String(value || '').trim().toLowerCase();
			if (['1', '2', '3', '4', '5'].includes(raw)) return raw;
			if (raw.includes('höch') || raw.includes('hoch')) return '1';
			if (raw.includes('niedrig')) return '5';
			if (raw.includes('mittel') || raw.includes('normal')) return '3';
			return '3';
		};

		return items.map((item) => ({
			...item,
			detectedModule: String(item.module || '').trim(),
			priority: normalizePriority(item.priority)
		}));
	}

	async function refreshData(showLoading = true) {
		if (showLoading) loading = true;
		error = '';
		try {
			const [tasksData, reflectionsData, settingsData, semestersData, modulesData] = await Promise.all([
				api('/api/tasks'),
				api('/api/reflections'),
				api('/api/settings'),
				api('/api/semesters'),
				api('/api/modules')
			]);
			tasks = tasksData.map((t) => ({ ...t, _id: String(t._id) }));
			reflections = reflectionsData.map((r) => ({ ...r, _id: String(r._id) }));
			mySemesters = normalizeSemesters(semestersData);
			myModules = normalizeModules(modulesData);

			userName = String(settingsData.userName || '');
			darkMode = Boolean(settingsData.darkMode);
			focusDuration = Number(settingsData.focusDuration || 25);
			weeklyGoalHours = Number(settingsData.weeklyGoalHours || 10);

			const preferredActiveSemesterId = String(settingsData.activeSemesterId || '');
			const activeFromSemesters = mySemesters.find((s) => s.isActive)?.id || '';
			const nextActiveSemesterId =
				preferredActiveSemesterId && mySemesters.some((s) => s.id === preferredActiveSemesterId)
					? preferredActiveSemesterId
					: activeFromSemesters;
			activeSemesterId = nextActiveSemesterId;

			if (!selectedTaskId && tasks.length > 0) selectedTaskId = tasks[0]._id;
			if (selectedTaskId && !tasks.some((t) => t._id === selectedTaskId)) {
				selectedTaskId = tasks[0]?._id || '';
			}
		} catch (e) {
			error = e.message;
		} finally {
			if (showLoading) loading = false;
		}
	}

	async function createTask() {
		error = '';
		try {
			if (!activeSemesterId) {
				error = 'Bitte zuerst ein aktives Semester im Profil auswählen.';
				return;
			}
			const selectedModule = activeModules.find((m) => m.name === taskForm.module);
			const payload = {
				...taskForm,
				duration: Number(taskForm.duration || focusDuration || 25),
				moduleId: selectedModule?.id || '',
				moduleName: taskForm.module,
				semesterId: activeSemesterId || taskForm.semesterId || '',
				semesterName: activeSemester?.name || taskForm.semesterName || ''
			};
			await api('/api/tasks', { method: 'POST', body: JSON.stringify(payload) });
			taskForm = buildNewTaskFormDefaults();
			taskSubView = 'list';
			await refreshData();
		} catch (e) {
			error = e.message;
		}
	}

	function startEditTask(task) {
		editingTaskId = task._id;
		const fallbackSemesterName = activeSemester?.name || '';
		editTaskForm = {
			title: task.title,
			module: task.moduleName || task.module || '',
			dueDate: task.dueDate || '',
			duration: task.duration || 25,
			priority: task.priority || '3',
			notes: task.notes || '',
			semesterId: task.semesterId || activeSemesterId || '',
			semesterName: task.semesterName || getSemesterNameById(task.semesterId) || fallbackSemesterName
		};
		taskSubView = 'edit';
	}

	async function updateTask() {
		error = '';
		try {
			const selectedModule = activeModules.find((m) => m.name === editTaskForm.module);
			await api(`/api/tasks/${editingTaskId}`, {
				method: 'PATCH',
				body: JSON.stringify({
					...editTaskForm,
					moduleId: selectedModule?.id || '',
					moduleName: editTaskForm.module
				})
			});
			taskSubView = 'list';
			await refreshData();
		} catch (e) {
			error = e.message;
		}
	}

	async function setTaskStatus(task, status) {
		try {
			await api(`/api/tasks/${task._id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
			await refreshData(false);
		} catch (e) {
			error = e.message;
		}
	}

	async function deleteTask(taskId) {
		error = '';
		try {
			await api(`/api/tasks/${taskId}`, { method: 'DELETE' });
			deletingTaskId = null;
			await refreshData();
		} catch (e) {
			error = e.message;
		}
	}

	async function extractDeadlines() {
		error = '';
		deadlineSuccess = '';
		if (activeModules.length === 0) {
			error = 'Bitte zuerst im Profil mindestens ein Modul im aktiven Semester erstellen.';
			return;
		}
		try {
			const payload = await api('/api/deadlines/extract', {
				method: 'POST',
				body: JSON.stringify({ text: deadlineInput })
			});
			extractedDeadlines = normalizeExtractedDeadlines(payload.items || []);
			importSelectedModule = '';
			deadlineSuccess = extractedDeadlines.length
				? `${extractedDeadlines.length} Deadline(s) erkannt.`
				: 'Keine Deadline erkannt.';
		} catch (e) {
			error = e.message;
		}
	}

	function handleSemesterplanFile(event) {
		error = '';
		deadlineSuccess = '';
		const file = event.target.files?.[0];
		if (!file) {
			semesterplanFileName = '';
			semesterplanImageBase64 = '';
			semesterplanMimeType = '';
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			const result = String(reader.result || '');
			const match = result.match(/^data:(.*?);base64,(.*)$/);
			if (!match) { error = 'Datei konnte nicht gelesen werden.'; return; }
			semesterplanMimeType = match[1];
			semesterplanImageBase64 = match[2];
			semesterplanFileName = file.name;
		};
		reader.onerror = () => { error = 'Datei konnte nicht gelesen werden.'; };
		reader.readAsDataURL(file);
	}

	async function extractDeadlinesWithOcr() {
		error = '';
		deadlineSuccess = '';
		if (activeModules.length === 0) {
			error = 'Bitte zuerst im Profil mindestens ein Modul im aktiven Semester erstellen.';
			return;
		}
		if (!semesterplanImageBase64) { error = 'Bitte zuerst eine Datei auswählen.'; return; }
		ocrLoading = true;
		try {
			const payload = await api('/api/deadlines/ocr', {
				method: 'POST',
				body: JSON.stringify({ imageBase64: semesterplanImageBase64, mimeType: semesterplanMimeType })
			});
			extractedDeadlines = normalizeExtractedDeadlines(payload.items || []);
			importSelectedModule = '';
			deadlineSuccess = extractedDeadlines.length
				? `${extractedDeadlines.length} Deadline(s) per OCR erkannt.`
				: 'Keine Deadline gefunden.';
		} catch (e) {
			error = e.message;
		} finally {
			ocrLoading = false;
		}
	}

	async function ensureActiveSemesterForTaskImport() {
		if (activeSemesterId) return activeSemesterId;
		await refreshData();
		if (activeSemesterId) return activeSemesterId;
		throw new Error('Bitte zuerst im Profil ein aktives Semester auswählen oder erstellen.');
	}

	function startEditDeadline(idx) {
		editingDeadlineIdx = idx;
		editingDeadlineData = { ...extractedDeadlines[idx] };
	}

	function saveEditDeadline() {
		extractedDeadlines = extractedDeadlines.map((item, i) =>
			i === editingDeadlineIdx ? { ...editingDeadlineData } : item
		);
		editingDeadlineIdx = -1;
	}

	function cancelEditDeadline() {
		editingDeadlineIdx = -1;
	}

	async function addDeadlineAsTask(item, idx) {
		try {
			const semesterId = await ensureActiveSemesterForTaskImport();
			const semesterName = mySemesters.find((s) => s.id === semesterId)?.name || activeSemester?.name || '';
			const selectedModule = activeModules.find((m) => m.name === importSelectedModule);
			if (!selectedModule) {
				error = 'Bitte oben zuerst ein Modul aus dem Profil auswählen.';
				return;
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
			// Remove adopted item from the list
			extractedDeadlines = extractedDeadlines.filter((_, i) => i !== idx);
			await refreshData();
			deadlineSuccess = `"${item.title}" wurde zur Aufgabenliste hinzugefügt.`;
		} catch (e) {
			error = e.message;
		}
	}

	async function addAllDeadlinesAsTasks() {
		if (extractedDeadlines.length === 0) return;
		adoptingAll = true;
		error = '';
		deadlineSuccess = '';
		if (!canAdoptAllDeadlines) {
			error = 'Bitte oben zuerst ein Modul aus dem Profil auswählen.';
			adoptingAll = false;
			return;
		}
		const items = [...extractedDeadlines];
		let added = 0;
		let semesterId = '';
		let semesterName = '';
		for (const item of items) {
			try {
				if (!semesterId) {
					semesterId = await ensureActiveSemesterForTaskImport();
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
			} catch (e) {
				error = e.message;
			}
		}
		if (added > 0) {
			extractedDeadlines = [];
			importSelectedModule = '';
			await refreshData();
			deadlineSuccess = `${added} Aufgabe(n) übernommen.`;
		} else {
			error = error || 'Es konnte keine Aufgabe übernommen werden.';
		}
		adoptingAll = false;
	}

	function removeDeadline(idx) {
		extractedDeadlines = extractedDeadlines.filter((_, i) => i !== idx);
	}

	function removeAllDeadlines() {
		extractedDeadlines = [];
		importSelectedModule = '';
		deadlineSuccess = '';
	}

	function startFocus() {
		if (!selectedTask) { error = 'Bitte zuerst eine Aufgabe auswählen.'; return; }
		if (isFocusRunning) return;
		isFocusRunning = true;
		focusHasStarted = true;
		focusTimerHandle = setInterval(() => {
			if (focusSecondsLeft <= 1) { stopFocus(); focusSecondsLeft = 0; return; }
			focusSecondsLeft -= 1;
		}, 1000);
	}

	async function pauseFocus() {
		if (isFocusRunning) {
			stopFocus();
			// Set to "in Bearbeitung" when paused mid-session
			if (selectedTask && focusHasStarted && focusSecondsLeft < focusDuration * 60) {
				await setTaskStatus(selectedTask, 'in Bearbeitung');
			}
		}
	}

	function resetFocus() {
		stopFocus();
		focusSecondsLeft = focusDuration * 60;
		focusHasStarted = false;
	}

	function stopFocus() {
		isFocusRunning = false;
		if (focusTimerHandle) { clearInterval(focusTimerHandle); focusTimerHandle = null; }
	}

	function formatSeconds(s) {
		return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
	}

	function formatDate(value) {
		if (!value) return '—';
		const d = new Date(value);
		return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('de-CH');
	}

	async function completeFocusSession() {
		if (!selectedTask) { error = 'Keine aktive Aufgabe vorhanden.'; return; }
		const elapsedMinutes = Math.max(1, Math.round((focusDuration * 60 - focusSecondsLeft) / 60));
		try {
			await api('/api/reflections', {
				method: 'POST',
				body: JSON.stringify({
					taskId: selectedTask._id,
					rating: reflectionRating,
					note: reflectionNote,
					focusMinutes: elapsedMinutes
				})
			});
			await setTaskStatus(selectedTask, 'erledigt');
			reflectionNote = '';
			reflectionRating = 'Okay';
			resetFocus();
			activeTab = 'progress';
		} catch (e) {
			error = e.message;
		}
	}

	async function saveSettings(showFeedback = true, overrides = {}) {
		error = '';
		try {
			await api('/api/settings', {
				method: 'PUT',
				body: JSON.stringify({
					userName,
					darkMode,
					focusDuration,
					weeklyGoalHours,
					activeSemesterId,
					migrationVersion: 1,
					...overrides
				})
			});
			if (showFeedback) {
				settingsSaved = true;
				setTimeout(() => { settingsSaved = false; }, 2500);
			}
		} catch (e) {
			error = e.message;
		}
	}

	async function setActiveSemester(id, { refresh = true } = {}) {
		activeSemesterId = id;
		if (id) {
			await api(`/api/semesters/${id}`, {
				method: 'PATCH',
				body: JSON.stringify({ isActive: true })
			});
		}
		await saveSettings(false, { activeSemesterId: id });
		if (refresh) await refreshData();
	}

	async function addSemester() {
		const name = newSemesterInput.trim();
		if (!name) return;
		error = '';
		try {
			const created = await api('/api/semesters', {
				method: 'POST',
				body: JSON.stringify({ name, color: newSemesterColor })
			});
			newSemesterInput = '';
			await refreshData();
			if (!activeSemesterId && created?._id) {
				await setActiveSemester(String(created._id));
			}
		} catch (e) {
			error = e.message;
		}
	}

	async function removeSemester(id) {
		error = '';
		try {
			await api(`/api/semesters/${id}`, { method: 'DELETE' });
			await refreshData();
			if (activeSemesterId === id) {
				const fallbackId = mySemesters.find((s) => s.isActive)?.id || '';
				activeSemesterId = fallbackId;
				await saveSettings(false, { activeSemesterId: fallbackId });
			}
		} catch (e) {
			error = e.message;
		}
		deletingSemesterId = '';
	}

	async function addModule() {
		const name = newModuleInput.trim();
		if (!name || !activeSemesterId) {
			newModuleInput = '';
			return;
		}
		if (myModules.find((m) => m.name === name && m.semesterId === activeSemesterId)) {
			newModuleInput = '';
			return;
		}
		error = '';
		try {
			await api('/api/modules', {
				method: 'POST',
				body: JSON.stringify({ name, color: newModuleColor, semesterId: activeSemesterId })
			});
			newModuleInput = '';
			await refreshData();
		} catch (e) {
			error = e.message;
		}
	}

	async function removeModule(id) {
		error = '';
		try {
			await api(`/api/modules/${id}`, { method: 'DELETE' });
			await refreshData();
		} catch (e) {
			error = e.message;
		}
		deletingModuleId = '';
	}

	function confirmRemoveSemester(id) {
		removeSemester(id);
	}

	function cancelRemoveSemester() {
		deletingSemesterId = '';
	}

	function confirmRemoveModule(id) {
		removeModule(id);
	}

	function cancelRemoveModule() {
		deletingModuleId = '';
	}

	function confirmDeleteTask(taskId) {
		deletingTaskId = taskId;
	}

	function cancelDeleteTask() {
		deletingTaskId = null;
	}

	function requestDeleteAllData() {
		confirmingDeleteAllData = true;
		deletingSemesterId = '';
		deletingModuleId = '';
	}

	function cancelDeleteAllData() {
		confirmingDeleteAllData = false;
	}

	function openProfileQuicklink(sectionId, focusInputId) {
		activeTab = 'profile';
		setTimeout(() => {
			const section = document.getElementById(sectionId);
			section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
			const input = document.getElementById(focusInputId);
			input?.focus();
		}, 0);
	}

	async function deleteAllData() {
		error = '';
		try {
			await api('/api/data/reset', { method: 'DELETE' });
			await refreshData();
			confirmingDeleteAllData = false;
		} catch (e) {
			error = e.message;
		}
	}

	function parseLegacyModules(rawModules) {
		if (!rawModules) return [];
		try {
			const parsed = JSON.parse(rawModules);
			if (!Array.isArray(parsed)) return [];
			if (parsed.length > 0 && typeof parsed[0] === 'string') {
				return parsed.map((name) => ({ name, color: MODULE_COLORS[0], semesterId: '' }));
			}
			return parsed;
		} catch {
			return [];
		}
	}

	async function migrateLegacyLocalStorageIfNeeded() {
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
		const legacyModules = parseLegacyModules(localStorage.getItem('myModules'));
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
					color: String(sem.color || MODULE_COLORS[0]),
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
					color: String(mod.color || MODULE_COLORS[0]),
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
				focusDuration: Number(localStorage.getItem('focusDuration') || '25'),
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

	$effect(() => {
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute('data-bs-theme', darkMode ? 'dark' : 'light');
		}
	});

	onMount(() => {
		(async () => {
			await migrateLegacyLocalStorageIfNeeded();
			await refreshData();
			focusSecondsLeft = focusDuration * 60;
			taskForm = buildNewTaskFormDefaults();
		})();
	});
	onDestroy(() => stopFocus());
</script>

<svelte:head>
	<title>StudySprint</title>
	<meta name="description" content="StudySprint – Dein persönlicher Lernassistent." />
</svelte:head>

<main class="app-shell">
	<header class="p-3 pb-2">
		<div class="hero-gradient rounded-4 p-3 shadow-sm">
			<h1 class="h4 mb-0">StudySprint{userName ? ` · Hallo ${userName}` : ''}</h1>
		</div>
	</header>

	<section class="px-3 pb-4">
			{#if loading}
				<div class="alert alert-info py-2 small">Daten werden geladen...</div>
			{/if}
			{#if error}
				<div class="alert alert-danger py-2 small">{error}</div>
			{/if}

			<!-- ==================== HOME ==================== -->
			{#if activeTab === 'home'}
				<div class="row g-2 mb-3">
					<div class="col-6">
						<div class="card metric-card rounded-4">
							<div class="card-body">
								<p class="text-secondary small mb-1">Offene Aufgaben</p>
								<p class="fw-semibold mb-0 h5">{openTasks.length}</p>
							</div>
						</div>
					</div>
					<div class="col-6">
						<div class="card metric-card rounded-4">
							<div class="card-body">
								<p class="text-secondary small mb-1">Diese Woche erledigt</p>
								<p class="fw-semibold mb-0 h5">{thisWeekCompleted}</p>
							</div>
						</div>
					</div>
				</div>

				<div class="card rounded-4 border-0 shadow-sm mb-3">
					<div class="card-body">
						<p class="text-secondary small mb-2">Quick Actions</p>
						<div class="d-flex gap-2">
							<button
								class="btn btn-outline-primary rounded-pill flex-grow-1"
								type="button"
								onclick={() => openProfileQuicklink('profile-semester-section', 'add-semester-input')}
							>
								<i class="bi bi-mortarboard me-1"></i>Semester hinzufügen
							</button>
							<button
								class="btn btn-outline-primary rounded-pill flex-grow-1"
								type="button"
								onclick={() => openProfileQuicklink('profile-module-section', 'add-module-input')}
							>
								<i class="bi bi-journal-bookmark me-1"></i>Modul hinzufügen
							</button>
						</div>
					</div>
				</div>

				{#if nearestDeadline}
					<div class="card rounded-4 border-0 shadow-sm mb-3">
						<div class="card-body">
							<p class="text-secondary small mb-1">Nächste Deadline</p>
							<p class="fw-semibold mb-0">{nearestDeadline.title}</p>
							<p class="small text-secondary mb-0">
								<span class="module-dot me-1" style="background-color: {getModuleColor(nearestDeadline.module)};"></span>
								{nearestDeadline.module} · fällig {formatDate(nearestDeadline.dueDate)}
							</p>
						</div>
					</div>
				{/if}

				{#if highestPriorityTask}
					<div class="card rounded-4 border-0 shadow-sm mb-3">
						<div class="card-body">
							<p class="text-secondary small mb-1">Priorität heute</p>
							<div class="d-flex align-items-center gap-2 mb-1">
								<span class={`badge ${priorityBadgeClass(highestPriorityTask.priority)}`}>
									Prio {highestPriorityTask.priority}
								</span>
								<p class="fw-semibold mb-0">{highestPriorityTask.title}</p>
							</div>
							<p class="small text-secondary mb-0">
								<span class="module-dot me-1" style="background-color: {getModuleColor(highestPriorityTask.module)};"></span>
								{highestPriorityTask.module}
								{highestPriorityTask.dueDate ? ` · Deadline ${formatDate(highestPriorityTask.dueDate)}` : ''}
							</p>
						</div>
					</div>
				{/if}

				<div class="card rounded-4 border-0 shadow-sm">
					<div class="card-body">
						<h3 class="h6 mb-3">Aufgaben diese Woche</h3>
						{#if upcomingTasks.length === 0}
							<p class="small text-secondary mb-0">Keine Aufgaben mit Deadline in den nächsten 7 Tagen.</p>
						{:else}
							{#each upcomingTasks as task}
								<div class="d-flex align-items-center gap-2 mb-2">
									<span class={`badge flex-shrink-0 ${priorityBadgeClass(task.priority)}`}>
										{task.priority}
									</span>
									<div class="flex-grow-1 overflow-hidden">
										<p class="mb-0 fw-semibold text-truncate small">{task.title}</p>
										<p class="mb-0 text-secondary" style="font-size: 11px;">
											<span class="module-dot me-1" style="background-color: {getModuleColor(task.module)};"></span>
											{task.module} · {formatDate(task.dueDate)}
										</p>
									</div>
								</div>
							{/each}
						{/if}
					</div>
				</div>
			{/if}

			<!-- ==================== TASKS ==================== -->
			{#if activeTab === 'tasks'}

				<!-- Sub-view: LIST -->
				{#if taskSubView === 'list'}
					<p class="small text-secondary mb-2">
						<i class="bi bi-mortarboard me-1"></i>Aktives Semester: <strong>{activeSemester?.name || 'Kein Semester gewählt'}</strong>
					</p>
					<div class="d-flex gap-2 mb-3">
						<button class="btn btn-primary rounded-pill flex-grow-1" onclick={openNewTaskForm}>
							<i class="bi bi-plus-lg me-1"></i>Neue Aufgabe
						</button>
						<button class="btn btn-outline-primary rounded-pill flex-grow-1" onclick={() => (taskSubView = 'import')}>
							<i class="bi bi-upload me-1"></i>Semesterplan
						</button>
					</div>

				<!-- Sort & Filter -->
				<div class="d-flex gap-2 mb-2 align-items-center flex-wrap">
					<select class="form-select form-select-sm rounded-pill" style="width: auto;" bind:value={taskSortBy}>
						<option value="priority">Sortierung: Priorität</option>
						<option value="dueDate">Sortierung: Deadline</option>
						<option value="duration">Sortierung: Dauer</option>
					</select>
					<select class="form-select form-select-sm rounded-pill" style="width: auto;" bind:value={taskFilterModule}>
						<option value="">Alle Module</option>
						{#each taskFilterModules as mod}
							<option value={mod}>{mod}</option>
						{/each}
					</select>
					<select class="form-select form-select-sm rounded-pill" style="width: auto;" bind:value={taskFilterStatus}>
						<option value="">Alle Status</option>
						<option value="open">Offen & In Bearbeitung</option>
						<option value="offen">Offen</option>
						<option value="in Bearbeitung">In Bearbeitung</option>
						<option value="erledigt">Erledigt</option>
					</select>
				</div>

					{#if filteredSortedTasks.length === 0}
						<p class="small text-secondary">Keine Aufgaben gefunden.</p>
					{:else}
						{#each filteredSortedTasks as task}
							<div
								class="card rounded-4 border-0 shadow-sm mb-2 module-border"
								style="--module-color: {getModuleColor(task.module)};"
							>
								<div class="card-body">
									<div class="d-flex justify-content-between align-items-start">
										<div class="flex-grow-1 me-2">
											<div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
												<span class={`badge ${priorityBadgeClass(task.priority)}`}>Prio {task.priority}</span>
												<span class={`badge ${statusBadgeClass(task.status)}`}>
													{statusLabel(task.status)}
												</span>
												<span
													class="badge"
													style="background-color: {getModuleColor(task.module)}; color: white;"
												>{task.module}</span>
											</div>
											<p class="fw-semibold mb-1">{task.title}</p>
											<p class="small text-secondary mb-0">
												{task.dueDate ? `Deadline ${formatDate(task.dueDate)} · ` : ''}{task.duration} min
											</p>
											{#if task.notes}
												<p class="small text-secondary mb-0 mt-1 fst-italic">
													<i class="bi bi-sticky me-1"></i>{task.notes}
												</p>
											{/if}
										</div>
									</div>
								<div class="d-flex gap-2 mt-2 flex-wrap align-items-center">
									<button
										class="btn btn-sm btn-outline-primary rounded-pill"
										onclick={() => startEditTask(task)}
										aria-label="Aufgabe bearbeiten"
										title="Bearbeiten"
										type="button"
									>
										<i class="bi bi-pencil" aria-hidden="true"></i>
									</button>
									<button
										class="btn btn-sm btn-outline-success rounded-pill"
										onclick={() => setTaskStatus(task, task.status === 'erledigt' ? 'offen' : 'erledigt')}
										aria-label={task.status === 'erledigt' ? 'Aufgabe wieder öffnen' : 'Als erledigt markieren'}
										title={task.status === 'erledigt' ? 'Wieder öffnen' : 'Als erledigt markieren'}
										type="button"
									>
										<i class={`bi ${task.status === 'erledigt' ? 'bi-arrow-counterclockwise' : 'bi-check2-circle'}`} aria-hidden="true"></i>
									</button>
									{#if deletingTaskId === task._id}
										<div class="d-flex align-items-center gap-2 ms-1">
											<span class="small text-danger fw-semibold">Wirklich löschen?</span>
											<button class="btn btn-sm btn-danger rounded-pill" onclick={() => deleteTask(task._id)}>Ja</button>
											<button class="btn btn-sm btn-outline-secondary rounded-pill" onclick={cancelDeleteTask}>Nein</button>
										</div>
									{:else}
										<button
											class="btn btn-sm btn-outline-danger rounded-pill"
											onclick={() => confirmDeleteTask(task._id)}
											aria-label="Aufgabe löschen"
											title="Löschen"
											type="button"
										>
											<i class="bi bi-trash" aria-hidden="true"></i>
										</button>
									{/if}
								</div>
								</div>
							</div>
						{/each}
					{/if}
				{/if}

				<!-- Sub-view: NEW TASK -->
				{#if taskSubView === 'new'}
					<div class="d-flex align-items-center mb-3">
						<button class="btn btn-outline-secondary rounded-pill me-3" onclick={() => (taskSubView = 'list')}>
							<i class="bi bi-arrow-left me-1"></i>Zurück
						</button>
						<h2 class="h5 mb-0">Neue Aufgabe</h2>
					</div>
					<form onsubmit={(e) => { e.preventDefault(); createTask(); }} class="card rounded-4 border-0 shadow-sm">
						<div class="card-body">
							<div class="row g-2">
								<div class="col-12">
									<label class="form-label small" for="new-title">Titel</label>
									<input id="new-title" class="form-control rounded-3" bind:value={taskForm.title} required placeholder="z.B. API-Doku fertigstellen" />
								</div>
							<div class="col-6">
								<label class="form-label small" for="new-module">Modul</label>
								{#if activeModules.length > 0}
									<select id="new-module" class="form-select rounded-3" bind:value={taskForm.module}>
										<option value="">Bitte wählen</option>
										{#each activeModules as mod}
											<option value={mod.name}>{mod.name}</option>
										{/each}
									</select>
								{:else}
									<input
										id="new-module"
										class="form-control rounded-3"
										list="modules-datalist"
										bind:value={taskForm.module}
										placeholder="Prototyping"
										autocomplete="off"
									/>
									<datalist id="modules-datalist">
										{#each allModuleNames as mod}
											<option value={mod}></option>
										{/each}
									</datalist>
								{/if}
							</div>
								<div class="col-6">
									<label class="form-label small" for="new-due">Deadline / Abgabefrist</label>
									<input id="new-due" class="form-control rounded-3" type="date" bind:value={taskForm.dueDate} />
								</div>
								<div class="col-6">
									<label class="form-label small" for="new-duration">Geschätzte Dauer (Min.)</label>
									<input id="new-duration" class="form-control rounded-3" type="number" min="5" step="5" bind:value={taskForm.duration} />
								</div>
								<div class="col-6">
									<label class="form-label small" for="new-priority">Priorität (1 = höchste)</label>
									<select id="new-priority" class="form-select rounded-3" bind:value={taskForm.priority}>
										{#each priorities as p}
											<option value={p}>{p} – {priorityLabels[p]}</option>
										{/each}
									</select>
								</div>
								<div class="col-12">
									<label class="form-label small" for="new-notes">Notiz (optional)</label>
									<textarea
										id="new-notes"
										class="form-control rounded-3"
										rows="2"
										placeholder="Hinweise, Links, Kontext..."
										bind:value={taskForm.notes}
									></textarea>
								</div>
								<div class="col-12 mt-2">
									<button class="btn btn-primary rounded-pill w-100" type="submit">Aufgabe speichern</button>
								</div>
							</div>
						</div>
					</form>
				{/if}

				<!-- Sub-view: EDIT TASK -->
				{#if taskSubView === 'edit'}
					<div class="d-flex align-items-center mb-3">
						<button class="btn btn-outline-secondary rounded-pill me-3" onclick={() => (taskSubView = 'list')}>
							<i class="bi bi-arrow-left me-1"></i>Zurück
						</button>
						<h2 class="h5 mb-0">Aufgabe bearbeiten</h2>
					</div>
					<form onsubmit={(e) => { e.preventDefault(); updateTask(); }} class="card rounded-4 border-0 shadow-sm">
						<div class="card-body">
							<div class="row g-2">
								<div class="col-12">
									<label class="form-label small" for="edit-title">Titel</label>
									<input id="edit-title" class="form-control rounded-3" bind:value={editTaskForm.title} required />
								</div>
							<div class="col-6">
								<label class="form-label small" for="edit-module">Modul</label>
								{#if activeModules.length > 0}
									<select id="edit-module" class="form-select rounded-3" bind:value={editTaskForm.module}>
										<option value="">Bitte wählen</option>
										{#each activeModules as mod}
											<option value={mod.name}>{mod.name}</option>
										{/each}
									</select>
								{:else}
									<input
										id="edit-module"
										class="form-control rounded-3"
										list="modules-datalist-edit"
										bind:value={editTaskForm.module}
										autocomplete="off"
									/>
									<datalist id="modules-datalist-edit">
										{#each allModuleNames as mod}
											<option value={mod}></option>
										{/each}
									</datalist>
								{/if}
							</div>
								<div class="col-6">
									<label class="form-label small" for="edit-due">Deadline / Abgabefrist</label>
									<input id="edit-due" class="form-control rounded-3" type="date" bind:value={editTaskForm.dueDate} />
								</div>
								<div class="col-6">
									<label class="form-label small" for="edit-duration">Geschätzte Dauer (Min.)</label>
									<input id="edit-duration" class="form-control rounded-3" type="number" min="5" step="5" bind:value={editTaskForm.duration} />
								</div>
								<div class="col-6">
									<label class="form-label small" for="edit-priority">Priorität (1 = höchste)</label>
									<select id="edit-priority" class="form-select rounded-3" bind:value={editTaskForm.priority}>
										{#each priorities as p}
											<option value={p}>{p} – {priorityLabels[p]}</option>
										{/each}
									</select>
								</div>
								<div class="col-12">
									<label class="form-label small" for="edit-notes">Notiz (optional)</label>
									<textarea
										id="edit-notes"
										class="form-control rounded-3"
										rows="2"
										placeholder="Hinweise, Links, Kontext..."
										bind:value={editTaskForm.notes}
									></textarea>
								</div>
								<div class="col-12 mt-2">
									<button class="btn btn-primary rounded-pill w-100" type="submit">Änderungen speichern</button>
								</div>
							</div>
						</div>
					</form>
				{/if}

				<!-- Sub-view: IMPORT -->
				{#if taskSubView === 'import'}
					<div class="d-flex align-items-center mb-3">
						<button class="btn btn-outline-secondary rounded-pill me-3" onclick={() => (taskSubView = 'list')}>
							<i class="bi bi-arrow-left me-1"></i>Zurück
						</button>
						<h2 class="h5 mb-0">Semesterplan importieren</h2>
					</div>

					<div class="card rounded-4 border-0 shadow-sm mb-3">
						<div class="card-body">
							<p class="small text-secondary mb-3">
								Kopiere den Text deines Semesterplans in das Textfeld oder lade eine Datei (Bild/PDF) hoch.
								Deadlines und Abgaben werden automatisch erkannt und als Aufgaben vorgeschlagen –
								du kannst jeden Eintrag vor dem Übernehmen prüfen und anpassen.
							</p>
							<p class="small text-secondary mb-3">
								<i class="bi bi-info-circle me-1"></i>Wähle einmalig das Modul aus dem aktiven Semester, für das dieser Semesterplan gilt.
							</p>
							<div class="mb-3">
								<label class="form-label small" for="import-module">Modul für diesen Semesterplan</label>
								<select id="import-module" class="form-select rounded-3" bind:value={importSelectedModule}>
									<option value="">Bitte wählen</option>
									{#each activeModules as mod}
										<option value={mod.name}>{mod.name}</option>
									{/each}
								</select>
							</div>

							<div class="mb-3">
								<label class="form-label small" for="semesterplan-file">Semesterplan hochladen (Bild oder PDF)</label>
								<input
									id="semesterplan-file"
									class="form-control rounded-3"
									type="file"
									accept="image/*,application/pdf"
									onchange={handleSemesterplanFile}
								/>
								{#if semesterplanFileName}
									<p class="small text-secondary mt-1 mb-0">Ausgewählt: {semesterplanFileName}</p>
								{/if}
							</div>
							<button class="btn btn-outline-primary rounded-pill w-100 mb-3" onclick={extractDeadlinesWithOcr} disabled={ocrLoading}>
								{ocrLoading ? 'Analyse läuft...' : 'Datei analysieren'}
							</button>

							<div class="mb-2">
								<label class="form-label small" for="deadline-text">Oder Text direkt einfügen</label>
								<textarea
									id="deadline-text"
									class="form-control rounded-3"
									rows="4"
									placeholder="z.B. Prototyping Abgabe 21.06.2026&#10;Analysis Prüfung 15.06.2026"
									bind:value={deadlineInput}
								></textarea>
							</div>
							<button class="btn btn-outline-primary rounded-pill w-100" onclick={extractDeadlines}>
								Text analysieren
							</button>

							{#if deadlineSuccess}
								<div class="alert alert-success py-2 small mt-3 mb-0">{deadlineSuccess}</div>
							{/if}
						</div>
					</div>

					{#if extractedDeadlines.length > 0}
						<div class="d-flex align-items-center justify-content-between mb-2">
							<h3 class="h6 mb-0">Erkannte Einträge – bitte prüfen und übernehmen</h3>
						</div>
						<div class="d-flex gap-2 mb-3">
							<button
								class="btn btn-sm btn-success rounded-pill flex-grow-1"
								onclick={addAllDeadlinesAsTasks}
								disabled={adoptingAll || !canAdoptAllDeadlines}
							>
								<i class="bi bi-check-all me-1"></i>{adoptingAll ? 'Wird übernommen...' : 'Alle übernehmen'}
							</button>
							<button class="btn btn-sm btn-outline-danger rounded-pill flex-grow-1" onclick={removeAllDeadlines}>
								<i class="bi bi-trash me-1"></i>Alle entfernen
							</button>
						</div>
						{#each extractedDeadlines as item, idx}
							<div class="card rounded-4 border-0 shadow-sm mb-2">
								<div class="card-body">
									{#if editingDeadlineIdx === idx}
										<div class="row g-2 mb-2">
											<div class="col-12">
												<label class="form-label small" for={`dl-title-${idx}`}>Titel</label>
												<input id={`dl-title-${idx}`} class="form-control form-control-sm rounded-3" bind:value={editingDeadlineData.title} />
											</div>
											<div class="col-6">
												<label class="form-label small" for={`dl-date-${idx}`}>Deadline</label>
												<input id={`dl-date-${idx}`} class="form-control form-control-sm rounded-3" type="date" bind:value={editingDeadlineData.dueDate} />
											</div>
											<div class="col-6">
												<label class="form-label small" for={`dl-prio-${idx}`}>Priorität</label>
												<select id={`dl-prio-${idx}`} class="form-select form-select-sm rounded-3" bind:value={editingDeadlineData.priority}>
													{#each priorities as p}
														<option value={p}>{p} – {priorityLabels[p]}</option>
													{/each}
												</select>
											</div>
										</div>
										<div class="d-flex gap-2">
											<button class="btn btn-sm btn-primary rounded-pill" onclick={saveEditDeadline}>Speichern</button>
											<button class="btn btn-sm btn-outline-secondary rounded-pill" onclick={cancelEditDeadline}>Abbrechen</button>
										</div>
									{:else}
										<p class="fw-semibold mb-1">{item.title}</p>
										<p class="small text-secondary mb-2">
											{item.dueDate ? formatDate(item.dueDate) : 'Kein Datum'}
											· Prio {item.priority || '3'}
										</p>
										<div class="mb-2">
											<p class="small text-secondary mb-0">
												Modul: <strong>{importSelectedModule || 'Bitte oben auswählen'}</strong>
											</p>
											{#if item.detectedModule}
												<p class="small text-secondary mb-0 mt-1">OCR Vorschlag: {item.detectedModule}</p>
											{/if}
										</div>
										<div class="d-flex gap-2 flex-wrap">
											<button class="btn btn-sm btn-success rounded-pill" onclick={() => addDeadlineAsTask(item, idx)} disabled={!importSelectedModule}>
												Zur Aufgabenliste hinzufügen
											</button>
											<button class="btn btn-sm btn-outline-primary rounded-pill" onclick={() => startEditDeadline(idx)}>
												Bearbeiten
											</button>
											<button class="btn btn-sm btn-outline-danger rounded-pill" onclick={() => removeDeadline(idx)}>
												Entfernen
											</button>
										</div>
									{/if}
								</div>
							</div>
						{/each}
					{/if}
				{/if}
			{/if}

			<!-- ==================== FOCUS ==================== -->
			{#if activeTab === 'focus'}
				<div id="profile-semester-section" class="card rounded-4 border-0 shadow-sm mb-3">
					<div class="card-body text-center">
						<h2 class="h5 mb-3">Fokus Timer</h2>
						<div class="mb-3">
							<label class="form-label small" for="selected-task">Aufgabe auswählen</label>
							<select id="selected-task" class="form-select rounded-3" bind:value={selectedTaskId}>
								<option value="">Bitte wählen</option>
								{#each openTasks as task}
									<option value={task._id}>
										{task.title}{task.status === 'in Bearbeitung' ? ' ▶ In Bearbeitung' : ''}
									</option>
								{/each}
							</select>
						</div>
						{#if selectedTask}
							<div class="d-flex align-items-center justify-content-center gap-2 mb-2">
								<span
									class="badge"
									style="background-color: {getModuleColor(selectedTask.module)}; color: white;"
								>{selectedTask.module}</span>
								<span class={`badge ${statusBadgeClass(selectedTask.status)}`}>
									{statusLabel(selectedTask.status)}
								</span>
							</div>
							{#if selectedTask.notes}
								<div class="alert alert-secondary py-2 text-start small mb-2">
									<i class="bi bi-sticky me-1"></i><strong>Notiz:</strong> {selectedTask.notes}
								</div>
							{/if}
						{/if}
						<div class="focus-timer mb-3">
							<div>
								<p class="text-secondary small mb-1">Verbleibend</p>
								<p class="display-6 fw-semibold mb-0">{formatSeconds(focusSecondsLeft)}</p>
							</div>
						</div>
						<p class="small text-secondary mb-2">{selectedTask ? selectedTask.title : 'Keine Aufgabe ausgewählt'}</p>
						<div class="d-flex justify-content-center gap-2">
							<button
								class="btn btn-primary rounded-pill px-3"
								onclick={startFocus}
								type="button"
								aria-label="Start"
								title="Start"
							>
								<i class="bi bi-play-fill" aria-hidden="true"></i>
							</button>
							<button
								class="btn btn-outline-secondary rounded-pill px-3"
								onclick={pauseFocus}
								type="button"
								aria-label="Pause"
								title="Pause"
							>
								<i class="bi bi-pause-fill" aria-hidden="true"></i>
							</button>
							<button
								class={`btn rounded-pill px-3 ${darkMode ? 'btn-outline-light' : 'btn-outline-dark'}`}
								onclick={resetFocus}
								type="button"
								aria-label="Reset"
								title="Reset"
							>
								<i class="bi bi-arrow-clockwise" aria-hidden="true"></i>
							</button>
						</div>
					</div>
				</div>

				<div class="card rounded-4 border-0 shadow-sm">
					<div class="card-body">
						<h3 class="h6 mb-3">Fokus abschliessen & Reflexion</h3>
						<div class="mb-2">
							<label class="form-label small" for="focus-rating">Wie fokussiert warst du?</label>
							<select id="focus-rating" class="form-select rounded-3" bind:value={reflectionRating}>
								{#each focusRatings as rating}
									<option>{rating}</option>
								{/each}
							</select>
						</div>
						<div class="mb-3">
							<label class="form-label small" for="focus-note">Kurze Notiz (optional)</label>
							<textarea
								id="focus-note"
								class="form-control rounded-3"
								rows="3"
								placeholder="Was hat gut funktioniert?"
								bind:value={reflectionNote}
							></textarea>
						</div>
						<button class="btn btn-success rounded-pill w-100" onclick={completeFocusSession}>
							Aufgabe als erledigt markieren
						</button>
					</div>
				</div>
			{/if}

			<!-- ==================== PROGRESS ==================== -->
			{#if activeTab === 'progress'}
				<div class="d-flex justify-content-between align-items-center mb-3 gap-2 flex-wrap">
					<h2 class="h5 mb-0">Mein Fortschritt</h2>
					<select class="form-select form-select-sm rounded-pill" style="width: auto;" bind:value={progressFilterSemester}>
						<option value="">Alle Semester</option>
						{#each mySemesters as sem}
							<option value={sem.id}>{sem.name}</option>
						{/each}
					</select>
				</div>

				<div class="row g-2 mb-3">
					<div class="col-6">
						<div class="card metric-card rounded-4 text-center">
							<div class="card-body py-3">
								<p class="small text-secondary mb-1">Aufgaben</p>
								<p class="h5 mb-0">{progressCompletedTasks.length} / {progressTasks.length}</p>
							</div>
						</div>
					</div>
					<div class="col-6">
						<div class="card metric-card rounded-4 text-center">
							<div class="card-body py-3">
								<p class="small text-secondary mb-1">Fokuszeit gesamt</p>
								<p class="h5 mb-0">{progressTotalFocusMinutes} min</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Weekly focus goal -->
				{#if weeklyGoalHours > 0}
					{@const goalMinutes = weeklyGoalHours * 60}
					{@const goalPct = Math.min(100, Math.round((progressThisWeekFocusMinutes / goalMinutes) * 100))}
					<div class="card rounded-4 border-0 shadow-sm mb-3">
						<div class="card-body">
							<div class="d-flex justify-content-between align-items-center mb-2">
								<h3 class="h6 mb-0">Wochenziel Fokuszeit</h3>
								<span class="small text-secondary">{progressThisWeekFocusMinutes} / {goalMinutes} min</span>
							</div>
							<div class="progress" style="height: 10px;">
								<div
									class="progress-bar {goalPct >= 100 ? 'bg-success' : 'bg-primary'}"
									style="width: {goalPct}%;"
									role="progressbar"
									aria-valuenow={goalPct}
									aria-valuemin="0"
									aria-valuemax="100"
								></div>
							</div>
							<p class="small text-secondary mt-1 mb-0">{goalPct}% erreicht · Ziel: {weeklyGoalHours} Std./Woche</p>
						</div>
					</div>
				{/if}

				<!-- Weekly chart -->
				<div class="card rounded-4 border-0 shadow-sm mb-3">
					<div class="card-body">
						<h3 class="h6 mb-3">Erledigte Aufgaben diese Woche</h3>
						<div class="d-flex align-items-end gap-1" style="height: 72px;">
							{#each progressWeeklyData as day}
								<div class="flex-grow-1 d-flex flex-column align-items-center gap-1">
									<div
										class={`rounded-top w-100 ${day.isToday ? 'bg-primary' : 'bg-secondary bg-opacity-25'}`}
										style="height: {Math.max(4, Math.round((day.count / progressMaxWeeklyCount) * 52))}px; transition: height 0.3s;"
									></div>
									<span class={`small ${day.isToday ? 'fw-bold text-primary' : 'text-secondary'}`} style="font-size: 10px;">
										{day.label}
									</span>
								</div>
							{/each}
						</div>
					</div>
				</div>

				<!-- Module progress -->
				{#if progressModuleStats.length > 0}
					<div class="card rounded-4 border-0 shadow-sm mb-3">
						<div class="card-body">
							<h3 class="h6 mb-3">Fortschritt nach Modul</h3>
							{#each progressModuleStats as stat}
								<div class="mb-3">
									<div class="d-flex justify-content-between align-items-center mb-1">
										<div class="d-flex align-items-center gap-2">
											<span class="module-dot" style="background-color: {stat.color};"></span>
											<span class="small fw-semibold">{stat.mod}</span>
										</div>
										<span class="small text-secondary">{stat.done}/{stat.total} · {stat.pct}%</span>
									</div>
									<div class="progress module-progress">
										<div
											class="progress-bar"
											style="width: {stat.pct}%; background-color: {stat.color};"
											role="progressbar"
											aria-valuenow={stat.pct}
											aria-valuemin="0"
											aria-valuemax="100"
										></div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Completed tasks filter + list -->
				<div class="card rounded-4 border-0 shadow-sm">
					<div class="card-body">
						<div class="d-flex justify-content-between align-items-center mb-3">
							<h3 class="h6 mb-0">Abgeschlossene Aufgaben</h3>
							<select class="form-select form-select-sm rounded-pill" style="width: auto;" bind:value={progressFilterModule}>
								<option value="">Alle Module</option>
								{#each progressModules as mod}
									<option value={mod}>{mod}</option>
								{/each}
							</select>
						</div>
						{#if filteredProgressCompletedTasks.length === 0}
							<p class="small text-secondary mb-0">Noch keine Aufgaben abgeschlossen.</p>
						{:else}
							{#each filteredProgressCompletedTasks as task}
								{@const ref = reflections.find((r) => r.taskId === task._id)}
								{@const diff = ref ? Number(ref.focusMinutes) - Number(task.duration) : null}
								<div class="border-bottom pb-2 mb-2">
									<div class="d-flex align-items-start justify-content-between">
										<div>
											<div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
												<span class={`badge ${priorityBadgeClass(task.priority)}`}>Prio {task.priority}</span>
												<span
													class="badge"
													style="background-color: {getModuleColor(task.module)}; color: white;"
												>{task.module}</span>
												{#if diff !== null}
													<span class={`badge ${diff > 10 ? 'text-bg-danger' : diff < -10 ? 'text-bg-success' : 'text-bg-secondary'}`}>
														{diff > 0 ? '+' : ''}{diff} min
													</span>
												{/if}
											</div>
											<p class="fw-semibold mb-0 small">{task.title}</p>
										</div>
										<div class="text-end flex-shrink-0 ms-2">
											<p class="small mb-0 text-secondary">Schätzung: {task.duration} min</p>
											{#if ref}
												<p class="small mb-0">Tatsächlich: {ref.focusMinutes} min</p>
												<p class="small text-secondary mb-0">{ref.rating}</p>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						{/if}
					</div>
				</div>
			{/if}

			<!-- ==================== PROFILE ==================== -->
			{#if activeTab === 'profile'}

				<!-- General settings -->
				<div class="card rounded-4 border-0 shadow-sm mb-3">
					<div class="card-body">
						<h2 class="h5 mb-3">Einstellungen</h2>

						<div class="mb-3">
							<label class="form-label small fw-semibold" for="setting-username">Dein Name</label>
							<input
								id="setting-username"
								class="form-control rounded-3"
								placeholder="z.B. Manuel"
								bind:value={userName}
							/>
						</div>

						<div class="mb-3">
							<label class="form-label small fw-semibold" for="setting-focus-duration">Standard-Fokuszeit (Minuten)</label>
							<div class="d-flex gap-2 mb-2 flex-wrap">
								{#each [25, 45, 60, 90] as preset}
									<button
										class="btn btn-sm rounded-pill {focusDuration === preset ? 'btn-primary' : 'btn-outline-secondary'}"
										onclick={() => { focusDuration = preset; }}
										type="button"
									>{preset} min</button>
								{/each}
							</div>
							<input
								id="setting-focus-duration"
								class="form-control rounded-3"
								type="number"
								min="5"
								max="180"
								step="5"
								bind:value={focusDuration}
							/>
							<p class="form-text text-secondary small">Wird beim Start jeder Fokus-Session verwendet. Reset setzt den Timer auf diesen Wert zurück.</p>
						</div>

						<div class="mb-3">
							<label class="form-label small fw-semibold" for="setting-weekly-goal">Wochenziel Fokuszeit (Stunden)</label>
							<input
								id="setting-weekly-goal"
								class="form-control rounded-3"
								type="number"
								min="0"
								max="80"
								step="0.5"
								bind:value={weeklyGoalHours}
							/>
							<p class="form-text text-secondary small">Wird im Fortschritts-Tab als Zielbalken angezeigt. 0 = kein Ziel.</p>
						</div>

						<div class="mb-4">
							<div class="d-flex align-items-center justify-content-between">
								<div>
									<p class="fw-semibold small mb-0">Dark Mode</p>
									<p class="text-secondary" style="font-size: 12px; margin-bottom: 0;">Dunkles Erscheinungsbild</p>
								</div>
								<div class="form-check form-switch mb-0">
									<input
										class="form-check-input"
										type="checkbox"
										role="switch"
										id="dark-mode-toggle"
										bind:checked={darkMode}
										onchange={() => saveSettings(false)}
										style="width: 2.5em; height: 1.25em;"
									/>
									<label class="form-check-label visually-hidden" for="dark-mode-toggle">Dark Mode</label>
								</div>
							</div>
						</div>

						<button
							class="btn rounded-pill w-100 {settingsSaved ? 'btn-success' : 'btn-primary'}"
							onclick={saveSettings}
							style="transition: background-color 0.3s, border-color 0.3s;"
						>
							<i class="bi {settingsSaved ? 'bi-check-circle-fill' : 'bi-check-lg'} me-1"></i>
							{settingsSaved ? 'Gespeichert!' : 'Einstellungen speichern'}
						</button>
					</div>
				</div>

				<!-- Semester management -->
				<div class="card rounded-4 border-0 shadow-sm mb-3">
					<div class="card-body">
						<h3 class="h6 mb-1">Semester</h3>
						<p class="small text-secondary mb-3">Erstelle Semester und wähle das aktive aus. Module werden pro Semester verwaltet.</p>

						{#if mySemesters.length > 0}
							<div class="mb-3">
								<label class="form-label small fw-semibold" for="active-semester">Aktuelles Semester</label>
								<select
									id="active-semester"
									class="form-select rounded-3"
									bind:value={activeSemesterId}
									onchange={() => { void setActiveSemester(activeSemesterId); }}
								>
									<option value="">Kein Semester gewählt</option>
									{#each mySemesters as sem}
										<option value={sem.id}>{sem.name}</option>
									{/each}
								</select>
							</div>
							<div class="d-flex flex-wrap gap-2 mb-3">
								{#each mySemesters as sem}
									{#if deletingSemesterId === sem.id}
										<div class="d-flex align-items-center gap-2 border rounded-pill px-2 py-1">
											<span class="small text-danger fw-semibold">Semester "{sem.name}" wirklich löschen?</span>
											<button class="btn btn-sm btn-danger rounded-pill" type="button" onclick={() => confirmRemoveSemester(sem.id)}>Ja</button>
											<button class="btn btn-sm btn-outline-secondary rounded-pill" type="button" onclick={cancelRemoveSemester}>Nein</button>
										</div>
									{:else}
										<span class="badge d-flex align-items-center gap-1 px-2 py-2" style="background-color: {sem.color}; color: white; font-size: 13px;">
											{sem.name}
											<button
												type="button"
												class="btn-close btn-close-white ms-1"
												style="font-size: 9px;"
												aria-label="Entfernen"
												onclick={() => { deletingSemesterId = sem.id; deletingModuleId = ''; }}
											></button>
										</span>
									{/if}
								{/each}
							</div>
						{:else}
							<p class="small text-secondary mb-3">Noch kein Semester angelegt.</p>
						{/if}

						<div class="d-flex gap-2 align-items-center">
							<input
								id="add-semester-input"
								class="form-control rounded-3"
								placeholder="z.B. HS 2025/26"
								bind:value={newSemesterInput}
								onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSemester(); } }}
							/>
							<div class="d-flex gap-1 flex-shrink-0">
							{#each MODULE_COLORS.slice(0, 8) as color}
								<button
									type="button"
									class="color-swatch"
									class:active={newSemesterColor === color}
									style="background-color: {color};"
									onclick={() => { newSemesterColor = color; }}
									title="Farbe wählen"
									aria-label="Farbe wählen"
								></button>
							{/each}
							</div>
							<button class="btn btn-outline-primary rounded-pill px-3 flex-shrink-0" onclick={addSemester} type="button" aria-label="Semester hinzufügen" title="Semester hinzufügen">
								<i class="bi bi-plus-lg"></i>
							</button>
						</div>
					</div>
				</div>

				<!-- Module management -->
				<div id="profile-module-section" class="card rounded-4 border-0 shadow-sm mb-3">
					<div class="card-body">
						<h3 class="h6 mb-1">Module</h3>
						{#if !activeSemesterId}
							<p class="small text-secondary mb-0">Bitte zuerst ein aktives Semester auswählen oder erstellen.</p>
						{:else}
							{@const activeSem = mySemesters.find((s) => s.id === activeSemesterId)}
							<p class="small text-secondary mb-3">Module für <strong>{activeSem?.name ?? ''}</strong></p>

							{#if activeModules.length > 0}
								<div class="d-flex flex-wrap gap-2 mb-3">
									{#each activeModules as mod}
										{#if deletingModuleId === mod.id}
											<div class="d-flex align-items-center gap-2 border rounded-pill px-2 py-1">
												<span class="small text-danger fw-semibold">Modul "{mod.name}" wirklich löschen?</span>
												<button class="btn btn-sm btn-danger rounded-pill" type="button" onclick={() => confirmRemoveModule(mod.id)}>Ja</button>
												<button class="btn btn-sm btn-outline-secondary rounded-pill" type="button" onclick={cancelRemoveModule}>Nein</button>
											</div>
										{:else}
											<span class="badge d-flex align-items-center gap-1 px-2 py-2" style="background-color: {mod.color}; color: white; font-size: 13px;">
												{mod.name}
												<button
													type="button"
													class="btn-close btn-close-white ms-1"
													style="font-size: 9px;"
													aria-label="Entfernen"
													onclick={() => { deletingModuleId = mod.id; deletingSemesterId = ''; }}
												></button>
											</span>
										{/if}
									{/each}
								</div>
							{:else}
								<p class="small text-secondary mb-3">Noch keine Module in diesem Semester.</p>
							{/if}

							<div class="d-flex gap-2 align-items-center">
								<input
									id="add-module-input"
									class="form-control rounded-3"
									placeholder="Modul hinzufügen, z.B. Analysis"
									bind:value={newModuleInput}
									onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addModule(); } }}
								/>
								<div class="d-flex gap-1 flex-shrink-0">
								{#each MODULE_COLORS.slice(0, 8) as color}
									<button
										type="button"
										class="color-swatch"
										class:active={newModuleColor === color}
										style="background-color: {color};"
										onclick={() => { newModuleColor = color; }}
										title="Farbe wählen"
										aria-label="Farbe wählen"
									></button>
								{/each}
								</div>
								<button class="btn btn-outline-primary rounded-pill px-3 flex-shrink-0" onclick={addModule} type="button" aria-label="Modul hinzufügen" title="Modul hinzufügen">
									<i class="bi bi-plus-lg"></i>
								</button>
							</div>
						{/if}
					</div>
				</div>

				<!-- Data management -->
				<div class="card rounded-4 border-0 shadow-sm border-danger-subtle">
					<div class="card-body">
						<h3 class="h6 mb-1 text-danger">Daten zurücksetzen</h3>
						<p class="small text-secondary mb-3">Diese Aktion kann nicht rückgängig gemacht werden und löscht alle gespeicherten Daten.</p>
						{#if confirmingDeleteAllData}
							<div class="d-flex flex-column gap-2">
								<span class="small text-danger fw-semibold">Wirklich alle Daten (Aufgaben, Reflexionen, Semester, Module, Einstellungen) löschen?</span>
								<div class="d-flex gap-2">
									<button class="btn btn-danger rounded-pill flex-grow-1" type="button" onclick={deleteAllData}>Ja, alles löschen</button>
									<button class="btn btn-outline-secondary rounded-pill flex-grow-1" type="button" onclick={cancelDeleteAllData}>Nein</button>
								</div>
							</div>
						{:else}
							<button class="btn btn-danger rounded-pill w-100" type="button" onclick={requestDeleteAllData}>
								<i class="bi bi-exclamation-triangle me-1"></i>Alle Daten löschen
							</button>
						{/if}
					</div>
				</div>

			{/if}
		</section>

	<nav class="bottom-nav fixed-bottom border-top py-2 px-2">
		<div class="d-flex justify-content-around">
			{#each tabs as tab}
				<button
					class="btn btn-sm nav-btn d-flex flex-column align-items-center gap-1"
					class:btn-primary={activeTab === tab}
					class:btn-light={activeTab !== tab}
					onclick={() => { activeTab = tab; if (tab === 'tasks') taskSubView = 'list'; }}
				>
					<i class={`bi ${tabIcons[tab]}`}></i>
					<span style="font-size: 10px;">{tabLabels[tab]}</span>
				</button>
			{/each}
		</div>
	</nav>
</main>

<style>
	.bottom-nav {
		background-color: var(--bs-body-bg);
		border-top-color: var(--bs-border-color) !important;
	}
	:global([data-bs-theme='dark']) .bottom-nav :global(.nav-btn.btn-light) {
		background-color: #2b3035;
		border-color: #495057;
		color: #f8f9fa;
	}
	:global([data-bs-theme='dark']) .bottom-nav :global(.nav-btn.btn-light:hover) {
		background-color: #343a40;
		border-color: #6c757d;
	}

	.color-swatch {
		width: 22px;
		height: 22px;
		border-radius: 50%;
		border: 2px solid transparent;
		padding: 0;
		cursor: pointer;
		outline: 2px solid transparent;
		outline-offset: 2px;
		transition: outline-color 0.15s, border-color 0.15s, box-shadow 0.15s;
		flex-shrink: 0;
	}
	.color-swatch.active {
		border-color: #fff;
		box-shadow: 0 0 0 1px var(--bs-body-color);
	}
	.color-swatch:focus-visible {
		outline-color: var(--bs-primary);
	}
</style>
