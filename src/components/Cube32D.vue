<script setup lang="ts">
import { Cube3 } from '@/rubik-cube/rubik-cube';

const props = defineProps({
    cube3: Cube3
});

</script>

<template>
    <div v-if="cube3" class="surface-development">
        <div v-for="i in 108" :class="['square', cube3.getColor(i)]"></div>
    </div>
    <p v-else>Cube32D缺少参数 cube3:Cube3</p>
</template>

<style scoped>
.surface-development {
    display: grid;
    grid-template-columns: repeat(12, 1em);
    grid-template-rows: repeat(9, 1em);
    gap: 0;
}

.square {
    width: 1em;
    height: 1em;
}

.blue {
    background-color: blue;
}

.orange {
    background-color: orange;
}

.green {
    background-color: green;
}

.red {
    background-color: red;
}

.white {
    background-color: white;
}

.yellow {
    background-color: yellow;
}
</style>