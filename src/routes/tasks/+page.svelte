<script>
	import { onMount } from 'svelte';
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte';
	import TaskList from '$lib/components/TaskList.svelte';

	let loading = $state(false);
	let error = $state('');
	let success = $state('');
	let tasks = $state([]);

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
			if (!response.ok) {
				throw new Error(await parseError(response));
			}

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
			if (!response.ok) {
				throw new Error(await parseError(response));
			}

			success = status === 'erledigt' ? 'Aufgabe als erledigt markiert.' : 'Aufgabe wieder geoeffnet.';
			await fetchTasks();
		} catch (statusError) {
			error = statusError.message;
		}
	}

	async function deleteTask(event) {
		const { taskId } = event.detail;
		if (!window.confirm('Aufgabe wirklich loeschen?')) return;

		error = '';
		success = '';

		try {
			const response = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
			if (!response.ok) {
				throw new Error(await parseError(response));
			}

			success = 'Aufgabe geloescht.';
			await fetchTasks();
		} catch (deleteError) {
			error = deleteError.message;
		}
	}

	onMount(fetchTasks);
</script>

<svelte:head>
	<title>Tasks | StudySprint</title>
</svelte:head>

<main class="app-shell p-3">
	<div class="d-flex justify-content-between align-items-center mb-3">
		<div>
			<p class="small text-secondary mb-1">Workflow: Task-Management</p>
			<h1 class="h4 mb-0">Aufgaben Uebersicht</h1>
		</div>
		<a class="btn btn-outline-secondary rounded-pill" href="/">Dashboard</a>
	</div>

	<div class="d-flex gap-2 mb-3">
		<a class="btn btn-primary rounded-pill" href="/tasks/new">Neue Aufgabe</a>
		<button class="btn btn-outline-primary rounded-pill" onclick={fetchTasks} disabled={loading}>
			Aktualisieren
		</button>
	</div>

	<FeedbackMessage {error} {success} />

	{#if loading}
		<div class="alert alert-info py-2 small">Daten werden geladen...</div>
	{/if}

	<TaskList {tasks} on:toggle={toggleTaskStatus} on:delete={deleteTask} />
</main>
