<template>
  <div id="app">
    <Suspense>
      <router-view />
    </Suspense>
    <Toast
      position="top-right"
      class="max-w-[80%] lg:max-w-2xl mx-auto"
      group="tr"
    />
    <ConfirmDialog class="w-[90%] lg:w-[30%]"></ConfirmDialog>
  </div>
</template>

<script>
export default {
  name: "App",
};
</script>
