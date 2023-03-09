<script lang="ts">
    import Icon from '@iconify/svelte';
    import type { GraphLayout } from './graph_layout';
    import StructureNode from './StructureNode.svelte';

    let structureShown = false;

    export let graphLayout: GraphLayout;
    let root = graphLayout.pathStructureRoot;

    const showAll = () => {
        root.update(x => {
            const traverse = (node: typeof x) => {
                node.shown = true;
                node.children.forEach(traverse);
            };
            traverse(x);
            return x;
        });
    };
</script>

<div class="absolute top-2 left-2 w-56 bg-[#292a2d] rounded-md shadow overflow-hidden">
    <button class="w-full text-left text-xs font-medium flex items-center py-1 px-3 cursor-pointer hover:bg-zinc-800 opacity-60 hover:opacity-100" on:click={() => structureShown = !structureShown}>
        <p class="flex-1">Structure</p>
        <Icon icon="heroicons:chevron-down-20-solid" class="w-4 h-4 {structureShown && 'rotate-180'}" />
    </button>

    {#if structureShown}
        <div class="flex border-t border-zinc-700 px-2 pt-1">
            <button class="opacity-50 hover:opacity-100 text-[10px]" on:click={showAll}>Show all</button>
        </div>
        <div class="h-40 py-1 px-2 overflow-auto">
            {#each $root.children as child (child.label)}
                <StructureNode bind:node={child} />
            {/each}
        </div>
    {/if}
</div>