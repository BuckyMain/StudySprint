<script>
	let {
		progressFilterSemester = $bindable(''),
		mySemesters,
		progressPeriod = $bindable('week'),
		formatProgressPeriodLabel,
		progressCompletedTasks,
		progressPeriodTasks,
		progressCompletionPct,
		progressPeriodFocusMinutes,
		progressOverUnderMinutes,
		weeklyGoalHours,
		progressChartData,
		progressMaxChartCount,
		progressModuleStats,
		progressFilterModule = $bindable(''),
		progressModules,
		filteredProgressCompletedTasks,
		getTaskReflectionsForPeriod,
		expandedProgressTaskIds,
		priorityBadgeClassNeutral,
		getModuleColor,
		toggleProgressTaskDetails,
		formatDate
	} = $props();
</script>

<div class="d-flex justify-content-between align-items-center mb-3 gap-2 flex-wrap">
	<h2 class="h5 mb-0">Mein Fortschritt</h2>
	<div class="d-flex gap-2 flex-wrap">
		<select class="form-select form-select-sm rounded-pill" style="width: auto;" bind:value={progressFilterSemester}>
			<option value="">Alle Semester</option>
			{#each mySemesters as sem}
				<option value={sem.id}>{sem.name}</option>
			{/each}
		</select>
		<div class="d-flex gap-1" role="group" aria-label="Fortschritts-Zeitraum">
			<button
				type="button"
				class={`btn btn-sm rounded-pill ${progressPeriod === 'week' ? 'btn-primary' : 'btn-outline-primary'}`}
				onclick={() => (progressPeriod = 'week')}
			>Diese Woche</button>
			<button
				type="button"
				class={`btn btn-sm rounded-pill ${progressPeriod === 'month' ? 'btn-primary' : 'btn-outline-primary'}`}
				onclick={() => (progressPeriod = 'month')}
			>Diesen Monat</button>
			<button
				type="button"
				class={`btn btn-sm rounded-pill ${progressPeriod === 'semester' ? 'btn-primary' : 'btn-outline-primary'}`}
				onclick={() => (progressPeriod = 'semester')}
			>Ganzes Semester</button>
		</div>
	</div>
</div>
<p class="small text-secondary mb-3">
	Zeitraum: <strong>{formatProgressPeriodLabel()}</strong>
</p>

<div class="row g-2 mb-3">
	<div class="col-6">
		<div class="card metric-card rounded-4 text-center">
			<div class="card-body py-3">
				<p class="small text-secondary mb-1">Erledigte Aufgaben</p>
				<p class="h5 mb-0">{progressCompletedTasks.length} / {progressPeriodTasks.length}</p>
				<p class="small text-secondary mb-0">{progressCompletionPct}% abgeschlossen</p>
			</div>
		</div>
	</div>
	<div class="col-6">
		<div class="card metric-card rounded-4 text-center">
			<div class="card-body py-3">
				<p class="small text-secondary mb-1">Fokuszeit im Zeitraum</p>
				<p class="h5 mb-0">{progressPeriodFocusMinutes} min</p>
			</div>
		</div>
	</div>
	<div class="col-12">
		<div class="card metric-card rounded-4 text-center">
			<div class="card-body py-3">
				<p class="small text-secondary mb-1">Zeit vs. Schätzung</p>
				<p class={`h5 mb-0 ${progressOverUnderMinutes > 0 ? 'text-danger' : progressOverUnderMinutes < 0 ? 'text-success' : ''}`}>
					{progressOverUnderMinutes > 0 ? '+' : ''}{progressOverUnderMinutes} min
				</p>
				<p class="small text-secondary mb-0">
					{progressOverUnderMinutes > 0
						? 'über Zielzeit'
						: progressOverUnderMinutes < 0
							? 'unter Zielzeit'
							: 'im Zielbereich'}
				</p>
			</div>
		</div>
	</div>
</div>

{#if progressPeriod === 'week' && weeklyGoalHours > 0}
	{@const goalMinutes = weeklyGoalHours * 60}
	{@const goalPct = Math.min(100, Math.round((progressPeriodFocusMinutes / goalMinutes) * 100))}
	<div class="card rounded-4 border-0 shadow-sm mb-3">
		<div class="card-body">
			<div class="d-flex justify-content-between align-items-center mb-2">
				<h3 class="h6 mb-0">Wochenziel Fokuszeit</h3>
				<span class="small text-secondary">{progressPeriodFocusMinutes} / {goalMinutes} min</span>
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

<div class="card rounded-4 border-0 shadow-sm mb-3">
	<div class="card-body">
		<h3 class="h6 mb-1">
			{progressPeriod === 'week'
				? 'Erledigte Aufgaben diese Woche'
				: progressPeriod === 'month'
					? 'Erledigte Aufgaben diesen Monat'
					: 'Erledigte Aufgaben im ausgewählten Semester'}
		</h3>
		<p class="small text-secondary mb-3">{formatProgressPeriodLabel()}</p>
		<div class="d-flex align-items-end gap-1" style="height: 72px;">
			{#each progressChartData as day}
				<div class="flex-grow-1 d-flex flex-column align-items-center gap-1">
					<div
						class="rounded-top w-100 bg-primary"
						style="height: {Math.max(4, Math.round((day.count / progressMaxChartCount) * 52))}px; transition: height 0.3s;"
					></div>
					<span class={`small ${day.isToday ? 'fw-bold text-primary' : 'text-secondary'}`} style="font-size: 10px;">
						{day.label}
					</span>
				</div>
			{/each}
		</div>
	</div>
</div>

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
				{@const taskRefs = getTaskReflectionsForPeriod(task._id)}
				{@const latestRef = taskRefs[0]}
				{@const spentMinutes = taskRefs.reduce((sum, r) => sum + Number(r.focusMinutes || 0), 0)}
				{@const diff = spentMinutes - Number(task.duration || 0)}
				{@const isExpanded = expandedProgressTaskIds.has(String(task._id))}
				<div class="border-bottom pb-2 mb-2">
					<div class="d-flex align-items-start justify-content-between">
						<div>
							<div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
								<span class={`badge ${priorityBadgeClassNeutral()}`}>Prio {task.priority}</span>
								<span
									class="badge"
									style="background-color: {getModuleColor(task.module)}; color: white;"
								>{task.module}</span>
								<span class={`badge ${diff > 0 ? 'text-bg-danger' : diff < 0 ? 'text-bg-success' : 'text-bg-secondary'}`}>
									{diff > 0 ? '+' : ''}{diff} min {diff > 0 ? 'über Ziel' : diff < 0 ? 'unter Ziel' : ''}
								</span>
							</div>
							<p class="fw-semibold mb-0 small">{task.title}</p>
						</div>
						<div class="text-end flex-shrink-0 ms-2">
							<p class="small mb-0 text-secondary">Schätzung: {task.duration} min</p>
							<p class="small mb-0">Tatsächlich: {spentMinutes} min</p>
							{#if latestRef}
								<p class="small text-secondary mb-0">{latestRef.rating}</p>
							{/if}
						</div>
					</div>
					<button
						class="btn btn-sm btn-outline-secondary rounded-pill mt-2"
						type="button"
						onclick={() => toggleProgressTaskDetails(task._id)}
					>
						<i class={`bi ${isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'}`} aria-hidden="true"></i>
						{isExpanded ? ' Details ausblenden' : ' Details anzeigen'}
					</button>
					{#if isExpanded}
						<div class="mt-2 p-2 rounded-3 border bg-body-tertiary">
							{#if task.notes}
								<p class="small mb-2"><strong>Aufgabennotiz:</strong> {task.notes}</p>
							{:else}
								<p class="small text-secondary mb-2">Keine Aufgabennotiz vorhanden.</p>
							{/if}
							{#if taskRefs.some((r) => r.note)}
								<p class="small mb-1"><strong>Fokus-Notizen:</strong></p>
								{#each taskRefs as ref}
									{#if ref.note}
										<p class="small mb-1">
											{formatDate(ref.createdAt)} · {ref.focusMinutes} min
											<br />
											<span class="text-secondary">{ref.note}</span>
										</p>
									{/if}
								{/each}
							{:else}
								<p class="small text-secondary mb-0">Keine Fokus-Notiz im gewählten Zeitraum vorhanden.</p>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>
