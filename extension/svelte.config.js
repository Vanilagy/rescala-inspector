import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// For some dumb reason, this file needs to be at the vite config's root

export default {
	// Consult https://svelte.dev/docs#compile-time-svelte-preprocess
	// for more information about preprocessors
	preprocess: vitePreprocess()
};
