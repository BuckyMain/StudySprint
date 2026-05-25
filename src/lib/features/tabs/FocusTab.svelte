<script>
	let {
		activeSemester,
		openTasks,
		selectedTaskId = $bindable(''),
		handleFocusTaskChange,
		selectedTask,
		getModuleColor,
		statusBadgeClass,
		statusLabel,
		isTaskNoteLong,
		focusNoteExpanded = $bindable(false),
		focusSecondsLeft,
		formatSeconds,
		formatOvertime,
		isFocusRunning,
		focusHasStarted,
		startFocus,
		pauseFocus,
		resetFocus,
		focusRatings,
		reflectionRating = $bindable('Okay'),
		reflectionNote = $bindable(''),
		completeFocusSession
	} = $props();
</script>

<div id="profile-semester-section" class="card rounded-4 border-0 shadow-sm mb-3">
	<div class="card-body text-center">
		<h2 class="h5 mb-3">Fokus Timer</h2>
		<p class="small text-secondary mb-2">
			<i class="bi bi-mortarboard me-1"></i>Aktives Semester: <strong>{activeSemester?.name || 'Kein Semester gewählt'}</strong>
		</p>
		<div class="mb-3">
			<label class="form-label small" for="selected-task">Aufgabe auswählen</label>
			<select id="selected-task" class="form-select rounded-3" bind:value={selectedTaskId} onchange={handleFocusTaskChange}>
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
					<p class={`mb-0 task-note ${focusNoteExpanded ? 'task-note-expanded' : 'task-note-collapsed'}`}>
						<i class="bi bi-sticky me-1"></i><strong>Notiz:</strong> {selectedTask.notes}
					</p>
					{#if isTaskNoteLong(selectedTask.notes)}
						<button
							class="btn btn-sm btn-outline-secondary rounded-pill mt-2"
							type="button"
							onclick={() => (focusNoteExpanded = !focusNoteExpanded)}
							aria-label={focusNoteExpanded ? 'Notiz einklappen' : 'Notiz ausklappen'}
							title={focusNoteExpanded ? 'Weniger anzeigen' : 'Alles anzeigen'}
						>
							<i class={`bi ${focusNoteExpanded ? 'bi-chevron-up' : 'bi-chevron-down'}`} aria-hidden="true"></i>
						</button>
					{/if}
				</div>
			{/if}
		{/if}
		<div class="focus-timer mb-3">
			<div>
				<p class="text-secondary small mb-1">Verbleibend</p>
				<p class="display-6 fw-semibold mb-0">{formatSeconds(Math.max(0, focusSecondsLeft))}</p>
				{#if focusSecondsLeft < 0}
					<p class="small text-danger fw-semibold mb-0">Über Ziel: {formatOvertime(Math.abs(focusSecondsLeft))}</p>
				{/if}
			</div>
		</div>
		<p class="small text-secondary mb-2">{selectedTask ? selectedTask.title : 'Keine Aufgabe ausgewählt'}</p>
		<div class="d-flex justify-content-center gap-2">
			<button
				class={`btn rounded-pill px-3 ${isFocusRunning ? 'btn-primary' : 'btn-outline-primary'}`}
				onclick={startFocus}
				type="button"
				aria-label="Start"
				title="Start"
			>
				<i class="bi bi-play-fill" aria-hidden="true"></i>
			</button>
			<button
				class={`btn rounded-pill px-3 ${!isFocusRunning && focusHasStarted ? 'btn-primary' : 'btn-outline-primary'}`}
				onclick={pauseFocus}
				type="button"
				aria-label="Pause"
				title="Pause"
			>
				<i class="bi bi-pause-fill" aria-hidden="true"></i>
			</button>
			<button
				class="btn btn-outline-primary rounded-pill px-3"
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
