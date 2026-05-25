<script>
	let {
		userName = $bindable(''),
		weeklyGoalHours = $bindable(10),
		darkMode = $bindable(false),
		saveSettings,
		settingsSaved = false,
		mySemesters = [],
		activeSemesterId = $bindable(''),
		setActiveSemester,
		deletingSemesterId = $bindable(''),
		deletingModuleId = $bindable(''),
		cancelRemoveSemester,
		confirmRemoveSemester,
		newSemesterInput = $bindable(''),
		newSemesterColor = $bindable('#2563eb'),
		addSemester,
		MODULE_COLORS = [],
		activeModules = [],
		cancelRemoveModule,
		confirmRemoveModule,
		newModuleInput = $bindable(''),
		newModuleColor = $bindable('#2563eb'),
		addModule,
		confirmingDeleteAllData = $bindable(false),
		deleteAllData,
		cancelDeleteAllData,
		requestDeleteAllData
	} = $props();
</script>

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
			<label class="form-label small fw-semibold d-flex align-items-center gap-1" for="setting-weekly-goal">
				Wochenziel Fokuszeit (Stunden)
				<i
					class="bi bi-info-circle text-secondary"
					title="Lege hier dein Lernzeit-Ziel pro Woche fest. Es wird im Fortschritt für den Wochenmodus verwendet."
					aria-label="Info Wochenziel Fokuszeit"
				></i>
			</label>
			<input
				id="setting-weekly-goal"
				class="form-control rounded-3"
				type="number"
				min="0"
				max="80"
				step="0.5"
				bind:value={weeklyGoalHours}
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

<div class="card rounded-4 border-0 shadow-sm mb-3">
	<div class="card-body">
		<h3 class="h6 mb-3 d-flex align-items-center gap-2">
			Semester
			<i
				class="bi bi-info-circle text-secondary"
				title="Hier wechselst du das aktuelle Semester manuell. Neue Module und Aufgaben werden dem aktiven Semester zugeordnet."
				aria-label="Info Semesterverwaltung"
			></i>
		</h3>

		{#if mySemesters.length > 0}
			<div class="mb-3">
				<label class="form-label small fw-semibold d-flex align-items-center gap-1" for="active-semester">
					Aktuelles Semester
					<i
						class="bi bi-info-circle text-secondary"
						title="Der Wechsel passiert nicht automatisch. Wähle hier dein aktives Semester für Aufgaben, Module und Home-Metriken."
						aria-label="Info aktives Semester"
					></i>
				</label>
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
							<span class="small text-danger fw-semibold">Semester "{sem.name}" inkl. aller Module, Aufgaben und Reflexionen wirklich löschen?</span>
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

<div id="profile-module-section" class="card rounded-4 border-0 shadow-sm mb-3">
	<div class="card-body">
		<h3 class="h6 mb-1 d-flex align-items-center gap-2">
			Module
			<i
				class="bi bi-info-circle text-secondary"
				title="Module gehören immer zum aktiven Semester. Aufgaben übernehmen diese Zuordnung beim Erstellen."
				aria-label="Info Module"
			></i>
		</h3>
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
								<span class="small text-danger fw-semibold">Modul "{mod.name}" inkl. aller Aufgaben und Reflexionen wirklich löschen?</span>
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

<style>
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
