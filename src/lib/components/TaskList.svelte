<script>
	import { createEventDispatcher } from 'svelte';

	let { tasks = [] } = $props();

	const dispatch = createEventDispatcher();

	function toggleTask(task) {
		const status = task.status === 'erledigt' ? 'offen' : 'erledigt';
		dispatch('toggle', { task, status });
	}
</script>

{#if tasks.length === 0}
	<p class="small text-secondary">Noch keine Aufgaben vorhanden.</p>
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

				<div class="d-flex gap-2 mt-2 flex-wrap">
					<a class="btn btn-sm btn-outline-primary rounded-pill" href={`/tasks/${task._id}/edit`}>Bearbeiten</a>
					<button class="btn btn-sm btn-outline-success rounded-pill" onclick={() => toggleTask(task)}>
						{task.status === 'erledigt' ? 'Wieder offen' : 'Erledigt'}
					</button>
					<button
						class="btn btn-sm btn-outline-danger rounded-pill"
						onclick={() => dispatch('delete', { taskId: task._id })}
					>
						Loeschen
					</button>
				</div>
			</div>
		</div>
	{/each}
{/if}
