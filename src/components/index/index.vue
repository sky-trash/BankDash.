<script setup>
import Dash from "../layout/dash/dash.vue"
import Header from "../layout/header/header.vue"
import Home from "../home/home.vue"
</script>
<template>
  <main>
    <Dash />
    <div>
      <Header />
      <Home />
    </div>
  </main>
</template>
<style>
main {
  display: flex;
}
</style>