<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte';
	import TaskForm from '$lib/components/TaskForm.svelte';

	let loading = $state(false);
	let fetching = $state(false);
	let error = $state('');
	let task = $state(null);

	const taskId = $derived($page.params.id);

	async function parseError(response) {
		try {
			const payload = await response.json();
			return payload.error || 'Fehler bei der Anfrage';
		} catch {
			return response.statusText || 'Fehler bei der Anfrage';
		}
	}

	async function fetchTask() {
		fetching = true;
		error = '';
		try {
			const response = await fetch(`/api/tasks/${taskId}`);
			if (!response.ok) {
				throw new Error(await parseError(response));
			}

			const payload = await response.json();
			task = {
				...payload,
				_id: String(payload._id),
				dueDate: payload.dueDate || ''
			};
		} catch (fetchError) {
			error = fetchError.message;
		} finally {
			fetching = false;
		}
	}

	async function updateTask(event) {
		loading = true;
		error = '';
		try {
			const response = await fetch(`/api/tasks/${taskId}`, {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(event.detail)
			});

			if (!response.ok) {
				throw new Error(await parseError(response));
			}

			await goto('/tasks');
		} catch (updateError) {
			error = updateError.message;
		} finally {
			loading = false;
		}
	}

	onMount(fetchTask);
</script>

<svelte:head>
	<title>Aufgabe bearbeiten | StudySprint</title>
</svelte:head>

<main class="app-shell p-3">
	<div class="d-flex justify-content-between align-items-center mb-3">
		<h1 class="h4 mb-0">Aufgabe bearbeiten</h1>
		<a class="btn btn-outline-secondary rounded-pill" href="/tasks">Zurueck</a>
	</div>

	<FeedbackMessage {error} />

	{#if fetching}
		<div class="alert alert-info py-2 small">Aufgabe wird geladen...</div>
	{:else if task}
		<TaskForm
			formTitle="Aufgabe bearbeiten"
			submitLabel="Aenderungen speichern"
			initialValues={task}
			{loading}
			on:submit={updateTask}
		/>
	{:else}
		<p class="small text-secondary">Keine Aufgabe gefunden.</p>
	{/if}
</main>
