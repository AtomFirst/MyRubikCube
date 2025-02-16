<script setup lang="ts">
import RubikCube from './components/RubikCube.vue';
</script>

<template>
  <main>
    <RubikCube/>
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
}

main {
  background-color: darkgray;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

.wrapper {
  display: flex;
  flex-direction: column;
  place-items: flex-start;
  flex-wrap: wrap;
}
</style>
