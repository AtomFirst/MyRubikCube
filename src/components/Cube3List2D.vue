<script setup lang="ts">
import { computed } from "vue";
import type { Cube3 } from '@/rubik-cube/rubik-cube';
import Cube32D from "./Cube32D.vue"

const props=defineProps({
    show_history:Boolean,
    cube3list:Array<Cube3>
});

const cube3reverse=computed(()=>(props.cube3list as Array<Cube3>).slice().reverse());

</script>

<template>
    <ul class="grid">
            <div v-if="show_history" v-for="(c,i) in cube3reverse">
                <h2>{{ cube3reverse.length-i-1 }}</h2>
                <Cube32D :cube3="c" />
            </div>
            <div v-else>
                <h2>{{ cube3reverse.length-1 }}</h2>
                <Cube32D :cube3="cube3reverse[0]" />
            </div>
        </ul>
</template>

<style scoped>
::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
}

.grid {
    list-style-type: none; /* 去掉默认的列表符号 */
    display: grid;
    grid-template-columns: repeat(auto-fill, 12em);
    gap: 3em; /* 可选：设置列表项之间的间距 */
    max-height: 98%;
    overflow-y: auto;
}
</style>