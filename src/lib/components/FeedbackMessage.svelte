<script>
	let { error = '', success = '' } = $props();
</script>

{#if error}
	<div class="alert alert-danger py-2 small">{error}</div>
{/if}

{#if success}
	<div class="alert alert-success py-2 small">{success}</div>
{/if}
