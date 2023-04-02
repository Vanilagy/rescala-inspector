<script lang="ts">
	import { MAX_SCALE, MIN_SCALE, type RenderedGraph } from '../ts/rendered_graph';
	import { clamp } from '../ts/utils';
	import Icon from '@iconify/svelte';

	export let renderedGraph: RenderedGraph;
	$: scale = renderedGraph.scale;
	$: logScale = Math.log2($scale);
	$: completion = (logScale - Math.log2(MIN_SCALE)) / Math.log2(MAX_SCALE / MIN_SCALE);

	let dragging = false;
	let dragOffset: number;
	let dragStartScale: number;

	const drag = (e: PointerEvent) => {
		if (!dragging) return;

		dragOffset += e.movementY;

		let logScale = (-dragOffset / 128) * Math.log2(MAX_SCALE / MIN_SCALE);
		let newScale = dragStartScale * 2**logScale;
		let scaleChange = newScale / $scale;

		// Zoom into the center of the screen
		renderedGraph.originX = (renderedGraph.originX - window.innerWidth/2) * scaleChange + window.innerWidth/2;
		renderedGraph.originY = (renderedGraph.originY - window.innerHeight/2) * scaleChange + window.innerHeight/2;
		$scale = clamp(newScale, MIN_SCALE, MAX_SCALE);
	};
</script>

<svelte:window
	on:pointermove={drag}
	on:pointerup={() => dragging = false}
/>

<div class="absolute top-3 right-3 flex flex-col items-center space-y-2">
	<button class="w-4 h-4 opacity-30 hover:opacity-100" on:click={() => renderedGraph.center()} title="Center">
		<Icon icon="material-symbols:center-focus-strong-outline-rounded" class="w-full h-full" />
	</button>
	<div class="w-2 bg-elevation-1 rounded-md overflow-hidden h-32 relative border box-content border-border-1">
		<div
			class="w-2 h-4 rounded-md bg-elevation-3 absolute left-0 shadow hover:bg-hover-strong cursor-grab"
			class:bg-hover-strong={dragging}
			style="bottom: {100 * completion}%; transform: translateY({100 * completion}%);"
			on:pointerdown={() => (dragging = true, dragOffset = 0, dragStartScale = $scale)}
		/>
	</div>
</div>