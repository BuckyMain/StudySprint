<script>
	import { createEventDispatcher } from 'svelte';

	let {
		formTitle = 'Aufgabe',
		submitLabel = 'Speichern',
		loading = false,
		initialValues = {},
		priorities = ['1', '2', '3', '4', '5']
	} = $props();

	const priorityLabels = { '1': 'Höchste', '2': 'Hoch', '3': 'Mittel', '4': 'Niedrig', '5': 'Niedrigste' };

	const dispatch = createEventDispatcher();
	const defaultValues = {
		title: '',
		module: '',
		dueDate: '',
		duration: 25,
		priority: '3'
	};

	let hydrated = false;
	let form = $state({ ...defaultValues });

	$effect(() => {
		if (!hydrated && initialValues) {
			form = { ...defaultValues, ...initialValues };
			hydrated = true;
		}
	});

	function handleSubmit(event) {
		event.preventDefault();
		dispatch('submit', { ...form });
	}
</script>

<form onsubmit={handleSubmit} class="card rounded-4 border-0 shadow-sm">
	<div class="card-body">
		<h1 class="h5 mb-3">{formTitle}</h1>

		<div class="row g-2">
			<div class="col-12">
				<label class="form-label small" for="task-title">Titel</label>
				<input
					id="task-title"
					class="form-control rounded-3"
					bind:value={form.title}
					required
					placeholder="z.B. API-Doku fertigstellen"
				/>
			</div>

			<div class="col-6">
				<label class="form-label small" for="task-module">Modul</label>
				<input
					id="task-module"
					class="form-control rounded-3"
					bind:value={form.module}
					required
					placeholder="Prototyping"
				/>
			</div>

			<div class="col-6">
				<label class="form-label small" for="task-due-date">Deadline / Abgabefrist</label>
				<input id="task-due-date" class="form-control rounded-3" type="date" bind:value={form.dueDate} />
			</div>

			<div class="col-6">
				<label class="form-label small" for="task-duration">Geschätzte Bearbeitungsdauer (Min.)</label>
				<input
					id="task-duration"
					class="form-control rounded-3"
					type="number"
					min="5"
					step="5"
					bind:value={form.duration}
				/>
			</div>

			<div class="col-6">
				<label class="form-label small" for="task-priority">Priorität (1 = höchste)</label>
				<select id="task-priority" class="form-select rounded-3" bind:value={form.priority}>
					{#each priorities as p}
						<option value={p}>{p} – {priorityLabels[p]}</option>
					{/each}
				</select>
			</div>

			<div class="col-12 mt-3">
				<button class="btn btn-primary rounded-pill w-100" disabled={loading} type="submit">
					{loading ? 'Speichert...' : submitLabel}
				</button>
			</div>
		</div>
	</div>
</form>
