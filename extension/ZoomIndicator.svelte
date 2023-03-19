<script lang="ts">
    import { MAX_SCALE, MIN_SCALE, type RenderedGraph } from "./rendered_graph";
    import { clamp } from "./utils";
    import Icon from '@iconify/svelte';

    export let renderedGraph: RenderedGraph;
    $: scale = renderedGraph.scale;
    $: logScale = Math.log2($scale);
    $: completion = (logScale - Math.log2(MIN_SCALE)) / Math.log2(MAX_SCALE / MIN_SCALE);

    let dragging = false;

    const drag = (e: PointerEvent) => {
        if (!dragging) return;

        let logScale = (-e.movementY / 128) * Math.log2(MAX_SCALE / MIN_SCALE);
        $scale = clamp($scale * 2**logScale, MIN_SCALE, MAX_SCALE);
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
    <div class="w-2 bg-[#292a2d] rounded-md overflow-hidden h-32 relative border box-content border-zinc-700">
        <div
            class="w-2 h-4 rounded-md bg-zinc-600 absolute left-0 shadow hover:bg-white cursor-grab"
            class:bg-white={dragging}
            style="bottom: {100 * completion}%; transform: translateY({100 * completion}%);"
            on:pointerdown={() => dragging = true}
        />
    </div>
</div>