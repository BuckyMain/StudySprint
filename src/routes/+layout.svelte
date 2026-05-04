<script>
	import favicon from '$lib/assets/studysprint.png';
	import 'bootstrap/dist/css/bootstrap.min.css';
	import 'bootstrap-icons/font/bootstrap-icons.css';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
