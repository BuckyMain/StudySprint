<script>
	import { goto } from '$app/navigation';
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte';
	import TaskForm from '$lib/components/TaskForm.svelte';

	let loading = $state(false);
	let error = $state('');

	async function parseError(response) {
		try {
			const payload = await response.json();
			return payload.error || 'Fehler bei der Anfrage';
		} catch {
			return response.statusText || 'Fehler bei der Anfrage';
		}
	}

	async function createTask(event) {
		loading = true;
		error = '';

		try {
			const response = await fetch('/api/tasks', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(event.detail)
			});

			if (!response.ok) {
				throw new Error(await parseError(response));
			}

			await goto('/tasks');
		} catch (createError) {
			error = createError.message;
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Neue Aufgabe | StudySprint</title>
</svelte:head>

<main class="app-shell p-3">
	<div class="d-flex justify-content-between align-items-center mb-3">
		<h1 class="h4 mb-0">Aufgabe erfassen</h1>
		<a class="btn btn-outline-secondary rounded-pill" href="/tasks">Zurueck</a>
	</div>

	<FeedbackMessage {error} />
	<TaskForm formTitle="Neue Aufgabe" submitLabel="Aufgabe speichern" {loading} on:submit={createTask} />
</main>
