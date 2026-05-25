<script>
	let {
		activeSemester,
		taskSubView = $bindable('list'),
		openNewTaskForm,
		taskSortBy = $bindable('dueDate'),
		taskFilterModule = $bindable(''),
		taskFilterModules = [],
		taskFilterStatus = $bindable('open'),
		filteredSortedTasks = [],
		getModuleColor,
		priorityBadgeClassNeutral,
		statusBadgeClass,
		statusLabel,
		formatDate,
		isTaskNoteExpanded,
		openFocusForTask,
		startEditTask,
		setTaskStatus,
		deletingTaskId = null,
		deleteTask,
		cancelDeleteTask,
		confirmDeleteTask,
		isTaskNoteLong,
		toggleTaskNote,
		createTask,
		taskForm = $bindable({}),
		creatingTaskModule = $bindable(false),
		taskFormNewModuleName = $bindable(''),
		taskFormNewModuleColor = $bindable('#2563eb'),
		activeModules = [],
		allModuleNames = [],
		priorities = [],
		priorityLabels = {},
		updateTask,
		editTaskForm = $bindable({}),
		importAnalysisLoading = false,
		importAnalysisSource = '',
		handleSemesterplanFile,
		extractDeadlinesWithOcr,
		ocrLoading = false,
		deadlineInput = $bindable(''),
		extractDeadlines,
		deadlineSuccess = '',
		importSelectedModule = $bindable(''),
		extractedDeadlines = [],
		adoptingAll = false,
		canAdoptAllDeadlines = false,
		addAllDeadlinesAsTasks,
		removeAllDeadlines,
		editingDeadlineIdx = -1,
		editingDeadlineData = $bindable({ title: '', dueDate: '', priority: '3' }),
		saveEditDeadline,
		cancelEditDeadline,
		startEditDeadline,
		addDeadlineAsTask,
		removeDeadline
	} = $props();
</script>

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

	<div class="d-flex gap-2 mb-2 align-items-center flex-wrap">
		<select class="form-select form-select-sm rounded-pill" style="width: auto;" bind:value={taskSortBy}>
			<option value="dueDate">Sortierung: Deadline</option>
			<option value="priority">Sortierung: Priorität</option>
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
								<span class={`badge ${priorityBadgeClassNeutral()}`}>Prio {task.priority}</span>
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
								<p
									class={`small text-secondary mb-0 mt-1 fst-italic task-note ${isTaskNoteExpanded(task._id) ? 'task-note-expanded' : 'task-note-collapsed'}`}
								>
									<i class="bi bi-sticky me-1"></i>{task.notes}
								</p>
							{/if}
						</div>
						{#if task.status !== 'erledigt'}
							<div class="d-flex flex-column align-items-end gap-2 ms-2">
								<button
									class="btn btn-sm btn-outline-info rounded-pill"
									onclick={() => openFocusForTask(task)}
									aria-label="Im Fokus öffnen"
									title="In Fokus öffnen"
									type="button"
								>
									<i class="bi bi-stopwatch" aria-hidden="true"></i>
								</button>
							</div>
						{/if}
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
						{#if task.notes && isTaskNoteLong(task.notes)}
							<button
								class="btn btn-sm btn-outline-secondary rounded-pill ms-auto"
								type="button"
								onclick={() => toggleTaskNote(task._id)}
								aria-label={isTaskNoteExpanded(task._id) ? 'Notiz einklappen' : 'Notiz ausklappen'}
								title={isTaskNoteExpanded(task._id) ? 'Weniger anzeigen' : 'Alles anzeigen'}
							>
								<i class={`bi ${isTaskNoteExpanded(task._id) ? 'bi-chevron-up' : 'bi-chevron-down'}`} aria-hidden="true"></i>
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
					{#if creatingTaskModule}
						<input
							id="new-module"
							class="form-control rounded-3 mb-2"
							bind:value={taskFormNewModuleName}
							placeholder="Neues Modul"
							autocomplete="off"
							required
						/>
						<label class="form-label small" for="new-module-color">Modulfarbe</label>
						<input id="new-module-color" class="form-control form-control-color rounded-3" type="color" bind:value={taskFormNewModuleColor} />
						<button
							class="btn btn-link btn-sm px-0 mt-1"
							type="button"
							onclick={() => {
								creatingTaskModule = false;
								taskFormNewModuleName = '';
							}}
						>
							Bestehendes Modul auswählen
						</button>
					{:else if activeModules.length > 0}
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
					{#if !creatingTaskModule}
						<button
							class="btn btn-link btn-sm px-0 mt-1"
							type="button"
							onclick={() => {
								creatingTaskModule = true;
								taskFormNewModuleName = taskForm.module || '';
								taskForm.module = '';
							}}
						>
							<i class="bi bi-plus-circle me-1"></i>Neues Modul anlegen
						</button>
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
						class="form-control rounded-3 task-notes-input"
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
						class="form-control rounded-3 task-notes-input"
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
	{#if importAnalysisLoading}
		<div class="card rounded-4 border-0 shadow-sm mb-3">
			<div class="card-body">
				<div class="d-flex align-items-center gap-2 text-primary small">
					<div class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div>
					<span>
						{importAnalysisSource === 'file'
							? 'Semesterplan (Bild/PDF) wird analysiert...'
							: 'Semesterplan-Text wird analysiert...'}
					</span>
				</div>
				<div class="progress mt-2" style="height: 6px;">
					<div
						class="progress-bar progress-bar-striped progress-bar-animated"
						style="width: 100%;"
						role="progressbar"
						aria-valuemin="0"
						aria-valuemax="100"
					></div>
				</div>
			</div>
		</div>
	{/if}

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
			</div>
			<button class="btn btn-outline-primary rounded-pill w-100 mb-3" onclick={extractDeadlinesWithOcr} disabled={importAnalysisLoading}>
				{ocrLoading ? 'Datei wird analysiert...' : 'Datei analysieren'}
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
			<button class="btn btn-outline-primary rounded-pill w-100" onclick={extractDeadlines} disabled={importAnalysisLoading}>
				{importAnalysisLoading && importAnalysisSource === 'text' ? 'Text wird analysiert...' : 'Text analysieren'}
			</button>

			{#if deadlineSuccess}
				<div class="alert alert-success py-2 small mt-3 mb-2">{deadlineSuccess}</div>
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
