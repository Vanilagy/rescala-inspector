<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { PathStructureNode } from '../ts/rendered_graph';

	export let node: PathStructureNode;

	let expanded = false;
</script>

<div>
	<div class="flex">
		<button class="flex space-x-1 items-center group w-full text-left min-w-0" on:click={() => expanded = !expanded}>
			<Icon icon="heroicons:chevron-right-20-solid" class="w-4 h-4 opacity-50 group-hover:opacity-100 {expanded && 'rotate-90'} {node.children.length === 0 && '!opacity-0'}" />

			<p class="flex-1 truncate">{node.label}</p>
		</button>
		<button
			class="shrink-0 w-2 h-2 p-1 block box-content hover:scale-150 transition-transform duration-75"
			on:click={() => node.shown = !node.shown}
		>
			<div
				class="h-full w-full rounded-full bg-elevation-2"
				class:bg-highlight-1={node.shown}
			/>
		</button>
	</div>

	{#if expanded}
		<div class="ml-2 {!node.shown && 'opacity-30 pointer-events-none'}">
			{#each node.children as child (child.label)}
				<svelte:self bind:node={child} />
			{/each}
		</div>
	{/if}
</div>