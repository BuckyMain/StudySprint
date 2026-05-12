<script>
	import { onDestroy } from 'svelte';

	const tabs = ['home', 'tasks', 'focus', 'progress', 'validate', 'profile'];
	const priorities = ['Hoch', 'Mittel', 'Niedrig'];
	const focusRatings = ['Sehr fokussiert', 'Okay', 'Abgelenkt'];

	let activeTab = $state('home');
	let isUnlocked = $state(false);
	let password = $state('');
	let authError = $state('');

	let loading = $state(false);
	let error = $state('');

	let tasks = $state([]);
	let sessions = $state([]);
	let reflections = $state([]);

	let taskForm = $state({
		title: '',
		module: '',
		dueDate: '',
		duration: 25,
		priority: 'Mittel'
	});

	let sessionForm = $state({
		topic: '',
		module: '',
		startsAt: '',
		duration: 25
	});

	let deadlineInput = $state('');
	let extractedDeadlines = $state([]);
	let semesterplanFileName = $state('');
	let semesterplanImageBase64 = $state('');
	let semesterplanMimeType = $state('');
	let ocrLoading = $state(false);
	let calendarFillLoading = $state(false);
	let deadlineSuccess = $state('');

	let selectedTaskId = $state('');
	let focusSecondsLeft = $state(25 * 60);
	let isFocusRunning = $state(false);
	let focusTimerHandle = null;

	let reflectionRating = $state('Okay');
	let reflectionNote = $state('');

	const completedTasks = $derived(tasks.filter((task) => task.status === 'erledigt'));
	const openTasks = $derived(tasks.filter((task) => task.status !== 'erledigt'));
	const finishedSessions = $derived(sessions.filter((session) => session.status === 'abgeschlossen'));
	const totalFocusMinutes = $derived(
		reflections.reduce((total, item) => total + Number(item.focusMinutes || 0), 0)
	);

	const selectedTask = $derived(tasks.find((task) => task._id === selectedTaskId) ?? null);
	const nextSession = $derived(
		[...sessions]
			.filter((session) => session.status !== 'abgeschlossen')
			.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))[0] ?? null
	);

	async function api(path, options = {}) {
		const response = await fetch(path, {
			headers: { 'content-type': 'application/json', ...(options.headers || {}) },
			...options
		});

		if (response.status === 401) {
			isUnlocked = false;
			throw new Error('Bitte zuerst entsperren.');
		}

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

	async function unlockApp() {
		authError = '';
		try {
			await api('/api/auth/unlock', {
				method: 'POST',
				body: JSON.stringify({ password })
			});
			isUnlocked = true;
			password = '';
			await refreshData();
		} catch (unlockError) {
			authError = unlockError.message;
		}
	}

	async function logoutApp() {
		await fetch('/api/auth/logout', { method: 'POST' });
		isUnlocked = false;
	}

	async function refreshData() {
		loading = true;
		error = '';
		try {
			const [tasksData, sessionsData, reflectionsData] = await Promise.all([
				api('/api/tasks'),
				api('/api/sessions'),
				api('/api/reflections')
			]);

			tasks = tasksData.map((item) => ({ ...item, _id: String(item._id) }));
			sessions = sessionsData.map((item) => ({ ...item, _id: String(item._id) }));
			reflections = reflectionsData.map((item) => ({ ...item, _id: String(item._id) }));

			if (!selectedTaskId && tasks.length > 0) {
				selectedTaskId = tasks[0]._id;
			}
		} catch (fetchError) {
			error = fetchError.message;
		} finally {
			loading = false;
		}
	}

	async function createTask() {
		error = '';
		try {
			await api('/api/tasks', {
				method: 'POST',
				body: JSON.stringify(taskForm)
			});
			taskForm = { title: '', module: '', dueDate: '', duration: 25, priority: 'Mittel' };
			await refreshData();
		} catch (createError) {
			error = createError.message;
		}
	}

	async function editTask(task) {
		const title = window.prompt('Titel', task.title);
		if (title === null) return;
		const module = window.prompt('Modul', task.module);
		if (module === null) return;
		const priority = window.prompt('Priorität: Hoch / Mittel / Niedrig', task.priority);
		if (priority === null) return;

		try {
			await api(`/api/tasks/${task._id}`, {
				method: 'PATCH',
				body: JSON.stringify({ title, module, priority })
			});
			await refreshData();
		} catch (editError) {
			error = editError.message;
		}
	}

	async function setTaskStatus(task, status) {
		try {
			await api(`/api/tasks/${task._id}`, {
				method: 'PATCH',
				body: JSON.stringify({ status })
			});
			await refreshData();
		} catch (statusError) {
			error = statusError.message;
		}
	}

	async function deleteTask(taskId) {
		if (!window.confirm('Aufgabe wirklich löschen?')) return;
		try {
			await api(`/api/tasks/${taskId}`, { method: 'DELETE' });
			await refreshData();
		} catch (deleteError) {
			error = deleteError.message;
		}
	}

	async function createSession() {
		error = '';
		try {
			await api('/api/sessions', {
				method: 'POST',
				body: JSON.stringify(sessionForm)
			});
			sessionForm = { topic: '', module: '', startsAt: '', duration: 25 };
			await refreshData();
		} catch (createError) {
			error = createError.message;
		}
	}

	async function patchSession(sessionId, patch) {
		try {
			await api(`/api/sessions/${sessionId}`, {
				method: 'PATCH',
				body: JSON.stringify(patch)
			});
			await refreshData();
		} catch (patchError) {
			error = patchError.message;
		}
	}

	async function deleteSession(sessionId) {
		if (!window.confirm('Session wirklich löschen?')) return;
		try {
			await api(`/api/sessions/${sessionId}`, { method: 'DELETE' });
			await refreshData();
		} catch (deleteError) {
			error = deleteError.message;
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
		} catch (extractError) {
			error = extractError.message;
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
			if (!match) {
				error = 'Datei konnte nicht gelesen werden.';
				return;
			}
			semesterplanMimeType = match[1];
			semesterplanImageBase64 = match[2];
			semesterplanFileName = file.name;
		};
		reader.onerror = () => {
			error = 'Datei konnte nicht gelesen werden.';
		};
		reader.readAsDataURL(file);
	}

	async function extractDeadlinesWithOcr() {
		error = '';
		deadlineSuccess = '';
		if (!semesterplanImageBase64) {
			error = 'Bitte zuerst ein Semesterplan-Bild auswaehlen.';
			return;
		}
		ocrLoading = true;
		try {
			const payload = await api('/api/deadlines/ocr', {
				method: 'POST',
				body: JSON.stringify({
					imageBase64: semesterplanImageBase64,
					mimeType: semesterplanMimeType
				})
			});
			extractedDeadlines = payload.items || [];
			deadlineSuccess = extractedDeadlines.length
				? `${extractedDeadlines.length} Deadline(s) per OCR erkannt.`
				: 'OCR abgeschlossen, aber keine Deadline gefunden.';
		} catch (ocrError) {
			error = ocrError.message;
		} finally {
			ocrLoading = false;
		}
	}

	async function addDeadlineAsTask(item) {
		try {
			await api('/api/tasks', {
				method: 'POST',
				body: JSON.stringify({
					title: item.title,
					module: item.module,
					dueDate: item.dueDate,
					duration: 45,
					priority: item.priority
				})
			});
			await refreshData();
		} catch (addError) {
			error = addError.message;
		}
	}


	async function autoFillCalendarFromDeadlines() {
		error = '';
		deadlineSuccess = '';
		if (extractedDeadlines.length === 0) {
			error = 'Keine Deadlines vorhanden.';
			return;
		}
		calendarFillLoading = true;
		try {
			const existing = new Set(sessions.map((session) => `${session.topic}|${session.startsAt || ''}`));
			let createdCount = 0;
			for (const item of extractedDeadlines) {
				const startsAt = `${item.dueDate}T09:00`;
				const topic = `Deadline Vorbereitung: ${item.title}`;
				const key = `${topic}|${startsAt}`;
				if (existing.has(key)) continue;
				await api('/api/sessions', {
					method: 'POST',
					body: JSON.stringify({
						topic,
						module: item.module,
						startsAt,
						duration: 45,
						status: 'geplant'
					})
				});
				existing.add(key);
				createdCount += 1;
			}
			await refreshData();
			deadlineSuccess = createdCount
				? `${createdCount} Session(s) automatisch in den Kalender eingetragen.`
				: 'Keine neuen Sessions angelegt (bereits vorhanden).';
		} catch (calendarError) {
			error = calendarError.message;
		} finally {
			calendarFillLoading = false;
		}
	}

	function startFocus() {
		if (!selectedTask) {
			error = 'Bitte zuerst eine Aufgabe auswählen.';
			return;
		}

		if (isFocusRunning) return;
		isFocusRunning = true;
		focusTimerHandle = setInterval(() => {
			if (focusSecondsLeft <= 1) {
				stopFocus();
				focusSecondsLeft = 0;
				return;
			}
			focusSecondsLeft -= 1;
		}, 1000);
	}

	function pauseFocus() {
		if (!isFocusRunning) return;
		stopFocus();
	}

	function resetFocus() {
		stopFocus();
		focusSecondsLeft = 25 * 60;
	}

	function stopFocus() {
		isFocusRunning = false;
		if (focusTimerHandle) {
			clearInterval(focusTimerHandle);
			focusTimerHandle = null;
		}
	}

	function formatSeconds(totalSeconds) {
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
	}

	function formatDateTime(value) {
		if (!value) return 'Keine Zeit gesetzt';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return value;
		return date.toLocaleString('de-CH');
	}

	async function completeFocusSession() {
		if (!selectedTask) {
			error = 'Keine aktive Aufgabe vorhanden.';
			return;
		}

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
		} catch (completeError) {
			error = completeError.message;
		}
	}

	onDestroy(() => {
		stopFocus();
	});
