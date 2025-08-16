import { defineStore } from "pinia";

export const useImageStore = defineStore("image", {
  state: () => ({
    imageUrl: null,
    customerId: null,
    selectedImages: [], // Array untuk menyimpan gambar yang dipilih
  }),
  actions: {
    setImageUrl(url) {
      this.imageUrl = url;
    },
    setCustomerId(id) {
      this.customerId = id;
    },
    resetImageUrl() {
      this.imageUrl = null; // Menghapus nilai imageUrl
    },
    resetCustomerId() {
      this.customerId = null; // Menghapus nilai customerId
    },
    setSelectedImages(images) {
      this.selectedImages = images; // Mengatur gambar yang dipilih
    },
    clearSelectedImages() {
      this.selectedImages = []; // Menghapus semua gambar yang dipilih
    },
  },
});
