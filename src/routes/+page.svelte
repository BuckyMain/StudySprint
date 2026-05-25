<script>
	import { onMount, onDestroy } from 'svelte';
	import HomeTab from '$lib/features/tabs/HomeTab.svelte';
	import TasksTab from '$lib/features/tabs/TasksTab.svelte';
	import FocusTab from '$lib/features/tabs/FocusTab.svelte';
	import ProgressTab from '$lib/features/tabs/ProgressTab.svelte';
	import ProfileTab from '$lib/features/tabs/ProfileTab.svelte';
	import {
		formatDate as formatDateUtil,
		formatDateShort as formatDateShortUtil,
		formatOvertime as formatOvertimeUtil,
		formatProgressPeriodLabel as formatProgressPeriodLabelUtil,
		formatSeconds as formatSecondsUtil,
		getMonthRange as getMonthRangeUtil,
		getProgressPeriodRange as getProgressPeriodRangeUtil,
		getWeekRange as getWeekRangeUtil,
		parseDateValue as parseDateValueUtil,
		startOfLocalDay as startOfLocalDayUtil
	} from '$lib/features/shared/date-utils';
	import {
		getFilteredSortedTasks,
		isTaskNoteLong as isTaskNoteLongUtil,
		normalizeExtractedDeadlines as normalizeExtractedDeadlinesUtil,
		priorityBadgeClass as priorityBadgeClassUtil,
		priorityBadgeClassNeutral as priorityBadgeClassNeutralUtil,
		statusBadgeClass as statusBadgeClassUtil,
		statusLabel as statusLabelUtil,
		toggleIdInSet
	} from '$lib/features/tasks/task-utils';
	import {
		buildProgressChartData,
		buildWeeklyData,
		getTaskReflectionsForPeriod as getTaskReflectionsForPeriodUtil
	} from '$lib/features/progress/progress-utils';
	import {
		apiClient,
		asId,
		normalizeModules,
		normalizeSemesters
	} from '$lib/features/shared/api-client';
	import {
		createTaskAction,
		deleteTaskAction,
		setTaskStatusAction,
		updateTaskAction
	} from '$lib/features/tasks/task-actions';
	import {
		addAllDeadlinesAsTasksAction,
		addDeadlineAsTaskAction,
		extractDeadlinesAction,
		extractDeadlinesWithOcrAction
	} from '$lib/features/tasks/task-import-actions';
	import {
		addModuleAction,
		addSemesterAction,
		deleteAllDataAction,
		removeModuleAction,
		removeSemesterAction,
		saveSettingsAction,
		setActiveSemesterAction
	} from '$lib/features/profile/profile-actions';
	import { migrateLegacyLocalStorageIfNeeded as migrateLegacyLocalStorageIfNeededAction } from '$lib/features/profile/migration-actions';
	import {
		completeFocusSessionAction,
		pauseFocusAction,
		startFocusAction
	} from '$lib/features/focus/focus-actions';

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
	let taskSortBy = $state('dueDate');
	let taskFilterModule = $state('');
	let taskFilterStatus = $state('open');
	let deletingTaskId = $state(null);
	let expandedTaskNoteIds = $state(new Set());
	let creatingTaskModule = $state(false);
	let taskFormNewModuleName = $state('');
	let taskFormNewModuleColor = $state(MODULE_COLORS[0]);
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
	let importAnalysisLoading = $state(false);
	let importAnalysisSource = $state('');
	let deadlineSuccess = $state('');
	let adoptingAll = $state(false);

	let selectedTaskId = $state('');
	let focusSecondsLeft = $state(25 * 60);
	let focusTargetSeconds = $state(25 * 60);
	let isFocusRunning = $state(false);
	let focusTimerHandle = null;
	let focusHasStarted = $state(false);
	let focusNoteExpanded = $state(false);
	let reflectionRating = $state('Okay');
	let reflectionNote = $state('');

	// Progress filter
	let progressFilterSemester = $state('');
	let progressFilterModule = $state('');
	let progressPeriod = $state('week');
	let expandedProgressTaskIds = $state(new Set());

	const completedTasks = $derived(tasks.filter((t) => t.status === 'erledigt'));
	const openTasks = $derived(tasks.filter((t) => t.status !== 'erledigt'));
	const totalFocusMinutes = $derived(
		reflections.reduce((sum, r) => sum + Number(r.focusMinutes || 0), 0)
	);
	const selectedTask = $derived(tasks.find((t) => t._id === selectedTaskId) ?? null);

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
	const homeTasks = $derived(tasksInActiveSemester);
	const homeTaskIds = $derived.by(() => new Set(homeTasks.map((t) => String(t._id))));
	const homeOpenTasks = $derived(homeTasks.filter((t) => t.status !== 'erledigt'));
	const nearestDeadline = $derived.by(() => {
		const todayStart = startOfLocalDay();
		return [...homeOpenTasks]
			.filter((t) => {
				const due = parseDateValue(t.dueDate);
				return due && due >= todayStart;
			})
			.sort((a, b) => parseDateValue(a.dueDate) - parseDateValue(b.dueDate))[0] ?? null;
	});
	const highestPriorityTask = $derived(
		[...homeOpenTasks].sort((a, b) => Number(a.priority) - Number(b.priority))[0] ?? null
	);
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
		return getFilteredSortedTasks(
			tasksInActiveSemester,
			taskFilterStatus,
			taskFilterModule,
			taskSortBy,
			parseDateValue
		);
	});

	const upcomingTasks = $derived.by(() => {
		const { weekStart, weekEnd } = getWeekRange(new Date());
		return [...homeOpenTasks]
			.filter((t) => {
				const due = parseDateValue(t.dueDate);
				return due && due >= weekStart && due < weekEnd;
			})
			.sort((a, b) => parseDateValue(a.dueDate) - parseDateValue(b.dueDate))
			.slice(0, 5);
	});
	const overdueTasks = $derived.by(() => {
		const todayStart = startOfLocalDay();
		return [...homeOpenTasks]
			.filter((t) => {
				const due = parseDateValue(t.dueDate);
				return due && due < todayStart;
			})
			.sort((a, b) => parseDateValue(a.dueDate) - parseDateValue(b.dueDate));
	});

	const thisWeekCompleted = $derived.by(() => {
		const { weekStart, weekEnd } = getWeekRange(new Date());
		const completedTaskIds = new Set(
			homeTasks
				.filter((t) => t.status === 'erledigt')
				.map((t) => String(t._id))
		);
		const weeklyCompletedTaskIds = new Set();
		for (const r of reflections) {
			const created = new Date(r.createdAt);
			const taskId = r.taskId ? String(r.taskId) : '';
			if (Number.isNaN(created.getTime()) || !taskId) continue;
			if (created < weekStart || created >= weekEnd) continue;
			if (!homeTaskIds.has(taskId) || !completedTaskIds.has(taskId)) continue;
			weeklyCompletedTaskIds.add(taskId);
		}
		return weeklyCompletedTaskIds.size;
	});

	const weeklyData = $derived.by(() => {
		return buildWeeklyData(reflections);
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
	const progressPeriodRange = $derived.by(() => getProgressPeriodRange(progressPeriod));
	const progressPeriodReflections = $derived.by(() => {
		if (progressPeriod === 'semester') return progressReflections;
		const { start, end } = progressPeriodRange;
		return progressReflections.filter((r) => {
			const created = new Date(r.createdAt);
			return !Number.isNaN(created.getTime()) && created >= start && created < end;
		});
	});
	const progressPeriodTaskIds = $derived.by(
		() => new Set(progressPeriodReflections.map((r) => String(r.taskId || '')).filter(Boolean))
	);
	const progressCompletedTasksWithReflections = $derived.by(() =>
		progressTasks.filter(
			(t) => t.status === 'erledigt' && progressPeriodTaskIds.has(String(t._id))
		)
	);
	const progressPeriodTasks = $derived(progressTasks);
	const progressCompletedTasks = $derived(
		progressPeriodTasks.filter((t) => t.status === 'erledigt')
	);
	const progressCompletionPct = $derived(
		progressPeriodTasks.length
			? Math.round((progressCompletedTasks.length / progressPeriodTasks.length) * 100)
			: 0
	);
	const progressModules = $derived([
		...new Set(progressPeriodTasks.map((t) => t.module).filter(Boolean))
	]);
	const progressPeriodFocusMinutes = $derived(
		progressPeriodReflections.reduce((sum, r) => sum + Number(r.focusMinutes || 0), 0)
	);
	const progressChartData = $derived.by(() => {
		return buildProgressChartData(progressPeriod, progressPeriodReflections);
	});
	const progressMaxChartCount = $derived(Math.max(1, ...progressChartData.map((d) => d.count)));
	const progressModuleStats = $derived.by(() => {
		return progressModules.map((mod) => {
			const modTasks = progressPeriodTasks.filter((t) => t.module === mod);
			const modDone = modTasks.filter((t) => t.status === 'erledigt').length;
			const pct = modTasks.length ? Math.round((modDone / modTasks.length) * 100) : 0;
			return { mod, total: modTasks.length, done: modDone, pct, color: getModuleColor(mod) };
		});
	});
	const filteredProgressCompletedTasks = $derived.by(() => {
		if (!progressFilterModule) return progressCompletedTasks;
		return progressCompletedTasks.filter((t) => t.module === progressFilterModule);
	});
	const filteredProgressCompletedTasksWithReflections = $derived.by(() => {
		if (!progressFilterModule) return progressCompletedTasksWithReflections;
		return progressCompletedTasksWithReflections.filter((t) => t.module === progressFilterModule);
	});
	const progressOverUnderMinutes = $derived.by(() => {
		return filteredProgressCompletedTasksWithReflections.reduce((sum, task) => {
			const taskRefs = getTaskReflectionsForPeriod(task._id);
			const spent = taskRefs.reduce((acc, r) => acc + Number(r.focusMinutes || 0), 0);
			return sum + (spent - Number(task.duration || 0));
		}, 0);
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
			duration: 25,
			priority: '3',
			notes: '',
			semesterId: activeSemesterId || '',
			semesterName: activeSemester?.name || ''
		};
	}

	function openNewTaskForm() {
		taskForm = buildNewTaskFormDefaults();
		creatingTaskModule = false;
		taskFormNewModuleName = '';
		taskFormNewModuleColor = MODULE_COLORS[0];
		taskSubView = 'new';
	}

	function applyRouteStateFromQuery() {
		if (typeof window === 'undefined') return;
		const params = new URLSearchParams(window.location.search);
		const tab = String(params.get('tab') || '').trim();
		if (tabs.includes(tab)) {
			activeTab = tab;
		}
		if (tab !== 'tasks') return;

		const view = String(params.get('view') || '').trim();
		if (view === 'new') {
			openNewTaskForm();
			return;
		}
		if (view === 'import') {
			taskSubView = 'import';
			return;
		}
		if (view === 'edit') {
			const taskId = String(params.get('id') || '').trim();
			if (!taskId) return;
			const targetTask = tasks.find((task) => String(task._id) === taskId);
			if (targetTask) {
				startEditTask(targetTask);
			}
			return;
		}
		taskSubView = 'list';
	}

	function getFocusTargetSeconds(task = selectedTask) {
		return Number(task?.duration || 25) * 60;
	}

	function priorityBadgeClass(p) {
		return priorityBadgeClassUtil(p);
	}

	function priorityBadgeClassNeutral() {
		return priorityBadgeClassNeutralUtil();
	}

	function getProgressPeriodRange(period = progressPeriod, referenceDate = new Date()) {
		return getProgressPeriodRangeUtil(period, referenceDate);
	}

	function formatDateShort(value) {
		return formatDateShortUtil(value);
	}

	function formatProgressPeriodLabel() {
		return formatProgressPeriodLabelUtil(
			progressPeriod,
			progressFilterSemester,
			mySemesters,
			progressPeriodRange
		);
	}

	function getTaskReflectionsForPeriod(taskId) {
		return getTaskReflectionsForPeriodUtil(progressPeriodReflections, taskId);
	}

	function toggleProgressTaskDetails(taskId) {
		expandedProgressTaskIds = toggleIdInSet(expandedProgressTaskIds, taskId);
	}

	function statusBadgeClass(status) {
		return statusBadgeClassUtil(status);
	}

	function statusLabel(status) {
		return statusLabelUtil(status);
	}

	async function api(path, options = {}) {
		return apiClient(path, options);
	}

	function normalizeExtractedDeadlines(items = []) {
		return normalizeExtractedDeadlinesUtil(items);
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
			weeklyGoalHours = Number(settingsData.weeklyGoalHours || 10);

			const preferredActiveSemesterId = String(settingsData.activeSemesterId || '');
			const activeFromSemesters = mySemesters.find((s) => s.isActive)?.id || '';
			const nextActiveSemesterId =
				preferredActiveSemesterId && mySemesters.some((s) => s.id === preferredActiveSemesterId)
					? preferredActiveSemesterId
					: activeFromSemesters;
			activeSemesterId = nextActiveSemesterId;
			const hasValidProgressSemester =
				progressFilterSemester && mySemesters.some((s) => s.id === progressFilterSemester);
			if (!hasValidProgressSemester) {
				progressFilterSemester = nextActiveSemesterId || '';
			}

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
			const result = await createTaskAction({
				api,
				activeSemesterId,
				creatingTaskModule,
				taskFormNewModuleName,
				taskForm,
				activeModules,
				taskFormNewModuleColor,
				activeSemester,
				asId,
				moduleColors: MODULE_COLORS,
				buildNewTaskFormDefaults
			});
			taskForm = result.taskForm;
			creatingTaskModule = result.creatingTaskModule;
			taskFormNewModuleName = result.taskFormNewModuleName;
			taskFormNewModuleColor = result.taskFormNewModuleColor;
			taskSubView = result.taskSubView;
			await refreshData();
		} catch (e) {
			error = e.message;
		}
	}

	function toggleTaskNote(taskId) {
		expandedTaskNoteIds = toggleIdInSet(expandedTaskNoteIds, taskId);
	}

	function isTaskNoteExpanded(taskId) {
		return expandedTaskNoteIds.has(String(taskId));
	}

	function isTaskNoteLong(note) {
		return isTaskNoteLongUtil(note);
	}

	function openFocusForTask(task) {
		stopFocus();
		focusHasStarted = false;
		selectedTaskId = String(task._id);
		focusTargetSeconds = getFocusTargetSeconds(task);
		focusSecondsLeft = focusTargetSeconds;
		focusNoteExpanded = false;
		activeTab = 'focus';
	}

	function handleFocusTaskChange() {
		stopFocus();
		focusHasStarted = false;
		focusTargetSeconds = getFocusTargetSeconds();
		focusSecondsLeft = focusTargetSeconds;
		focusNoteExpanded = false;
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
			await updateTaskAction({
				api,
				editingTaskId,
				editTaskForm,
				activeModules
			});
			taskSubView = 'list';
			await refreshData();
		} catch (e) {
			error = e.message;
		}
	}

	async function setTaskStatus(task, status) {
		try {
			await setTaskStatusAction({ api, taskId: task._id, status });
			await refreshData(false);
		} catch (e) {
			error = e.message;
		}
	}

	async function deleteTask(taskId) {
		error = '';
		try {
			await deleteTaskAction({ api, taskId });
			deletingTaskId = null;
			await refreshData();
		} catch (e) {
			error = e.message;
		}
	}

	async function extractDeadlines() {
		error = '';
		deadlineSuccess = '';
		importAnalysisLoading = true;
		importAnalysisSource = 'text';
		try {
			const result = await extractDeadlinesAction({
				api,
				activeModules,
				deadlineInput,
				normalizeExtractedDeadlines
			});
			extractedDeadlines = result.extractedDeadlines;
			importSelectedModule = result.importSelectedModule;
			deadlineSuccess = result.deadlineSuccess;
		} catch (e) {
			error = e.message;
		} finally {
			importAnalysisLoading = false;
			importAnalysisSource = '';
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
		ocrLoading = true;
		importAnalysisLoading = true;
		importAnalysisSource = 'file';
		try {
			const result = await extractDeadlinesWithOcrAction({
				api,
				activeModules,
				semesterplanImageBase64,
				semesterplanMimeType,
				normalizeExtractedDeadlines
			});
			extractedDeadlines = result.extractedDeadlines;
			importSelectedModule = result.importSelectedModule;
			deadlineSuccess = result.deadlineSuccess;
		} catch (e) {
			error = e.message;
		} finally {
			ocrLoading = false;
			importAnalysisLoading = false;
			importAnalysisSource = '';
		}
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
			const result = await addDeadlineAsTaskAction({
				api,
				item,
				idx,
				importSelectedModule,
				activeModules,
				mySemesters,
				activeSemester,
				activeSemesterId,
				refreshData,
				getActiveSemesterId: () => activeSemesterId,
				extractedDeadlines
			});
			extractedDeadlines = result.extractedDeadlines;
			await refreshData();
			deadlineSuccess = result.deadlineSuccess;
		} catch (e) {
			error = e.message;
		}
	}

	async function addAllDeadlinesAsTasks() {
		adoptingAll = true;
		error = '';
		deadlineSuccess = '';
		try {
			const result = await addAllDeadlinesAsTasksAction({
				api,
				extractedDeadlines,
				canAdoptAllDeadlines,
				importSelectedModule,
				activeModules,
				mySemesters,
				activeSemester,
				activeSemesterId,
				refreshData,
				getActiveSemesterId: () => activeSemesterId
			});
			if (result.added > 0) {
				extractedDeadlines = [];
				importSelectedModule = '';
				await refreshData();
				deadlineSuccess = `${result.added} Aufgabe(n) übernommen.`;
			} else {
				error = result.lastError || 'Es konnte keine Aufgabe übernommen werden.';
			}
		} catch (e) {
			error = e.message;
		} finally {
			adoptingAll = false;
		}
	}

	function removeDeadline(idx) {
		extractedDeadlines = extractedDeadlines.filter((_, i) => i !== idx);
	}

	function removeAllDeadlines() {
		extractedDeadlines = [];
		importSelectedModule = '';
		deadlineSuccess = '';
	}

	async function startFocus() {
		try {
			const result = await startFocusAction({
				selectedTask,
				isFocusRunning,
				focusSecondsLeft,
				focusTargetSeconds,
				setTaskStatus,
				startTimerTick: () => {
					focusTimerHandle = setInterval(() => {
						focusSecondsLeft -= 1;
					}, 1000);
				}
			});
			if (result) {
				focusSecondsLeft = result.focusSecondsLeft;
				isFocusRunning = result.isFocusRunning;
				focusHasStarted = result.focusHasStarted;
			}
		} catch (e) {
			error = e.message;
		}
	}

	async function pauseFocus() {
		try {
			await pauseFocusAction({
				isFocusRunning,
				selectedTask,
				focusHasStarted,
				focusSecondsLeft,
				focusTargetSeconds,
				setTaskStatus,
				stopTimerTick: () => stopFocus()
			});
		} catch (e) {
			error = e.message;
		}
	}

	function resetFocus() {
		stopFocus();
		focusTargetSeconds = getFocusTargetSeconds();
		focusSecondsLeft = focusTargetSeconds;
		focusHasStarted = false;
		focusNoteExpanded = false;
	}

	function stopFocus() {
		isFocusRunning = false;
		if (focusTimerHandle) { clearInterval(focusTimerHandle); focusTimerHandle = null; }
	}

	function formatSeconds(s) {
		return formatSecondsUtil(s);
	}

	function formatOvertime(s) {
		return formatOvertimeUtil(s);
	}

	function parseDateValue(value) {
		return parseDateValueUtil(value);
	}

	function startOfLocalDay(date = new Date()) {
		return startOfLocalDayUtil(date);
	}

	function getWeekRange(referenceDate = new Date()) {
		return getWeekRangeUtil(referenceDate);
	}

	function getMonthRange(referenceDate = new Date()) {
		return getMonthRangeUtil(referenceDate);
	}

	function formatDate(value) {
		return formatDateUtil(value);
	}

	async function completeFocusSession() {
		try {
			await completeFocusSessionAction({
				api,
				selectedTask,
				reflectionRating,
				reflectionNote,
				focusTargetSeconds,
				focusSecondsLeft,
				setTaskStatus
			});
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
			await saveSettingsAction({
				api,
				userName,
				darkMode,
				weeklyGoalHours,
				activeSemesterId,
				overrides
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
		progressFilterSemester = id || '';
		await setActiveSemesterAction({ api, id });
		await saveSettings(false, { activeSemesterId: id });
		if (refresh) await refreshData();
	}

	async function addSemester() {
		const name = newSemesterInput.trim();
		if (!name) return;
		error = '';
		try {
			const created = await addSemesterAction({ api, name, color: newSemesterColor });
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
			await removeSemesterAction({ api, id });
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
			await addModuleAction({
				api,
				name,
				color: newModuleColor,
				semesterId: activeSemesterId
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
			await removeModuleAction({ api, id });
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
			await deleteAllDataAction({ api });
			await refreshData();
			confirmingDeleteAllData = false;
		} catch (e) {
			error = e.message;
		}
	}

	async function migrateLegacyLocalStorageIfNeeded() {
		await migrateLegacyLocalStorageIfNeededAction({
			api,
			moduleColors: MODULE_COLORS,
			normalizeModules,
			asId
		});
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
			applyRouteStateFromQuery();
			focusTargetSeconds = getFocusTargetSeconds();
			focusSecondsLeft = focusTargetSeconds;
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
				<HomeTab
					{activeSemester}
					{homeOpenTasks}
					{thisWeekCompleted}
					{openProfileQuicklink}
					{nearestDeadline}
					{getModuleColor}
					{formatDate}
					{openFocusForTask}
					{highestPriorityTask}
					{priorityBadgeClass}
					{upcomingTasks}
					{overdueTasks}
				/>
			{/if}

			<!-- ==================== TASKS ==================== -->
			{#if activeTab === 'tasks'}
				<TasksTab
					{activeSemester}
					bind:taskSubView
					{openNewTaskForm}
					bind:taskSortBy
					bind:taskFilterModule
					{taskFilterModules}
					bind:taskFilterStatus
					{filteredSortedTasks}
					{getModuleColor}
					{priorityBadgeClassNeutral}
					{statusBadgeClass}
					{statusLabel}
					{formatDate}
					{isTaskNoteExpanded}
					{openFocusForTask}
					{startEditTask}
					{setTaskStatus}
					{deletingTaskId}
					{deleteTask}
					{cancelDeleteTask}
					{confirmDeleteTask}
					{isTaskNoteLong}
					{toggleTaskNote}
					{createTask}
					bind:taskForm
					bind:creatingTaskModule
					bind:taskFormNewModuleName
					bind:taskFormNewModuleColor
					{activeModules}
					{allModuleNames}
					{priorities}
					{priorityLabels}
					{updateTask}
					bind:editTaskForm
					{importAnalysisLoading}
					{importAnalysisSource}
					{handleSemesterplanFile}
					{extractDeadlinesWithOcr}
					{ocrLoading}
					bind:deadlineInput
					{extractDeadlines}
					{deadlineSuccess}
					bind:importSelectedModule
					{extractedDeadlines}
					{adoptingAll}
					{canAdoptAllDeadlines}
					{addAllDeadlinesAsTasks}
					{removeAllDeadlines}
					{editingDeadlineIdx}
					bind:editingDeadlineData
					{saveEditDeadline}
					{cancelEditDeadline}
					{startEditDeadline}
					{addDeadlineAsTask}
					{removeDeadline}
				/>
			{/if}

			<!-- ==================== FOCUS ==================== -->
			{#if activeTab === 'focus'}
				<FocusTab
					{activeSemester}
					{openTasks}
					bind:selectedTaskId
					{handleFocusTaskChange}
					{selectedTask}
					{getModuleColor}
					{statusBadgeClass}
					{statusLabel}
					{isTaskNoteLong}
					bind:focusNoteExpanded
					{focusSecondsLeft}
					{formatSeconds}
					{formatOvertime}
					{isFocusRunning}
					{focusHasStarted}
					{startFocus}
					{pauseFocus}
					{resetFocus}
					{focusRatings}
					bind:reflectionRating
					bind:reflectionNote
					{completeFocusSession}
				/>
			{/if}

			<!-- ==================== PROGRESS ==================== -->
			{#if activeTab === 'progress'}
				<ProgressTab
					bind:progressFilterSemester
					{mySemesters}
					bind:progressPeriod
					{formatProgressPeriodLabel}
					{progressCompletedTasks}
					{progressPeriodTasks}
					{progressCompletionPct}
					{progressPeriodFocusMinutes}
					{progressOverUnderMinutes}
					{weeklyGoalHours}
					{progressChartData}
					{progressMaxChartCount}
					{progressModuleStats}
					bind:progressFilterModule
					{progressModules}
					{filteredProgressCompletedTasks}
					{getTaskReflectionsForPeriod}
					{expandedProgressTaskIds}
					{priorityBadgeClassNeutral}
					{getModuleColor}
					{toggleProgressTaskDetails}
					{formatDate}
				/>
			{/if}

			<!-- ==================== PROFILE ==================== -->
			{#if activeTab === 'profile'}
				<ProfileTab
					bind:userName
					bind:weeklyGoalHours
					bind:darkMode
					{saveSettings}
					{settingsSaved}
					{mySemesters}
					bind:activeSemesterId
					{setActiveSemester}
					bind:deletingSemesterId
					bind:deletingModuleId
					{cancelRemoveSemester}
					{confirmRemoveSemester}
					bind:newSemesterInput
					bind:newSemesterColor
					{addSemester}
					{MODULE_COLORS}
					{activeModules}
					{cancelRemoveModule}
					{confirmRemoveModule}
					bind:newModuleInput
					bind:newModuleColor
					{addModule}
					bind:confirmingDeleteAllData
					{deleteAllData}
					{cancelDeleteAllData}
					{requestDeleteAllData}
				/>
			{/if}
		</section>

	<nav class="bottom-nav fixed-bottom border-top py-2 px-2">
		<div class="d-flex justify-content-around">
			{#each tabs as tab}
				<button
					class="btn btn-sm nav-btn d-flex flex-column align-items-center gap-1 mb-2 mt-2"
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
		border-radius: 15px;
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

</style>