</script>

<svelte:head>
	<title>StudySprint Prototyp</title>
	<meta
		name="description"
		content="StudySprint Prototyp mit Aufgaben, Sessions, Fokus-Timer, Reflexion und Semesterplan-Import."
	/>
</svelte:head>

<main class="app-shell">
	<header class="p-3 pb-2">
		<div class="hero-gradient rounded-4 p-3 shadow-sm">
			<div class="d-flex justify-content-between align-items-start">
				<div>
					<h1 class="h4 mb-1">StudySprint</h1>
				</div>
			</div>
		</div>
	</header>

	{#if !isUnlocked}
		<section class="px-3 pb-4">
			<div class="card rounded-4 border-0 shadow-sm">
				<div class="card-body">
					<h2 class="h5 mb-2">App entsperren</h2>
					<p class="small text-secondary mb-3">
					     Setze optional <code>APP_PASSWORD</code> in deiner .env.
					</p>
					<div class="mb-3">
						<label class="form-label small" for="unlock-password">Passwort</label>
						<input
							id="unlock-password"
							class="form-control rounded-3"
							type="password"
							bind:value={password}
							placeholder="Passwort eingeben"
						/>
					</div>
					{#if authError}
						<div class="alert alert-danger py-2 small mb-3">{authError}</div>
					{/if}
					<button class="btn btn-primary rounded-pill w-100" onclick={unlockApp}>Entsperren</button>
				</div>
			</div>
		</section>
	{:else}
		<section class="px-3 pb-4">
			{#if loading}
				<div class="alert alert-info py-2 small">Daten werden geladen...</div>
			{/if}
			{#if error}
				<div class="alert alert-danger py-2 small">{error}</div>
			{/if}

			{#if activeTab === 'home'}
				<div class="row g-2 mb-3">
					<div class="col-6">
						<div class="card metric-card rounded-4">
							<div class="card-body">
								<p class="text-secondary small mb-1">Nächste Session</p>
								<p class="fw-semibold mb-0">{nextSession ? formatDateTime(nextSession.startsAt) : 'Keine'}</p>
							</div>
						</div>
					</div>
					<div class="col-6">
						<div class="card metric-card rounded-4">
							<div class="card-body">
								<p class="text-secondary small mb-1">Offene Aufgaben</p>
								<p class="fw-semibold mb-0">{openTasks.length}</p>
							</div>
						</div>
					</div>
				</div>

				<div class="card rounded-4 border-0 shadow-sm mb-3">
					<div class="card-body">
						<h3 class="h6 mb-2">Priorität heute</h3>
						{#if openTasks.length > 0}
							<p class="mb-1 fw-semibold">{openTasks[0].title}</p>
							<p class="small text-secondary mb-0">
								{openTasks[0].module} · {openTasks[0].duration} min · {openTasks[0].priority}
							</p>
						{:else}
							<p class="small text-secondary mb-0">Keine offenen Aufgaben.</p>
						{/if}
					</div>
				</div>

				<div class="card rounded-4 border-0 shadow-sm">
					<div class="card-body">
						<h3 class="h6 mb-3">Quick Actions</h3>
						<div class="d-grid gap-2">
							<a class="btn btn-outline-secondary rounded-pill" href="/tasks">
								<i class="bi bi-kanban me-2"></i>Task Seitenansicht
							</a>
							<button class="btn btn-primary rounded-pill" onclick={() => (activeTab = 'tasks')}>
								<i class="bi bi-plus-lg me-2"></i>Aufgabe erstellen
							</button>
							<button class="btn btn-outline-primary rounded-pill" onclick={() => (activeTab = 'focus')}>
								<i class="bi bi-play-circle me-2"></i>Fokusmodus starten
							</button>
							<button class="btn btn-outline-dark rounded-pill" onclick={() => (activeTab = 'validate')}>
								<i class="bi bi-clipboard-check me-2"></i>Validation Notizen
							</button>
						</div>
					</div>
				</div>
			{/if}

			{#if activeTab === 'tasks'}
				<div class="card rounded-4 border-0 shadow-sm mb-3">
					<div class="card-body">
						<h2 class="h5 mb-3">Neue Aufgabe</h2>
						<div class="row g-2">
							<div class="col-12">
								<input class="form-control rounded-3" placeholder="Titel" bind:value={taskForm.title} />
							</div>
							<div class="col-6">
								<input class="form-control rounded-3" placeholder="Modul" bind:value={taskForm.module} />
							</div>
							<div class="col-6">
								<input class="form-control rounded-3" type="date" bind:value={taskForm.dueDate} />
							</div>
							<div class="col-6">
								<input class="form-control rounded-3" type="number" min="10" bind:value={taskForm.duration} />
							</div>
							<div class="col-6">
								<select class="form-select rounded-3" bind:value={taskForm.priority}>
									{#each priorities as priority}
										<option>{priority}</option>
									{/each}
								</select>
							</div>
							<div class="col-12">
								<button class="btn btn-primary rounded-pill w-100" onclick={createTask}>Speichern</button>
							</div>
						</div>
					</div>
				</div>

				<div class="card rounded-4 border-0 shadow-sm mb-3">
					<div class="card-body">
						<h3 class="h6 mb-2">Semesterplan Import (Gemini OCR)</h3>
						<p class="small text-secondary mb-2">
							Text aus PDF einfügen. Deadlines werden automatisch erkannt und als Aufgaben übernommen.
						</p>
						<div class="mb-2">
							<label class="form-label small" for="semesterplan-file">Semesterplan Datei (Bild/PDF)</label>
							<input
								id="semesterplan-file"
								class="form-control rounded-3"
								type="file"
								accept="image/*,application/pdf"
								onchange={handleSemesterplanFile}
							/>
							{#if semesterplanFileName}
								<p class="small text-secondary mt-1 mb-0">Ausgewaehlt: {semesterplanFileName}</p>
							{/if}
						</div>
						<div class="d-grid gap-2 mb-2">
							<button class="btn btn-outline-primary rounded-pill w-100" onclick={extractDeadlinesWithOcr} disabled={ocrLoading}>
								{ocrLoading ? 'OCR laeuft...' : 'OCR aus Datei starten'}
							</button>
						</div>
						<textarea
							class="form-control rounded-3 mb-2"
							rows="3"
							placeholder="z.B. Prototyping Abgabe 21.06.2026"
							bind:value={deadlineInput}
						></textarea>
						<button class="btn btn-outline-primary rounded-pill w-100 mb-2" onclick={extractDeadlines}>
							Deadlines extrahieren
						</button>
						{#if deadlineSuccess}
							<div class="alert alert-success py-2 small">{deadlineSuccess}</div>
						{/if}
						{#if extractedDeadlines.length > 0}
							<button
								class="btn btn-success rounded-pill w-100 mb-2"
								onclick={autoFillCalendarFromDeadlines}
								disabled={calendarFillLoading}>
								{calendarFillLoading ? 'Kalender wird befuellt...' : 'Kalender automatisch befuellen'}
							</button>
							<div class="small">
								{#each extractedDeadlines as item}
									<div class="border rounded-3 p-2 mb-2">
										<p class="mb-1 fw-semibold">{item.title}</p>
										<p class="mb-1 text-secondary">{item.module} · {item.dueDate}</p>
										<button class="btn btn-sm btn-success rounded-pill" onclick={() => addDeadlineAsTask(item)}>
											Als Aufgabe übernehmen
										</button>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<h3 class="h6 mb-2">Aufgabenliste</h3>
				{#if tasks.length === 0}
					<p class="small text-secondary">Noch keine Aufgaben.</p>
				{:else}
					{#each tasks as task}
						<div class="card rounded-4 border-0 shadow-sm mb-2">
							<div class="card-body">
								<div class="d-flex justify-content-between">
									<div>
										<p class="fw-semibold mb-1">{task.title}</p>
										<p class="small text-secondary mb-0">
											{task.module} · {task.duration} min · {task.priority}
											{task.dueDate ? ` · fällig ${task.dueDate}` : ''}
										</p>
									</div>
									<span class={`badge ${task.status === 'erledigt' ? 'text-bg-success' : 'text-bg-secondary'}`}>
										{task.status}
									</span>
								</div>
								<div class="d-flex gap-2 mt-2">
									<button class="btn btn-sm btn-outline-primary rounded-pill" onclick={() => editTask(task)}>
										Bearbeiten
									</button>
									<button
										class="btn btn-sm btn-outline-success rounded-pill"
										onclick={() => setTaskStatus(task, task.status === 'erledigt' ? 'offen' : 'erledigt')}
									>
										{task.status === 'erledigt' ? 'Wieder offen' : 'Erledigt'}
									</button>
									<button class="btn btn-sm btn-outline-danger rounded-pill" onclick={() => deleteTask(task._id)}>
										Löschen
									</button>
								</div>
							</div>
						</div>
					{/each}
				{/if}

				<div class="card rounded-4 border-0 shadow-sm mt-3">
					<div class="card-body">
						<h3 class="h6 mb-3">Session planen</h3>
						<div class="row g-2">
							<div class="col-12">
								<input class="form-control rounded-3" placeholder="Thema" bind:value={sessionForm.topic} />
							</div>
							<div class="col-6">
								<input class="form-control rounded-3" placeholder="Modul" bind:value={sessionForm.module} />
							</div>
							<div class="col-6">
								<input class="form-control rounded-3" type="number" min="10" bind:value={sessionForm.duration} />
							</div>
							<div class="col-12">
								<input class="form-control rounded-3" type="datetime-local" bind:value={sessionForm.startsAt} />
							</div>
							<div class="col-12">
								<button class="btn btn-outline-primary rounded-pill w-100" onclick={createSession}>
									Session speichern
								</button>
							</div>
						</div>
						<hr />
						{#if sessions.length === 0}
							<p class="small text-secondary mb-0">Noch keine Sessions geplant.</p>
						{:else}
							{#each sessions as session}
								<div class="border rounded-3 p-2 mb-2">
									<p class="fw-semibold mb-1">{session.topic}</p>
									<p class="small text-secondary mb-2">
										{session.module} · {formatDateTime(session.startsAt)} · {session.duration} min
									</p>
									<div class="d-flex gap-2">
										<button
											class="btn btn-sm btn-outline-success rounded-pill"
											onclick={() => patchSession(session._id, { status: 'abgeschlossen' })}
										>
											Abgeschlossen
										</button>
										<button
											class="btn btn-sm btn-outline-secondary rounded-pill"
											onclick={() => patchSession(session._id, { status: 'geplant' })}
										>
											Geplant
										</button>
										<button class="btn btn-sm btn-outline-danger rounded-pill" onclick={() => deleteSession(session._id)}>
											Löschen
										</button>
									</div>
								</div>
							{/each}
						{/if}
					</div>
				</div>
			{/if}

			{#if activeTab === 'focus'}
				<div class="card rounded-4 border-0 shadow-sm mb-3">
					<div class="card-body text-center">
						<h2 class="h5 mb-3">Fokus Session</h2>
						<div class="mb-3">
							<label class="form-label small" for="selected-task">Aktive Aufgabe</label>
							<select id="selected-task" class="form-select rounded-3" bind:value={selectedTaskId}>
								<option value="">Bitte wählen</option>
								{#each openTasks as task}
									<option value={task._id}>{task.title}</option>
								{/each}
							</select>
						</div>
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
						<h3 class="h6 mb-3">Session-Abschluss / Reflexion</h3>
						<div class="mb-2">
							<label class="form-label small" for="focus-rating">Wie fokussiert warst du?</label>
							<select id="focus-rating" class="form-select rounded-3" bind:value={reflectionRating}>
								{#each focusRatings as rating}
									<option>{rating}</option>
								{/each}
							</select>
						</div>
						<div class="mb-3">
							<label class="form-label small" for="focus-note">Kurze Notiz</label>
							<textarea
								id="focus-note"
								class="form-control rounded-3"
								rows="3"
								placeholder="Was hat gut funktioniert?"
								bind:value={reflectionNote}
							></textarea>
						</div>
						<button class="btn btn-success rounded-pill w-100" onclick={completeFocusSession}>
							Session abschliessen
						</button>
					</div>
				</div>
			{/if}

			{#if activeTab === 'progress'}
				<h2 class="h5 mb-3">Fortschritt</h2>
				<div class="row g-2 mb-3">
					<div class="col-4">
						<div class="card metric-card rounded-4 text-center">
							<div class="card-body py-3">
								<p class="small text-secondary mb-1">Tasks</p>
								<p class="h5 mb-0">{completedTasks.length}/{tasks.length}</p>
							</div>
						</div>
					</div>
					<div class="col-4">
						<div class="card metric-card rounded-4 text-center">
							<div class="card-body py-3">
								<p class="small text-secondary mb-1">Sessions</p>
								<p class="h5 mb-0">{finishedSessions.length}</p>
							</div>
						</div>
					</div>
					<div class="col-4">
						<div class="card metric-card rounded-4 text-center">
							<div class="card-body py-3">
								<p class="small text-secondary mb-1">Fokuszeit</p>
								<p class="h5 mb-0">{totalFocusMinutes}m</p>
							</div>
						</div>
					</div>
				</div>

				<div class="card rounded-4 border-0 shadow-sm">
					<div class="card-body">
						<h3 class="h6 mb-3">Letzte Reflexionen</h3>
						{#if reflections.length === 0}
							<p class="small text-secondary mb-0">Noch keine Reflexionen gespeichert.</p>
						{:else}
							{#each reflections.slice(0, 5) as reflection}
								<div class="border-bottom pb-2 mb-2">
									<p class="fw-semibold mb-1">{reflection.rating} · {reflection.focusMinutes} min</p>
									<p class="small text-secondary mb-0">{reflection.note || 'Ohne Notiz'}</p>
								</div>
							{/each}
						{/if}
					</div>
				</div>
			{/if}

			{#if activeTab === 'validate'}
				<div class="card rounded-4 border-0 shadow-sm">
					<div class="card-body">
						<h2 class="h5 mb-3">Validate / User Testing</h2>
						<p class="small text-secondary mb-3">
							Diese Ansicht hilft dir fürs Modul bei Beobachtungen, Kennzahlen und Ableitung von Verbesserungen.
						</p>
						<ul class="small mb-0">
							<li>Testperson schafft "Aufgabe erstellen" in unter 30 Sekunden.</li>
							<li>Mindestens 1 Fokus-Session inklusive Reflexion wird durchgeführt.</li>
							<li>Pain points notieren: unklare Labels, fehlendes Feedback, zu viele Klicks.</li>
							<li>Verbesserungsvorschlag direkt als GitHub Issue dokumentieren.</li>
						</ul>
					</div>
				</div>
			{/if}

			{#if activeTab === 'profile'}
				<div class="card rounded-4 border-0 shadow-sm">
					<div class="card-body">
						<h2 class="h5 mb-3">Profil & Settings</h2>
						<p class="small text-secondary mb-2">Prototyp für Einzelarbeit (ZHAW Prototyping Modul).</p>
						<ul class="small text-secondary">
							<li>Stack: SvelteKit + MongoDB</li>
							<li>KI-Einsatz: transparenter Einsatz dokumentieren</li>
							<li>Deployment: online verfügbar machen</li>
						</ul>
						<button class="btn btn-outline-danger rounded-pill w-100 mt-2" onclick={logoutApp}>
							App sperren
						</button>
					</div>
				</div>
			{/if}
		</section>

		<nav class="bottom-nav fixed-bottom bg-white border-top py-2 px-2">
			<div class="d-flex justify-content-around flex-wrap">
				{#each tabs as tab}
					<button
						class="btn btn-sm nav-btn d-flex flex-column align-items-center gap-1"
						class:btn-primary={activeTab === tab}
						class:btn-light={activeTab !== tab}
						onclick={() => (activeTab = tab)}
					>
						{#if tab === 'home'}<i class="bi bi-house"></i>{/if}
						{#if tab === 'tasks'}<i class="bi bi-list-check"></i>{/if}
						{#if tab === 'focus'}<i class="bi bi-stopwatch"></i>{/if}
						{#if tab === 'progress'}<i class="bi bi-bar-chart"></i>{/if}
						{#if tab === 'validate'}<i class="bi bi-clipboard-check"></i>{/if}
						{#if tab === 'profile'}<i class="bi bi-person"></i>{/if}
						<span class="small">{tab}</span>
					</button>
				{/each}
			</div>
		</nav>
	{/if}
</main>
