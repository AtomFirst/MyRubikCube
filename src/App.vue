<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'
import RubikCube from './components/RubikCube.vue';
</script>

<template>
  <header>
    <div>
      <HelloWorld msg="我的魔方"/>
    </div>
  </header>

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

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }
}
</style>
