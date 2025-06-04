<script setup>
import Header from "../header/header.vue"
import Dash from "../dash/dash.vue"
</script>
<template>
  <main class="main">
    <Dash/>
    <Header/>
  </main>
</template>
<style>
@import "./board.scss";

.main {
  display: flex;
}
</style>