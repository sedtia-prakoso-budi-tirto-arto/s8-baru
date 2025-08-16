<template>
  <div class="h-screen bg-[#FCC737] text-center">
    <div class="card flex justify-center">
      <Image src="/splash.png" alt="Image" width="700" class="md:mt-[-2rem]" />
    </div>
    <p
      class="absolute w-full bottom-[12.5rem] md:bottom-[16.5rem] text-[4.5vh] mt-6 text-white"
    >
      Ready to grab your
    </p>
    <p
      class="absolute w-full bottom-[10rem] md:bottom-[13rem] text-[4.5vh] mt-6 text-white"
    >
      <strong>Favorite</strong> one?
    </p>
    <div class="absolute bottom-[3rem] md:bottom-[5rem] left-0 w-full flex">
      <Button
        label="Start Menu"
        severity="warn"
        rounded
        class="mx-auto p-3 md:p-5 w-[40vh] text-[3vh]"
      />
    </div>
  </div>
</template>
<script>
export default {};
</script>
<style lang=""></style>
