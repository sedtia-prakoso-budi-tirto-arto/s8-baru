<template>
  <div
    class="w-full h-screen bg-[#FFF6E9] text-center relative overflow-hidden"
  >
    <div class="card flex justify-center">
      <Image
        src="/public/rect.png"
        alt="Image"
        width="100%"
        class="object-cover w-full h-full"
      />
    </div>
    <p
      class="brand absolute w-full top-0 md:top-[0rem] md:text-[6vh] text-[5vh] mt-4 text-white font-extrabold"
    >
      K-Juice
    </p>
    <p
      class="brand absolute w-full top-0 right-[-4rem] md:top-[5.25rem] md:text-[3vh] text-[5vh] mt-2 text-white font-extrabold"
    >
      booster
    </p>

    <div class="px-10 mt-3">
      <!-- Transition for product grid -->
      <transition :name="pageDirection" mode="out-in">
        <div class="grid grid-cols-2 gap-6" :key="currentPage">
          <div
            v-for="(product, index) in paginatedProducts"
            :key="index"
            class="border border-surface-200 dark:border-surface-700 rounded-2xl relative"
          >
            <!-- Price at the top-right corner in a circle -->
            <div
              class="absolute top-4 right-4 bg-[#F26B0F] text-white rounded-full px-4 py-1 text-xl font-semibold z-10"
            >
              {{ formatCurrency(product.price) }}
            </div>

            <div class="relative">
              <div class="relative mx-auto">
                <img
                  v-if="product.image"
                  :src="product.image"
                  :alt="product.name || 'Product Image'"
                  class="object-cover w-full h-[35vh] rounded-2xl"
                />
                <span v-else>No Image Available</span>
              </div>

              <!-- Name and Description Overlay -->
              <div
                class="absolute inset-0 flex flex-col justify-end items-center text-white p-4 bg-black bg-opacity-0"
              >
                <div class="font-semibold text-2xl">{{ product.name }}</div>
                <div class="text-md">{{ product.description }}</div>
              </div>
            </div>

            <!-- Price at the top-right corner in a circle -->
          </div>
        </div>
      </transition>

      <!-- Pagination Controls -->
      <div
        class="absolute bottom-10 w-full flex justify-center items-center mt-4"
      >
        <Button
          icon="pi pi-chevron-left"
          rounded
          severity="warn"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1, 'left')"
        />
        <span class="mx-7">Page {{ currentPage }} of {{ totalPages }}</span>
        <Button
          icon="pi pi-chevron-right"
          severity="warn"
          rounded
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1, 'right')"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

// Data produk
const products = ref([
  {
    name: "Mango Delight",
    description: "Jus mangga segar dengan tambahan madu.",
    price: 25000,
    image: "/orange.jpg",
  },
  {
    name: "Berry Bliss",
    description: "Campuran stroberi dan blueberry yang menyegarkan.",
    price: 30000,
    image: "/orange.jpg",
  },
  {
    name: "Tropical Punch",
    description: "Perpaduan nanas, jeruk, dan kelapa.",
    price: 28000,
    image: "/orange.jpg",
  },
  {
    name: "Green Detox",
    description: "Kombinasi apel hijau, bayam, dan seledri.",
    price: 27000,
    image: "/orange.jpg",
  },
  {
    name: "Apple Refresher",
    description: "Perpaduan apel segar dan jus lemon.",
    price: 24000,
    image: "/orange.jpg",
  },
  {
    name: "Citrus Boost",
    description: "Campuran jeruk dan lemon yang menyegarkan.",
    price: 22000,
    image: "/orange.jpg",
  },
]);

// Current page and items per page
const currentPage = ref(1);
const itemsPerPage = 4;

// Total number of pages
const totalPages = computed(() => {
  return Math.ceil(products.value.length / itemsPerPage);
});

// Function to get the products for the current page
const paginatedProducts = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return products.value.slice(startIndex, endIndex);
});

// Page direction for transition
const pageDirection = ref("slide-fade-left");

// Change page and set page direction
const goToPage = (page, direction) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    pageDirection.value =
      direction === "left" ? "slide-fade-left" : "slide-fade-right";
  }
};

// Fungsi untuk format harga
const formatCurrency = (value) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0, // Menghilangkan angka desimal
  }).format(value);
};
</script>

<style>
.brand {
  font-family: "Coiny", system-ui;
  font-weight: 100;
  font-style: normal;
}

/* Slide transition effect */
.slide-fade-left-enter-active,
.slide-fade-left-leave-active,
.slide-fade-right-enter-active,
.slide-fade-right-leave-active {
  transition: transform 0.5s ease-in-out, opacity 0.5s ease-in-out;
}

.slide-fade-left-enter,
.slide-fade-left-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.slide-fade-right-enter,
.slide-fade-right-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
</style>
