<script>
	let {
		activeSemester,
		homeOpenTasks,
		thisWeekCompleted,
		openProfileQuicklink,
		nearestDeadline,
		getModuleColor,
		formatDate,
		openFocusForTask,
		highestPriorityTask,
		priorityBadgeClass,
		upcomingTasks,
		overdueTasks
	} = $props();
</script>

<p class="small text-secondary mb-2">
	<i class="bi bi-mortarboard me-1"></i>Aktives Semester: <strong>{activeSemester?.name || 'Kein Semester gewählt'}</strong>
</p>
<div class="row g-2 mb-3">
	<div class="col-6">
		<div class="card metric-card rounded-4">
			<div class="card-body">
				<p class="text-secondary small mb-1">Offene Aufgaben</p>
				<p class="fw-semibold mb-0 h5">{homeOpenTasks.length}</p>
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
			<div class="d-flex align-items-center gap-2">
				<div class="flex-grow-1">
					<p class="text-secondary small mb-1">Nächste Deadline</p>
					<p class="fw-semibold mb-0">{nearestDeadline.title}</p>
					<p class="small text-secondary mb-0">
						<span class="module-dot me-1" style="background-color: {getModuleColor(nearestDeadline.module)};"></span>
						{nearestDeadline.module} · fällig {formatDate(nearestDeadline.dueDate)}
					</p>
				</div>
				<button
					class="btn btn-sm btn-outline-info rounded-pill ms-auto"
					onclick={() => openFocusForTask(nearestDeadline)}
					aria-label="Im Fokus öffnen"
					title="In Fokus öffnen"
					type="button"
				>
					<i class="bi bi-stopwatch" aria-hidden="true"></i>
				</button>
			</div>
		</div>
	</div>
{/if}

{#if highestPriorityTask}
	<div class="card rounded-4 border-0 shadow-sm mb-3">
		<div class="card-body">
			<div class="d-flex align-items-center gap-2">
				<div class="flex-grow-1">
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
				<button
					class="btn btn-sm btn-outline-info rounded-pill ms-auto"
					onclick={() => openFocusForTask(highestPriorityTask)}
					aria-label="Im Fokus öffnen"
					title="In Fokus öffnen"
					type="button"
				>
					<i class="bi bi-stopwatch" aria-hidden="true"></i>
				</button>
			</div>
		</div>
	</div>
{/if}

<div class="card rounded-4 border-0 shadow-sm mb-3">
	<div class="card-body">
		<h3 class="h6 mb-3">Aufgaben diese Woche (Mo–So)</h3>
		{#if upcomingTasks.length === 0}
			<p class="small text-secondary mb-0">Keine offenen Aufgaben mit Deadline in dieser Kalenderwoche.</p>
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
					<button
						class="btn btn-sm btn-outline-info rounded-pill ms-auto"
						onclick={() => openFocusForTask(task)}
						aria-label="Im Fokus öffnen"
						title="In Fokus öffnen"
						type="button"
					>
						<i class="bi bi-stopwatch" aria-hidden="true"></i>
					</button>
				</div>
			{/each}
		{/if}
	</div>
</div>

<div class="card rounded-4 border-0 shadow-sm">
	<div class="card-body">
		<h3 class="h6 mb-3">Überfällige Aufgaben</h3>
		{#if overdueTasks.length === 0}
			<p class="small text-secondary mb-0">Keine überfälligen Aufgaben im aktiven Semester.</p>
		{:else}
			{#each overdueTasks as task}
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
					<button
						class="btn btn-sm btn-outline-info rounded-pill ms-auto"
						onclick={() => openFocusForTask(task)}
						aria-label="Im Fokus öffnen"
						title="In Fokus öffnen"
						type="button"
					>
						<i class="bi bi-stopwatch" aria-hidden="true"></i>
					</button>
				</div>
			{/each}
		{/if}
	</div>
</div>
