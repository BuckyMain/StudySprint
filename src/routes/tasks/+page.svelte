<script>
	import { onMount } from 'svelte';
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte';
	import TaskList from '$lib/components/TaskList.svelte';

	let loading = $state(false);
	let error = $state('');
	let success = $state('');
	let tasks = $state([]);

	let sortBy = $state('priority');
	let filterModule = $state('');
	let showOnlyOpen = $state(false);

	const modules = $derived([...new Set(tasks.map((t) => t.module).filter(Boolean))]);

	const filteredSortedTasks = $derived.by(() => {
		let list = showOnlyOpen ? tasks.filter((t) => t.status !== 'erledigt') : tasks;
		if (filterModule) list = list.filter((t) => t.module === filterModule);
		return [...list].sort((a, b) => {
			if (sortBy === 'priority') return Number(a.priority) - Number(b.priority);
			if (sortBy === 'dueDate') {
				if (!a.dueDate && !b.dueDate) return 0;
				if (!a.dueDate) return 1;
				if (!b.dueDate) return -1;
				return new Date(a.dueDate) - new Date(b.dueDate);
			}
			if (sortBy === 'duration') return Number(a.duration) - Number(b.duration);
			return 0;
		});
	});

	async function parseError(response) {
		try {
			const payload = await response.json();
			return payload.error || 'Fehler bei der Anfrage';
		} catch {
			return response.statusText || 'Fehler bei der Anfrage';
		}
	}

	async function fetchTasks() {
		loading = true;
		error = '';
		try {
			const response = await fetch('/api/tasks');
			if (!response.ok) throw new Error(await parseError(response));
			const payload = await response.json();
			tasks = payload.map((task) => ({ ...task, _id: String(task._id) }));
		} catch (fetchError) {
			error = fetchError.message;
		} finally {
			loading = false;
		}
	}

	async function toggleTaskStatus(event) {
		const { task, status } = event.detail;
		error = '';
		success = '';
		try {
			const response = await fetch(`/api/tasks/${task._id}`, {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ status })
			});
			if (!response.ok) throw new Error(await parseError(response));
			success = status === 'erledigt' ? 'Aufgabe als erledigt markiert.' : 'Aufgabe wieder geöffnet.';
			await fetchTasks();
		} catch (statusError) {
			error = statusError.message;
		}
	}

	async function deleteTask(event) {
		const { taskId } = event.detail;
		if (!window.confirm('Aufgabe wirklich löschen?')) return;
		error = '';
		success = '';
		try {
			const response = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
			if (!response.ok) throw new Error(await parseError(response));
			success = 'Aufgabe gelöscht.';
			await fetchTasks();
		} catch (deleteError) {
			error = deleteError.message;
		}
	}

	onMount(fetchTasks);
</script>

<svelte:head>
	<title>Meine Aufgaben | StudySprint</title>
</svelte:head>

<main class="app-shell p-3">
	<div class="d-flex align-items-center mb-3">
		<a class="btn btn-outline-secondary rounded-pill me-3" href="/">
			<i class="bi bi-arrow-left me-1"></i>Zurück
		</a>
		<div>
			<h1 class="h4 mb-0">Meine Aufgaben</h1>
			<p class="small text-secondary mb-0">
				{showOnlyOpen ? 'Nur offene Aufgaben' : 'Alle Aufgaben'}
				{filterModule ? ` · Modul: ${filterModule}` : ''}
			</p>
		</div>
	</div>

	<div class="d-flex gap-2 mb-3">
		<a class="btn btn-primary rounded-pill" href="/tasks/new">
			<i class="bi bi-plus-lg me-1"></i>Neue Aufgabe
		</a>
		<button class="btn btn-outline-primary rounded-pill" onclick={fetchTasks} disabled={loading}>
			Aktualisieren
		</button>
	</div>

	<!-- Sort & Filter -->
	<div class="d-flex gap-2 mb-3 flex-wrap align-items-center">
		<select class="form-select form-select-sm rounded-pill" style="width: auto;" bind:value={sortBy}>
			<option value="priority">Sortierung: Priorität</option>
			<option value="dueDate">Sortierung: Deadline</option>
			<option value="duration">Sortierung: Dauer</option>
		</select>
		<select class="form-select form-select-sm rounded-pill" style="width: auto;" bind:value={filterModule}>
			<option value="">Alle Module</option>
			{#each modules as mod}
				<option value={mod}>{mod}</option>
			{/each}
		</select>
		<button
			class={`btn btn-sm rounded-pill ${showOnlyOpen ? 'btn-primary' : 'btn-outline-secondary'}`}
			onclick={() => (showOnlyOpen = !showOnlyOpen)}
		>
			{showOnlyOpen ? 'Nur offene' : 'Alle anzeigen'}
		</button>
	</div>

	<FeedbackMessage {error} {success} />

	{#if loading}
		<div class="alert alert-info py-2 small">Daten werden geladen...</div>
	{/if}

	<TaskList tasks={filteredSortedTasks} on:toggle={toggleTaskStatus} on:delete={deleteTask} />
</main>
