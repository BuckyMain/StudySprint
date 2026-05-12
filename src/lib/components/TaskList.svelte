<script>
	import { createEventDispatcher } from 'svelte';

	let { tasks = [] } = $props();

	const dispatch = createEventDispatcher();

	function toggleTask(task) {
		const status = task.status === 'erledigt' ? 'offen' : 'erledigt';
		dispatch('toggle', { task, status });
	}

	function formatDate(value) {
		if (!value) return null;
		const d = new Date(value);
		return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('de-CH');
	}

	function priorityBadgeClass(p) {
		const n = Number(p);
		if (n === 1) return 'text-bg-danger';
		if (n === 2) return 'text-bg-warning text-dark';
		if (n === 3) return 'text-bg-primary';
		if (n === 4) return 'text-bg-info text-dark';
		return 'text-bg-secondary';
	}
</script>

{#if tasks.length === 0}
	<p class="small text-secondary">Noch keine Aufgaben vorhanden.</p>
{:else}
	{#each tasks as task}
		<div class="card rounded-4 border-0 shadow-sm mb-2">
			<div class="card-body">
				<div class="d-flex justify-content-between align-items-start">
					<div class="flex-grow-1 me-2">
						<div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
							<span class={`badge ${priorityBadgeClass(task.priority)}`}>Prio {task.priority}</span>
							<span class={`badge ${task.status === 'erledigt' ? 'text-bg-success' : 'text-bg-light text-dark border'}`}>
								{task.status === 'erledigt' ? 'Erledigt' : 'Offen'}
							</span>
						</div>
						<p class="fw-semibold mb-1">{task.title}</p>
						<p class="small text-secondary mb-0">
							{task.module}
							{formatDate(task.dueDate) ? ` · Deadline ${formatDate(task.dueDate)}` : ''}
							· {task.duration} min
						</p>
					</div>
				</div>

				<div class="d-flex gap-2 mt-2 flex-wrap">
					<a class="btn btn-sm btn-outline-primary rounded-pill" href={`/tasks/${task._id}/edit`}>Bearbeiten</a>
					<button class="btn btn-sm btn-outline-success rounded-pill" onclick={() => toggleTask(task)}>
						{task.status === 'erledigt' ? 'Wieder öffnen' : 'Als erledigt markieren'}
					</button>
					<button
						class="btn btn-sm btn-outline-danger rounded-pill"
						onclick={() => dispatch('delete', { taskId: task._id })}
					>
						Löschen
					</button>
				</div>
			</div>
		</div>
	{/each}
{/if}
