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

	// User settings (loaded from localStorage in onMount)
	let userName = $state('');
	let darkMode = $state(false);

	// Tasks sub-view: 'list' | 'new' | 'import' | 'edit'
	let taskSubView = $state('list');
	let taskSortBy = $state('priority');
	let taskFilterModule = $state('');
	let showOnlyOpen = $state(false);

	let taskForm = $state({ title: '', module: '', dueDate: '', duration: 25, priority: '3', notes: '' });

	let editingTaskId = $state('');
	let editTaskForm = $state({ title: '', module: '', dueDate: '', duration: 25, priority: '3', notes: '' });

	let deadlineInput = $state('');
	let extractedDeadlines = $state([]);
	let editingDeadlineIdx = $state(-1);
	let editingDeadlineData = $state({ title: '', module: '', dueDate: '', priority: '3' });
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

	const filteredSortedTasks = $derived.by(() => {
		let list = showOnlyOpen ? openTasks : tasks;
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

	// Per-module stats for progress tab
	const moduleStats = $derived.by(() => {
		return modules.map((mod, idx) => {
			const modTasks = tasks.filter((t) => t.module === mod);
			const modDone = modTasks.filter((t) => t.status === 'erledigt').length;
			const pct = modTasks.length ? Math.round((modDone / modTasks.length) * 100) : 0;
			return { mod, total: modTasks.length, done: modDone, pct, color: MODULE_COLORS[idx % MODULE_COLORS.length] };
		});
	});

	const filteredCompletedTasks = $derived.by(() => {
		if (!progressFilterModule) return completedTasks;
		return completedTasks.filter((t) => t.module === progressFilterModule);
	});

	function getModuleColor(mod) {
		if (!mod) return '#6b7280';
		const idx = modules.indexOf(mod);
		if (idx === -1) return '#6b7280';
		return MODULE_COLORS[idx % MODULE_COLORS.length];
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

	async function refreshData() {
		loading = true;
		error = '';
		try {
			const [tasksData, reflectionsData] = await Promise.all([
				api('/api/tasks'),
				api('/api/reflections')
			]);
			tasks = tasksData.map((t) => ({ ...t, _id: String(t._id) }));
			reflections = reflectionsData.map((r) => ({ ...r, _id: String(r._id) }));
			if (!selectedTaskId && tasks.length > 0) selectedTaskId = tasks[0]._id;
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	async function createTask() {
		error = '';
		try {
			await api('/api/tasks', { method: 'POST', body: JSON.stringify(taskForm) });
			taskForm = { title: '', module: '', dueDate: '', duration: 25, priority: '3', notes: '' };
			taskSubView = 'list';
			await refreshData();
		} catch (e) {
			error = e.message;
		}
	}

	function startEditTask(task) {
		editingTaskId = task._id;
		editTaskForm = {
			title: task.title,
			module: task.module || '',
			dueDate: task.dueDate || '',
			duration: task.duration || 25,
			priority: task.priority || '3',
			notes: task.notes || ''
		};
		taskSubView = 'edit';
	}

	async function updateTask() {
		error = '';
		try {
			await api(`/api/tasks/${editingTaskId}`, {
				method: 'PATCH',
				body: JSON.stringify(editTaskForm)
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
			await refreshData();
		} catch (e) {
			error = e.message;
		}
	}

	async function deleteTask(taskId) {
		if (!window.confirm('Aufgabe wirklich löschen?')) return;
		try {
			await api(`/api/tasks/${taskId}`, { method: 'DELETE' });
			await refreshData();
		} catch (e) {
			error = e.message;
		}
	}

	async function extractDeadlines() {
		error = '';
		deadlineSuccess = '';
		try {
			const payload = await api('/api/deadlines/extract', {
				method: 'POST',
				body: JSON.stringify({ text: deadlineInput })
			});
			extractedDeadlines = payload.items || [];
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
		if (!semesterplanImageBase64) { error = 'Bitte zuerst eine Datei auswählen.'; return; }
		ocrLoading = true;
		try {
			const payload = await api('/api/deadlines/ocr', {
				method: 'POST',
				body: JSON.stringify({ imageBase64: semesterplanImageBase64, mimeType: semesterplanMimeType })
			});
			extractedDeadlines = payload.items || [];
			deadlineSuccess = extractedDeadlines.length
				? `${extractedDeadlines.length} Deadline(s) per OCR erkannt.`
				: 'Keine Deadline gefunden.';
		} catch (e) {
			error = e.message;
		} finally {
			ocrLoading = false;
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
			await api('/api/tasks', {
				method: 'POST',
				body: JSON.stringify({
					title: item.title,
					module: item.module,
					dueDate: item.dueDate,
					duration: 45,
					priority: item.priority || '3'
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
		const items = [...extractedDeadlines];
		let added = 0;
		for (const item of items) {
			try {
				await api('/api/tasks', {
					method: 'POST',
					body: JSON.stringify({
						title: item.title,
						module: item.module,
						dueDate: item.dueDate,
						duration: 45,
						priority: item.priority || '3'
					})
				});
				added++;
			} catch (e) {
				// Continue with remaining items
			}
		}
		extractedDeadlines = [];
		await refreshData();
		deadlineSuccess = `${added} Aufgabe(n) übernommen.`;
		adoptingAll = false;
	}

	function removeDeadline(idx) {
		extractedDeadlines = extractedDeadlines.filter((_, i) => i !== idx);
	}

	function removeAllDeadlines() {
		extractedDeadlines = [];
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
			if (selectedTask && focusHasStarted && focusSecondsLeft < 25 * 60) {
				await setTaskStatus(selectedTask, 'in Bearbeitung');
			}
		}
	}

	function resetFocus() {
		stopFocus();
		focusSecondsLeft = 25 * 60;
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
		const elapsedMinutes = Math.max(1, Math.round((25 * 60 - focusSecondsLeft) / 60));
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

	function saveSettings() {
		localStorage.setItem('userName', userName);
		localStorage.setItem('darkMode', String(darkMode));
	}

	$effect(() => {
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute('data-bs-theme', darkMode ? 'dark' : 'light');
		}
	});

	onMount(() => {
		userName = localStorage.getItem('userName') || '';
		darkMode = localStorage.getItem('darkMode') === 'true';
		refreshData();
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
					<div class="d-flex gap-2 mb-3">
						<button class="btn btn-primary rounded-pill flex-grow-1" onclick={() => (taskSubView = 'new')}>
							<i class="bi bi-plus-lg me-1"></i>Neue Aufgabe
						</button>
						<button class="btn btn-outline-primary rounded-pill flex-grow-1" onclick={() => (taskSubView = 'import')}>
							<i class="bi bi-upload me-1"></i>Semesterplan
						</button>
					</div>

					<!-- Sort & Filter -->
					<div class="d-flex gap-2 mb-3 align-items-center flex-wrap">
						<select class="form-select form-select-sm rounded-pill" style="width: auto;" bind:value={taskSortBy}>
							<option value="priority">Sortierung: Priorität</option>
							<option value="dueDate">Sortierung: Deadline</option>
							<option value="duration">Sortierung: Dauer</option>
						</select>
						<select class="form-select form-select-sm rounded-pill" style="width: auto;" bind:value={taskFilterModule}>
							<option value="">Alle Module</option>
							{#each modules as mod}
								<option value={mod}>{mod}</option>
							{/each}
						</select>
						<button
							class={`btn btn-sm rounded-pill ${showOnlyOpen ? 'btn-primary' : 'btn-outline-secondary'}`}
							onclick={() => (showOnlyOpen = !showOnlyOpen)}
						>
							{showOnlyOpen ? 'Nur offene' : 'Alle'}
						</button>
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
									<div class="d-flex gap-2 mt-2 flex-wrap">
										<button class="btn btn-sm btn-outline-primary rounded-pill" onclick={() => startEditTask(task)}>
											Bearbeiten
										</button>
										<button
											class="btn btn-sm btn-outline-success rounded-pill"
											onclick={() => setTaskStatus(task, task.status === 'erledigt' ? 'offen' : 'erledigt')}
										>
											{task.status === 'erledigt' ? 'Wieder öffnen' : 'Als erledigt markieren'}
										</button>
										<button class="btn btn-sm btn-outline-danger rounded-pill" onclick={() => deleteTask(task._id)}>
											Löschen
										</button>
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
									<input
										id="new-module"
										class="form-control rounded-3"
										list="modules-datalist"
										bind:value={taskForm.module}
										placeholder="Prototyping"
										autocomplete="off"
									/>
									<datalist id="modules-datalist">
										{#each modules as mod}
											<option value={mod}></option>
										{/each}
									</datalist>
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
									<input
										id="edit-module"
										class="form-control rounded-3"
										list="modules-datalist-edit"
										bind:value={editTaskForm.module}
										autocomplete="off"
									/>
									<datalist id="modules-datalist-edit">
										{#each modules as mod}
											<option value={mod}></option>
										{/each}
									</datalist>
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
								disabled={adoptingAll}
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
												<label class="form-label small" for={`dl-module-${idx}`}>Modul</label>
												<input id={`dl-module-${idx}`} class="form-control form-control-sm rounded-3" bind:value={editingDeadlineData.module} />
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
											{item.module || '—'} · {item.dueDate ? formatDate(item.dueDate) : 'Kein Datum'}
											· Prio {item.priority || '3'}
										</p>
										<div class="d-flex gap-2 flex-wrap">
											<button class="btn btn-sm btn-success rounded-pill" onclick={() => addDeadlineAsTask(item, idx)}>
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
				<div class="card rounded-4 border-0 shadow-sm mb-3">
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
							<button class="btn btn-primary rounded-pill px-4" onclick={startFocus}>Start</button>
							<button class="btn btn-outline-secondary rounded-pill px-4" onclick={pauseFocus}>Pause</button>
							<button class="btn btn-outline-dark rounded-pill px-4" onclick={resetFocus}>Reset</button>
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
				<h2 class="h5 mb-3">Mein Fortschritt</h2>

				<div class="row g-2 mb-3">
					<div class="col-6">
						<div class="card metric-card rounded-4 text-center">
							<div class="card-body py-3">
								<p class="small text-secondary mb-1">Aufgaben</p>
								<p class="h5 mb-0">{completedTasks.length} / {tasks.length}</p>
							</div>
						</div>
					</div>
					<div class="col-6">
						<div class="card metric-card rounded-4 text-center">
							<div class="card-body py-3">
								<p class="small text-secondary mb-1">Fokuszeit gesamt</p>
								<p class="h5 mb-0">{totalFocusMinutes} min</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Weekly chart -->
				<div class="card rounded-4 border-0 shadow-sm mb-3">
					<div class="card-body">
						<h3 class="h6 mb-3">Erledigte Aufgaben diese Woche</h3>
						<div class="d-flex align-items-end gap-1" style="height: 72px;">
							{#each weeklyData as day}
								<div class="flex-grow-1 d-flex flex-column align-items-center gap-1">
									<div
										class={`rounded-top w-100 ${day.isToday ? 'bg-primary' : 'bg-secondary bg-opacity-25'}`}
										style="height: {Math.max(4, Math.round((day.count / maxWeeklyCount) * 52))}px; transition: height 0.3s;"
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
				{#if moduleStats.length > 0}
					<div class="card rounded-4 border-0 shadow-sm mb-3">
						<div class="card-body">
							<h3 class="h6 mb-3">Fortschritt nach Modul</h3>
							{#each moduleStats as stat}
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
								{#each modules as mod}
									<option value={mod}>{mod}</option>
								{/each}
							</select>
						</div>
						{#if filteredCompletedTasks.length === 0}
							<p class="small text-secondary mb-0">Noch keine Aufgaben abgeschlossen.</p>
						{:else}
							{#each filteredCompletedTasks as task}
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
										onchange={saveSettings}
										style="width: 2.5em; height: 1.25em;"
									/>
									<label class="form-check-label visually-hidden" for="dark-mode-toggle">Dark Mode</label>
								</div>
							</div>
						</div>

						<button class="btn btn-primary rounded-pill w-100" onclick={saveSettings}>
							<i class="bi bi-check-lg me-1"></i>Einstellungen speichern
						</button>
					</div>
				</div>

				<div class="card rounded-4 border-0 shadow-sm">
					<div class="card-body">
						<h3 class="h6 mb-2">Über StudySprint</h3>
						<p class="small text-secondary mb-2">Prototyp für Einzelarbeit (ZHAW Prototyping Modul).</p>
						<ul class="small text-secondary mb-0">
							<li>Stack: SvelteKit + MongoDB</li>
							<li>KI-Einsatz: Gemini OCR für Semesterplan-Import</li>
						</ul>
					</div>
				</div>
			{/if}
		</section>

		<nav class="bottom-nav fixed-bottom bg-white border-top py-2 px-2">
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
