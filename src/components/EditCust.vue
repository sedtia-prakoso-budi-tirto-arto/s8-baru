<template>
  <div
    v-if="!isLoggedIn"
    class="h-screen bg-[#F4F4F5] flex items-center justify-center p-6"
  >
    <div class="bg-white shadow-md rounded-xl p-6 w-full max-w-md">
      <LottieAnimation
        :animationData="animationRef"
        :height="250"
        :width="250"
      />

      <!-- Title -->
      <h2 class="text-2xl mt-[-2rem] font-bold mb-14 text-center text-gray-700">
        Masuk Galeri
      </h2>

      <!-- Autocomplete with Virtual Scrolling -->
      <div class="mb-4">
        <label
          for="autocomplete"
          class="block text-sm font-medium text-gray-600 mb-2"
          >Cari data customer</label
        >
        <div class="card flex justify-center">
          <AutoComplete
            v-model="selectedItem"
            :suggestions="filteredItems"
            @complete="searchItems"
            :virtualScrollerOptions="{ itemSize: 38 }"
            optionLabel="label"
            dropdown
            class="w-full"
            placeholder="Cari item..."
            :itemTemplate="itemTemplate"
          />
        </div>
      </div>

      <!-- Input OTP -->
      <!-- <div class="mb-6">
          <label class="block text-sm text-center font-medium text-gray-400 mb-4">
            Masukkan Kode Anda
          </label>
          <div class="card flex justify-center">
            <InputOtp v-model="otp" variant="filled" :length="4" />
          </div>
        </div> -->

      <!-- Error Message Display -->
      <div v-if="errorMessage" class="text-red-500 text-sm text-center mb-4">
        {{ errorMessage }}
      </div>

      <!-- Login Button -->
      <div class="mt-6 text-center">
        <button
          @click="handleMasuk"
          class="w-full py-2 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-300"
        >
          Masuk
        </button>
      </div>
    </div>
  </div>

  <!-- Full-screen Gallery -->
  <div v-if="isLoggedIn" class="w-full min-h-screen bg-white p-4">
    <div class="card mb-2" v-if="loadingGallery">
      <ProgressBar :value="progressFoto"></ProgressBar>
    </div>
    <div v-if="galleryToShow.length > 0">
      <div class="flex justify-between lg:px-4 py-1">
        <Button
          icon="pi pi-arrow-left"
          severity="secondary"
          variant="text"
          rounded
          aria-label="back"
          @click="confirmLogout"
          class="mr-2 lg:mr-4 bg-white border-none"
        />
        <div class="flex justify-between w-full gap-2">
          <h3
            v-if="!isGalleryEditMode"
            class="text-xl md:text-2xl lg:text-2xl font-semibold text-gray-700 mt-1"
          >
            Pilih Foto
          </h3>
          <h3
            v-if="isGalleryEditMode"
            class="text-xl md:text-2xl lg:text-2xl font-semibold text-gray-700 mt-1"
          >
            Hasil Edit
          </h3>
          <div class="flex gap-2">
            <!-- Conditionally render the button when galleryEdit.length > 0 -->
            <!-- <Button
              v-if="ratingValue > 0 && !isGalleryEditMode"
              size="small"
              severity="primary"
              class="mb-6 px-4 text-xs md:text-lg lg:text-lg"
              @click="handleDownloadMentah()"
              icon="pi pi-download"
              :loading="isLoadingDownload"
            /> -->
            <Button
              v-if="galleryEdit.length > 0 && !isGalleryEditMode"
              icon="pi pi-image"
              size="small"
              label="Hasil Edit"
              severity="primary"
              variant="contained"
              class="mb-6 px-4 text-xs md:text-lg lg:text-lg"
              @click="toggleGallery"
            />
            <Button
              v-if="galleryEdit.length > 0 && isGalleryEditMode"
              icon="pi pi-image"
              label="Foto mentah"
              severity="primary"
              variant="contained"
              class="mb-6 px-4 text-xs md:text-lg lg:text-lg"
              @click="toggleGallery"
            />
          </div>
        </div>
      </div>

      <!-- Gallery Images Section with Skeleton Loader -->
      <div
        class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
      >
        <Skeleton
          width="12rem"
          height="9rem"
          v-if="loadingGallery"
          v-for="(image, index) in galleryToShow"
          :key="index"
          class="bg-gray-200 rounded-lg mb-3"
        />

        <div
          v-for="(image, index) in galleryToShow"
          :key="index"
          class="relative group bg-gray-100 rounded-lg mb-3"
        >
          <!-- Wrapper for Image and Filename -->
          <div class="flex flex-col items-center">
            <!-- Image element with PrimeVue Image component -->
            <Image alt="Foto" :src="image.url" preview>
              <template #previewicon>
                <i class="pi pi-search"></i>
              </template>
              <template #image>
                <img
                  :src="image.url"
                  alt="image"
                  class="w-full h-full object-cover rounded-lg shadow-md group-hover:opacity-60"
                />
              </template>
              <template #preview="slotProps">
                <img
                  :src="image.url"
                  alt="preview"
                  :style="slotProps.style"
                  @click="slotProps.onClick"
                />
              </template>
            </Image>
          </div>

          <!-- Display filename below image -->
          <div class="text-center text-sm text-gray-500 py-1">
            {{ decodeURIComponent(image.url.split("%2F").pop().split("?")[0]) }}
          </div>

          <!-- Add checkbox for selecting images -->
          <Checkbox
            v-if="!isGalleryEditMode"
            v-model="selectedImages"
            :value="image"
            size="large"
            :disabled="
              selectedImages.length >= pilFoto &&
              !selectedImages.includes(image)
            "
            class="absolute top-2 left-2"
          />

          <!-- Comment Box Overlaying Image -->
          <div
            v-if="selectedImages.includes(image)"
            class="rounded-md bg-gray-100 text-white p-1 text-xs md:text-sm rounded-tl-none rounded-tr-none"
          >
            <textarea
              v-model="imageComments[image.url]"
              maxlength="250"
              placeholder="Tulis permintaan atau komentar..."
              rows="4"
              class="p-inputtext p-component w-full border rounded-lg bg-white text-black"
            ></textarea>
          </div>

          <!-- Pilih BG Button for each image -->
          <div
            v-if="
              !imageBackgrounds[image.url] && selectedImages.includes(image)
            "
            class="absolute top-0 right-0 rounded-md text-white p-1 text-xs md:text-sm"
          >
            <Button label="Pilih BG" @click="openBgModal(image)" />
          </div>

          <!-- Background Thumbnail after selection -->
          <div
            v-if="imageBackgrounds[image.url] && selectedImages.includes(image)"
            class="absolute top-0 right-0 p-1 rounded-md"
          >
            <img
              :src="imageBackgrounds[image.url]"
              alt="Selected Background"
              class="w-16 h-16 object-cover border-2 border-white rounded-md shadow-sm"
              @click="openBgModal(image)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- If gallery is empty, show a message and the logout button -->
    <div
      v-else
      class="relative w-full h-screen flex flex-col items-center justify-center text-center"
    >
      <Button
        icon="pi pi-arrow-left"
        variant="text"
        severity="secondary"
        rounded
        @click="confirmLogout"
        class="absolute top-4 left-4 bg-white border-none"
      />
      <p class="text-lg text-gray-600">
        Galeri Anda kosong. Silakan foto terlebih dahulu.
      </p>
    </div>

    <!-- Rating FG Dialog -->
    <!-- <ConfirmDialog group="headless" class="w-[90%] w-[30%]">
      <template #container="{ message, acceptCallback, rejectCallback }">
        <div
          class="flex flex-col items-center p-8 bg-surface-0 dark:bg-surface-900 rounded"
        >
          <div
            class="rounded-full bg-primary text-primary-contrast inline-flex justify-center items-center h-24 w-24 -mt-20"
          >
            <i class="pi pi-star text-5xl"></i>
          </div>
          <span class="font-bold text-2xl block mb-2 mt-6">{{
            message.header
          }}</span>
          <p class="mb-0">{{ message.message }}</p>
          <p class="text-sm mt-2 text-gray-500">
            Sebagai syarat ke proses selanjutnya
          </p>

          <div class="my-4">
            <Rating
              v-model="ratingValue"
              cancel
              icon="pi pi-star-o"
              class="text-yellow-500"
            />
          </div>

          <div class="my-2 w-full">
            <textarea
              v-model="feedback"
              placeholder="Tulis kritik & saran Anda di sini..."
              rows="4"
              class="p-inputtext p-component w-full border rounded-lg"
            ></textarea>
          </div>

          <div class="flex items-center gap-2 mt-6">
            <Button
              label="Batal"
              outlined
              @click="handleReject(rejectCallback)"
            />
            <Button label="Simpan" @click="handleAccept(acceptCallback)" />
          </div>
        </div>
      </template>
    </ConfirmDialog> -->

    <!-- Rating Editor Dialog -->
    <!-- <ConfirmDialog group="editor" class="w-[90%] lg:w-[30%]">
      <template #container="{ message, acceptCallback, rejectCallback }">
        <div
          class="flex flex-col items-center p-8 bg-surface-0 dark:bg-surface-900 rounded"
        >
          <div
            class="rounded-full bg-primary text-primary-contrast inline-flex justify-center items-center h-24 w-24 -mt-20"
          >
            <i class="pi pi-star text-5xl"></i>
          </div>
          <span class="font-bold text-2xl block mb-2 mt-6">{{
            message.header
          }}</span>
          <p class="mb-0">{{ message.message }}</p>
          <p class="text-sm mt-2 text-gray-500 text-center">
            Sebagai syarat untuk download semua gambarnya
          </p>

          <div class="my-4">
            <Rating
              v-model="ratingEditorValue"
              cancel
              icon="pi pi-star-o"
              class="text-yellow-500"
            />
          </div>

          <div class="my-2 w-full">
            <textarea
              v-model="feedbackEditor"
              placeholder="Tulis kritik & saran Anda di sini..."
              rows="4"
              class="p-inputtext p-component w-full border rounded-lg"
            ></textarea>
          </div>

          <div class="flex items-center gap-2 mt-6">
            <Button
              label="Batal"
              outlined
              @click="handleReject(rejectCallback)"
            />
            <Button
              label="Simpan"
              @click="handleAcceptEditor(acceptCallback)"
            />
          </div>
        </div>
      </template>
    </ConfirmDialog> -->

    <!-- Dialog Customer Service -->
    <!-- <ConfirmDialog group="cs" class="w-[90%] lg:w-[30%]">
      <template #container="{ message, acceptCallback, rejectCallback }">
        <div
          class="flex flex-col items-center p-8 bg-surface-0 dark:bg-surface-900 rounded"
        >
          <div
            class="rounded-full bg-primary text-primary-contrast inline-flex justify-center items-center h-24 w-24 -mt-20"
          >
            <i class="pi pi-star text-5xl"></i>
          </div>
          <span class="font-bold text-2xl block mb-2 mt-6">{{
            message.header
          }}</span>
          <p class="mb-0">{{ message.message }}</p>

          <div class="my-4">
            <Rating
              v-model="ratingCSValue"
              cancel
              icon="pi pi-star-o"
              class="text-yellow-500"
            />
          </div>

          <div class="my-2 w-full">
            <textarea
              v-model="feedbackCS"
              placeholder="Tulis feedback untuk CS di sini..."
              rows="4"
              class="p-inputtext p-component w-full border rounded-lg"
            ></textarea>
          </div>

          <div class="flex items-center gap-2 mt-6">
            <Button
              label="Batal"
              outlined
              @click="handleReject(rejectCallback)"
            />
            <Button label="Simpan" @click="handleCSAccept(acceptCallback)" />
          </div>
        </div>
      </template>
    </ConfirmDialog> -->

    <Dialog
      v-model:visible="isConfirmationDialogVisible"
      header="Mau Tambah?"
      modal
      :closable="false"
      :style="{ width: '350px', textAlign: 'center' }"
    >
      <p class="text-center text-justify px-3">
        Jika Anda ingin menambah kuota pilihan foto atau tambah cetak silahkan
        hubungi cs : <strong>081945111172</strong>
      </p>
      <div class="flex justify-end gap-2 mt-8">
        <!-- <Button
            severity="secondary"
            variant="outlined"
            label="Batal"
            class="p-button-text"
            @click="isConfirmationDialogVisible = false"
          /> -->
        <Button label="OK" class="p-button-primary" @click="confirmAction" />
      </div>
    </Dialog>

    <!-- Modal for displaying images -->
    <Dialog
      v-model:visible="showBgModal"
      :closable="true"
      modal
      header="Pilih Background"
      class="max-w-lg"
    >
      <div class="p-4">
        <div class="grid grid-cols-2 gap-4">
          <div
            v-for="bgImage in pilBg"
            :key="bgImage"
            class="bg-image-container cursor-pointer transition-transform transform hover:scale-105"
          >
            <img
              :src="bgImage"
              alt="Background Image"
              class="rounded-lg shadow-lg w-full h-auto object-cover"
              @click="setBackground(bgImage)"
            />
          </div>
        </div>
      </div>
    </Dialog>

    <!-- Tombol Lanjut -->
    <Button
      v-if="galleryToShow.length > 0 && !isGalleryEditMode"
      class="fixed bottom-6 text-sm right-6 py-3 px-6 text-white rounded-full shadow-lg text-lg"
      @click="requireConfirmation()"
      icon="pi pi-sparkles mr-2"
      label="Proseskan Edit"
      :loading="loadingProseskan"
    />

    <!-- Tombol Download -->
    <!-- <Button
      v-if="ratingValue > 0 && isGalleryEditMode && galleryEdit.length > 0"
      severity="primary"
      class="fixed bottom-6 text-sm right-6 py-3 px-6 text-white rounded-full shadow-lg text-lg"
      @click="requireConfirmationDownload()"
      icon="pi pi-download mr-2"
      label="Download"
      :loading="isLoadingDownload"
    /> -->
  </div>
</template>

<script setup>
import {
  ref,
  reactive,
  onMounted,
  onBeforeUnmount,
  watch,
  computed,
} from "vue";
import { ref as dbRef, get, set, update, onValue } from "firebase/database"; // Firebase Database
import { db } from "../firebase";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { useRouter } from "vue-router";
import Image from "primevue/image";
import io from "socket.io-client";
import Button from "primevue/button";
import { useImageStore } from "../store"; // Import store
import {
  getStorage,
  ref as storageRef,
  listAll,
  getDownloadURL,
} from "firebase/storage";
import Animation from "../assets/animation.json";

const router = useRouter();
const confirm = useConfirm();
const toast = useToast();
const orderId = ref(localStorage.getItem("orderId"));
const lokasi = import.meta.env.VITE_LOCATION;
const otp = ref(""); // To store the OTP
const selectedItem = ref(null); // To store the selected item from autocomplete
const filteredItems = ref([]); // To store filtered items
const galleryImages = ref([]); // To store gallery images
const galleryEdit = ref([]); // To store edit gallery images
const galleryDownload = ref([]); // To store download gallery images
const isLoggedIn = ref(false); // To track if the user is logged in
let socket = null; // Socket variable declaration
const errorMessage = ref(""); // To store the error message
const loadingGallery = ref(true); // To track if the gallery is loading
const ip = import.meta.env.VITE_SERVER_IP;
const isMobile = ref(false); // Status apakah perangkat adalah smartphone
const isLoadingDownload = ref(false); // To track if the download is loading
const email = ref("");
const fg = ref(null);
const editor = ref(null);
const cs = ref(null);
const showRatingDialog = ref(false); // Rating dialog visibility state
const ratingValue = ref(0); // Rating value
const ratingEditorValue = ref(0); // Rating value for editor
const ratingCSValue = ref(0); // Rating value for CS
const showModal = ref(false); // Layout modal visibility state
const feedback = ref(""); // Store the feedback
const feedbackEditor = ref(""); // Store the feedback for editor
const feedbackCS = ref(""); // Store the feedback for CS
const imageComments = reactive({});
const fullScreenVisible = ref(false);
const fullScreenImage = ref(null);
const isConfirmationDialogVisible = ref(false); // Kontrol visibilitas dialog
const confirmCallback = ref(null); // Callback untuk konfirmasi
const animationRef = ref(Animation); // Referensi animasi
const isGalleryEditMode = ref(false);
const ratingFG = ref(0); // Rating fotografer
const savedComments = ref([]); // Array untuk menyimpan komentar yang sudah ada
const pilBg = ref([]);
const pilFoto = ref(0);
const pilPaket = ref("");
const showBgModal = ref(false);
const bgImages = ref([]);
const imageBackgrounds = reactive({});
const selectedImageForBg = ref(null);
const loadingProseskan = ref(false);
const totalFoto = ref(0);
const progressFoto = ref(0);

// State untuk multi-select
const isMultiSelect = ref(false); // Toggle untuk multi-select
const selectedImages = ref([]); // Array untuk menyimpan gambar yang dipilih

// New property for toggling background removal
const useRemoveBg = ref(false);

const galleryStore = useImageStore(); // Akses store

// Fungsi untuk mengecek ukuran layar
// const checkIsMobile = () => {
//   isMobile.value = window.innerWidth <= 768;
// };

// Searching items for autocomplete
const searchItems = async (event) => {
  const query = event.query.toLowerCase();
  const ordersRef = dbRef(db, `${lokasi}/orders`);
  const snapshot = await get(ordersRef);

  if (snapshot.exists()) {
    const orders = snapshot.val();
    const items = Object.values(orders)
      .map((order) => {
        // Check if hasilEdit exists and has a value
        if (order.ratingFG) {
          return {
            id: order.orderId,
            name: order.name,
            paket: order.services[0].name,
            email: order.email,
            label: `${capitalize(order.name)} | ${capitalize(
              order.services[0].name
            )} | ${capitalize(order.email)}`, // Format label for display
          };
        }
        return null; // If hasilEdit doesn't exist, return null
      })
      .filter((item) => item !== null); // Remove null items

    filteredItems.value = items.filter((item) =>
      item.label.toLowerCase().includes(query)
    );
  } else {
    filteredItems.value = [];
  }

  console.log("Filtered items:", filteredItems.value);
};

// Template for autocomplete item
const itemTemplate = (item) => {
  return `
          <div>
            <div><strong>${item.name}</strong> | Paket: ${item.paket} | Email: ${item.email}</div>
          </div>
        `;
};

// Capitalize string helper
const capitalize = (str) => {
  if (!str) return str;
  return str
    .split(" ") // Memisahkan string menjadi array berdasarkan spasi
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Kapitalisasi setiap kata
    .join(" "); // Menggabungkan kembali menjadi string
};

const confirmAction = () => {
  if (confirmCallback.value) {
    confirmCallback.value(); // Jalankan callback yang sudah diset
    confirmCallback.value = null; // Reset callback
  }
  isConfirmationDialogVisible.value = false; // Tutup dialog
};

const openBgModal = async (image) => {
  selectedImageForBg.value = image;

  // Open the modal
  showBgModal.value = true;
};

const setBackground = (selectedBg) => {
  if (selectedImageForBg) {
    console.log(selectedImageForBg.value);
    imageBackgrounds[selectedImageForBg.value.url] = selectedBg; // Save background for the specific image
    showBgModal.value = false; // Close modal
  }
};

const downloadImage = async (url, filename) => {
  try {
    // Membuat elemen <a> baru
    const link = document.createElement("a");

    // Menyeting href ke URL gambar yang ingin diunduh
    link.href = url;

    // Menyeting nama file yang akan digunakan saat mengunduh
    link.download = filename;

    // Menambahkan elemen link ke body
    document.body.appendChild(link);

    // Menyimulasikan klik pada elemen link untuk memulai pengunduhan
    link.click();

    // Menghapus elemen link setelah selesai
    document.body.removeChild(link);
  } catch (error) {
    console.error("Terjadi kesalahan saat mengunduh gambar:", error);
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const handleDownloadMentah = async () => {
  isLoadingDownload.value = true;
  const downloadPath = `${lokasi}/${orderId.value}`;
  console.log(downloadPath);
  const storage = getStorage();
  const downloadFolderRef = storageRef(storage, downloadPath);

  try {
    // List semua file di folder download
    const listDownloadResult = await listAll(downloadFolderRef);

    console.log(listDownloadResult);

    // Tambahkan file ke galleryDownload
    await addImagesToGallery(listDownloadResult, galleryDownload);

    // Validasi apakah galleryDownload memiliki gambar
    if (galleryDownload.value.length === 0) {
      toast.add({
        severity: "warn",
        summary: "Tidak Ada Gambar",
        detail: "Tidak ada gambar untuk diunduh.",
        group: "tr",
        life: 3000,
      });
      return;
    }

    // Unduh semua gambar dari galleryDownload
    for (let i = 0; i < galleryDownload.value.length; i++) {
      const image = galleryDownload.value[i];
      console.log("Downloading image:", image.url);

      const filename = `image_${i + 1}.jpg`; // Nama file unduhan
      await downloadImage(image.url, filename); // Pastikan downloadImage mendukung async

      // Tambahkan jeda 3 detik antara pengunduhan
      await delay(3000); // Fungsi delay harus disediakan
    }

    toast.add({
      severity: "success",
      summary: "Download Berhasil",
      detail: "Semua gambar berhasil diunduh.",
      group: "tr",
      life: 3000,
    });
  } catch (error) {
    console.error("Terjadi kesalahan saat mengunduh gambar:", error);
    toast.add({
      severity: "error",
      summary: "Download Gagal",
      detail: "Gagal mengunduh gambar. Periksa koneksi atau file yang diunduh.",
      group: "tr",
      life: 3000,
    });
  }
  isLoadingDownload.value = false;
};

const handleDownload = async () => {
  isLoadingDownload.value = true;
  try {
    // Unduh semua gambar dari galleryEdit
    for (let i = 0; i < galleryEdit.value.length; i++) {
      const image = galleryEdit.value[i];
      const filename = `editedImage_${i + 1}.jpg`;
      await downloadImage(image.url, filename);

      // Tambahkan jeda 1 detik antara pengunduhan
      await delay(3000);
    }

    // Update status menjadi done setelah semua gambar diunduh
    const statusRef = dbRef(db, `${lokasi}/orders/${orderId.value}`);
    const timestampDone = new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
    });

    await update(statusRef, {
      status: "done",
      timestamp_done: timestampDone, // Menambahkan timestamp_done dengan format waktu lokal
    });

    toast.add({
      severity: "success",
      summary: "Download Berhasil",
      detail: "Semua gambar berhasil diunduh.",
      group: "tr",
      life: 3000,
    });
  } catch (error) {
    console.error("Terjadi kesalahan saat mengunduh gambar:", error);
    toast.add({
      severity: "error",
      summary: "Download Gagal",
      detail: "Gagal mengunduh gambar.",
      group: "tr",
      life: 3000,
    });
  }
  isLoadingDownload.value = false;
};

const loadSavedSelections = async () => {
  try {
    // Pastikan selectedImages sudah dimuat sebelumnya
    // selectedImages.value.forEach((selectedImage) => {
    //   const foundIndex = galleryToShow.value.findIndex(
    //     (img) => img.url === selectedImage.url
    //   );

    //   if (foundIndex !== -1) {
    //     galleryToShow.value.splice(foundIndex, 1); // Hapus dari posisi lama
    //     galleryToShow.value.unshift(selectedImage); // Masukkan di posisi paling atas
    //   }
    // });

    // Referensi ke path data
    const pilPaketRef = dbRef(
      db,
      `${lokasi}/orders/${orderId.value}/services/0/name`
    );
    const pilFotoRef = dbRef(db, `${lokasi}/orders/${orderId.value}/pilFoto`);
    const pilBgRef = dbRef(db, `${lokasi}/orders/${orderId.value}/pilBg`);
    const ratingFgRef = dbRef(db, `${lokasi}/orders/${orderId.value}/ratingFG`);
    const totalFotoRef = dbRef(
      db,
      `${lokasi}/orders/${orderId.value}/totalFoto`
    );

    // Ambil data dari Firebase
    const [
      pilPaketSnapshot,
      pilFotoSnapshot,
      pilBgSnapshot,
      ratingFgSnapshot,
      totalFotoSnapshot,
    ] = await Promise.all([
      get(pilPaketRef),
      get(pilFotoRef),
      get(pilBgRef),
      get(ratingFgRef),
      get(totalFotoRef),
    ]);

    // Periksa apakah data tersedia
    pilPaket.value = pilPaketSnapshot.val();
    pilFoto.value = pilFotoSnapshot.exists()
      ? Number(pilFotoSnapshot.val())
      : 0;
    totalFoto.value = totalFotoSnapshot.val();

    if (pilBgSnapshot.exists()) {
      const pilBgData = pilBgSnapshot.val();
      if (Array.isArray(pilBgData)) {
        pilBg.value = pilBgData.map((item) => item.value);
      } else {
        pilBg.value = pilBgData; // Default jika bukan array
      }
    } else {
      pilBg.value = []; // Default jika tidak ada data
    }

    ratingValue.value = ratingFgSnapshot.val();

    // Tampilkan data atau proses sesuai kebutuhan
    console.log("Pil Paket:", pilPaket.value);
    console.log("Pil Foto:", pilFoto.value);
    console.log("Pil Background:", pilBg.value);
    console.log("rating FG : ", ratingValue.value);
    console.log("Total Foto : ", totalFoto.value);
  } catch (error) {
    console.error("Gagal memuat data Pilihan Foto atau Background:", error);
  }
};

// Fungsi untuk memuat komentar yang sudah ada dari Firebase
const loadSavedComments = async () => {
  try {
    const commentsRef = dbRef(db, `${lokasi}/orders/${orderId.value}/comments`);

    // Gunakan `get` untuk mengambil data satu kali secara async
    const snapshot = await get(commentsRef);

    if (snapshot.exists()) {
      const savedComments = snapshot.val(); // Data dari Firebase
      console.log("Saved comments:", savedComments);

      // Pastikan data adalah array
      if (Array.isArray(savedComments)) {
        // Iterasi array komentar
        savedComments.forEach((savedComment, index) => {
          if (savedComment?.url) {
            // Ekstrak dan decode nama file dari URL Firebase
            const savedFileName = decodeURIComponent(
              savedComment.url
                .split("%2F")
                .pop()
                .split("?")[0]
                .replace(/_thumb/, "")
            );

            console.log("savedFileName", savedFileName);

            let imgUrl = null;

            const image = galleryToShow.value?.find((img) => {
              const galleryFileName = decodeURIComponent(
                img.url.split("%2F").pop().split("?")[0]
              ).replace(/_thumb/, "");

              console.log(galleryFileName);
              imgUrl = img;
              return galleryFileName === savedFileName;
            });

            if (image) {
              // Hindari duplikasi
              const isAlreadySelected = selectedImages.value.some(
                (img) => img.url === image.url
              );

              if (!isAlreadySelected) {
                selectedImages.value.push(image); // Tambahkan gambar ke selectedImages
              }

              // Simpan komentar secara reaktif
              const url = imgUrl?.url || savedComment.url;

              imageComments[url] = savedComment.comment || "";
              imageBackgrounds[url] = savedComment.bg || "";
            } else {
              console.warn(
                `Image with file name ${savedFileName} not found in galleryToShow`
              );
            }
          } else {
            console.warn(
              `Comment at index ${index} is missing 'url' property:`,
              savedComment
            );
          }
        });
      } else {
        console.warn(
          "Expected savedComments to be an array, but got:",
          typeof savedComments
        );
      }
    } else {
      console.log("No comments found.");
    }
  } catch (error) {
    console.error("Error loading comments:", error);
  }
};

const galleryToShow = computed(() => {
  return isGalleryEditMode.value ? galleryEdit.value : galleryImages.value;
});

const toggleGallery = () => {
  isGalleryEditMode.value = !isGalleryEditMode.value;
};

const openLayoutModal = () => {
  showRatingDialog.value = false; // Close rating dialog
  showModal.value = true; // Open layout modal
};

const requireConfirmation = () => {
  loadingProseskan.value = true;
  console.log("Selected images:", selectedImages.value);
  console.log("Comments:");

  // Referensi ke database
  const statusRef = dbRef(db, `${lokasi}/orders/${orderId.value}/status`);
  const fgRef = dbRef(db, `${lokasi}/orders/${orderId.value}/ratingFG`);

  // Periksa status order
  get(statusRef)
    .then((statusSnapshot) => {
      if (
        statusSnapshot.val() === "editting" ||
        statusSnapshot.val() === "done"
      ) {
        loadingProseskan.value = false;
        toast.add({
          severity: "warn",
          summary: "Sudah Dipilih",
          detail:
            "Anda sudah melakukan pemilihan foto sebelumnya dan sudah diproses editting.",
          group: "tr",
          life: 3000,
        });
      } else {
        // Periksa nilai ratingFG
        handleAccept(() => {
          // toast.add({
          //   severity: "info",
          //   summary: "Action Confirmed",
          //   detail: "Proses diteruskan tanpa perlu konfirmasi ulang.",
          //   group: "tr",
          //   life: 3000,
          // });
        });
        loadingProseskan.value = false;
      }
    })
    .catch((error) => {
      console.error("Error checking status:", error);
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "Terjadi kesalahan saat memeriksa status.",
        group: "tr",
        life: 3000,
      });
    });
  loadingProseskan.value = false;
};

const requireConfirmationDownload = () => {
  isLoadingDownload.value = true;
  // Cek apakah sudah ada rating di database
  const ratingEditorRef = dbRef(
    db,
    `${lokasi}/orders/${orderId.value}/ratingEditor`
  );
  const ratingCSRef = dbRef(db, `${lokasi}/orders/${orderId.value}/ratingCS`);
  get(ratingEditorRef)
    .then((snapshot) => {
      isLoadingDownload.value = false;
      if (snapshot.exists()) {
        get(ratingCSRef).then((snapshot) => {
          if (snapshot.exists()) {
            handleDownload();
          } else {
            // Rating belum ada, tampilkan dialog rating
            if (cs.value) {
              console.log(cs.value);
              confirm.require({
                group: "cs",
                header: "Rate CS",
                message: `Mohon berikan rating untuk ${cs.value}`,
                accept: () => {
                  toast.add({
                    severity: "info",
                    summary: "Rating Saved",
                    detail: `You rated: ${ratingCSValue.value}`,
                    group: "tr",
                    life: 3000,
                  });
                  handleDownload();
                },
                reject: () => {
                  // toast.add({
                  //   severity: "warn",
                  //   summary: "Rating Dibatalkan",
                  //   detail: "Anda belum memberikan rating.",
                  //   group: "tr",
                  //   life: 3000,
                  // });
                },
              });
            } else {
              toast.add({
                severity: "warn",
                summary: "Rating Error",
                detail: "Unable to load rating data.",
                group: "tr",
                life: 3000,
              });
            }
          }
        });
      } else {
        // Rating belum ada, tampilkan dialog rating
        if (editor.value) {
          console.log(editor.value);
          confirm.require({
            group: "editor",
            header: "Rate Editor",
            message: `Mohon berikan rating untuk ${editor.value}`,
            accept: () => {
              toast.add({
                severity: "info",
                summary: "Rating Saved",
                detail: `You rated: ${ratingEditorValue.value}`,
                group: "tr",
                life: 3000,
              });
            },
            reject: () => {
              // toast.add({
              //   severity: "warn",
              //   summary: "Rating Dibatalkan",
              //   detail: "Anda belum memberikan rating.",
              //   group: "tr",
              //   life: 3000,
              // });
            },
          });
        } else {
          toast.add({
            severity: "warn",
            summary: "Rating Error",
            detail: "Unable to load rating data.",
            group: "tr",
            life: 3000,
          });
        }
      }
    })
    .catch((error) => {
      console.error("Error checking rating:", error);
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "Terjadi kesalahan saat memeriksa rating.",
        group: "tr",
        life: 3000,
      });
    });
  isLoadingDownload.value = false;
};

// Watch for changes in imageComments
watch(
  imageComments,
  () => {
    selectedImages.value.forEach((image) => {
      const commentText = imageComments[image.url] || "";
      console.log(`Comment for ${image.url}: ${commentText}`);
    });
  },
  { deep: true }
);

const handleAccept = (acceptCallback) => {
  if (ratingValue.value > 0 || ratingFG.value > 0) {
    // Tampilkan dialog konfirmasi
    confirmCallback.value = () => {
      // Proses menyimpan komentar dan rating setelah konfirmasi
      const timestamp = new Date().toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
      });

      // Ubah array menjadi objek
      const imageCommentsData = {};
      selectedImages.value.forEach((image, index) => {
        const comment = imageComments[image.url] || "";
        const bg = imageBackgrounds[image.url] || "";
        console.log(
          `Image: ${image.url}, Bg: ${bg}, Comment: ${comment}, Timestamp: ${timestamp}`
        );
        imageCommentsData[`${index}`] = {
          url: image.url,
          bg,
          comment,
          timestamp_comment: timestamp,
        };
      });
      const commentsRef = dbRef(
        db,
        `${lokasi}/orders/${orderId.value}/comments`
      );

      // Ambil timestamp_orderEdit sebelumnya
      const orderRef = dbRef(db, `${lokasi}/orders/${orderId.value}/`);
      get(orderRef).then((snapshot) => {
        const orderData = snapshot.val();
        const initialTimestampOrderEdit =
          orderData?.timestamp_orderEdit || timestamp;

        // Fetch existing comments to find the next index
        get(commentsRef).then((commentsSnapshot) => {
          const existingComments = commentsSnapshot.val() || {}; // Ambil komentar yang sudah ada
          const nextIndex = Object.keys(existingComments).length; // Tentukan indeks berikutnya untuk komentar baru

          console.log(nextIndex);

          const newComments = {};
          selectedImages.value.forEach((image, index) => {
            console.log(index);
            console.log(nextIndex + index);
            const comment = imageComments[image.url] || "";
            const bg = imageBackgrounds[image.url] || "";
            const timestamp = new Date().toLocaleString("id-ID", {
              timeZone: "Asia/Jakarta",
            });

            // Jika tidak ada, tambahkan komentar baru dengan indeks yang sesuai
            newComments[index] = {
              url: image.url,
              bg,
              comment,
              timestamp_comment: timestamp,
            };
          });

          // Update komentar tanpa menimpa yang sudah ada
          set(commentsRef, newComments)
            .then(() => {
              console.log("Comments saved successfully!");
              toast.add({
                severity: "success",
                summary: "Comments Saved",
                detail: "Foto pilihan beserta request berhasil disimpan.",
                group: "tr",
                life: 3000,
              });

              // Update ratingFG dan field lainnya jika ratingFG > 0
              if (!ratingFG.value) {
                update(orderRef, {
                  ratingFG: ratingValue.value,
                  feedbackFG: feedback.value,
                  timestamp_orderEdit: initialTimestampOrderEdit, // Gunakan timestamp awal
                  status: "order edit", // Update status ke "order edit"
                })
                  .then(() => {
                    acceptCallback(); // Panggil callback jika berhasil
                    selectedImages.value = []; // Reset selected images
                  })
                  .catch((error) => {
                    console.error("Error updating rating:", error);
                    toast.add({
                      severity: "error",
                      summary: "Failed to save rating",
                      detail: "Something went wrong while saving your rating.",
                      group: "tr",
                      life: 3000,
                    });
                  });
              }
            })
            .catch((error) => {
              console.error("Error saving comments:", error);
              toast.add({
                severity: "error",
                summary: "Save Error",
                detail: "Gagal menyimpan pasangan foto dan komentar.",
                group: "tr",
                life: 3000,
              });
            });
        });
      });
    };

    isConfirmationDialogVisible.value = true;
    // confirmAction();
  } else {
    if (ratingFG.value === 0) {
      // Tampilkan peringatan jika rating tidak diisi
      toast.add({
        severity: "warn",
        summary: "No Rating",
        detail: "Isi rating dahulu sebelum melanjutkan.",
        group: "tr",
        life: 3000,
      });
    }
  }
};

const handleAcceptEditor = (acceptCallback) => {
  if (ratingEditorValue.value > 0) {
    // Proses untuk menyimpan rating editor
    const ratingRef = dbRef(db, `${lokasi}/orders/${orderId.value}/`);
    update(ratingRef, {
      ratingEditor: ratingEditorValue.value,
      feedbackEditor: feedbackEditor.value,
    })
      .then(() => {
        toast.add({
          severity: "success",
          summary: "Rating Editor Saved",
          detail: "Terima kasih atas rating untuk editor!",
          group: "tr",
          life: 3000,
        });

        // Tampilkan dialog CS setelah berhasil
        confirm.require({
          group: "cs",
          header: "Rating CS",
          message: `Berikan rating untuk ${cs.value}`,
          accept: () => handleCSSubmit(acceptCallback),
          reject: () => handleReject(acceptCallback),
        });
      })
      .catch((error) => {
        console.error("Error saving editor rating:", error);
        toast.add({
          severity: "error",
          summary: "Error",
          detail: "Terjadi kesalahan saat menyimpan rating editor.",
          group: "tr",
          life: 3000,
        });
      });
  } else {
    toast.add({
      severity: "warn",
      summary: "No Rating",
      detail: "Isi rating untuk editor terlebih dahulu.",
      group: "tr",
      life: 3000,
    });
  }
};

const handleCSSubmit = (acceptCallback) => {
  const ratingRef = dbRef(db, `${lokasi}/orders/${orderId.value}/`);
  update(ratingRef, {
    ratingCS: ratingCSValue.value,
    feedbackCS: feedbackCS.value,
  })
    .then(() => {
      toast.add({
        severity: "success",
        summary: "Rating CS Saved",
        detail: "Terima kasih atas rating untuk CS!",
        group: "tr",
        life: 3000,
      });
      acceptCallback(); // Panggil callback jika berhasil
    })
    .catch((error) => {
      console.error("Error saving CS feedback:", error);
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "Terjadi kesalahan saat menyimpan feedback CS.",
        group: "tr",
        life: 3000,
      });
    });
};

const handleCSAccept = (acceptCallback) => {
  if (ratingCSValue.value > 0) {
    // Panggil handleCSSubmit untuk menyimpan rating dan feedback CS
    handleCSSubmit(acceptCallback);
  } else {
    toast.add({
      severity: "warn",
      summary: "No Rating",
      detail: "Isi rating untuk Customer Service terlebih dahulu.",
      group: "tr",
      life: 3000,
    });
  }
};

const handleReject = (rejectCallback) => {
  rejectCallback();
  ratingValue.value = 0; // Reset the rating value
  ratingEditorValue.value = 0; // Reset the editor rating value
  ratingCSValue.value = 0; // Reset the CS rating value
};

watch(isMultiSelect, (newValue) => {
  if (!newValue) {
    selectedImages.value = []; // Clear selected images when switching to "PassPhoto"
  }
});

// Helper function to send the email batch
async function sendBatchEmail(batchFiles, batchCounter) {
  const formData = new FormData();

  // Append each file in the batch to the form data
  batchFiles.forEach((file, index) => {
    formData.append("files", file, `image-${batchCounter}-${index + 1}.jpg`);
  });

  // Add email to formData
  formData.append("email", email.value);

  try {
    // Send batch to backend
    const uploadResponse = await fetch("http://localhost:3300/send-raw", {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.text();
      console.error(`Upload failed: ${uploadResponse.status} - ${errorData}`);
      throw new Error(`HTTP error! Status: ${uploadResponse.status}`);
    }

    // Notify user of successful upload for the batch
    toast.add({
      group: "tr",
      severity: "success",
      summary: `Batch ${batchCounter} Dikirim`,
      detail: `Batch gambar berhasil dikirim.`,
    });
  } catch (error) {
    console.error(`Gagal mengirim gambar batch ${batchCounter}:`, error);
    toast.add({
      group: "tr",
      severity: "error",
      summary: `Gagal Mengirim Batch ${batchCounter}`,
      detail: `Batch gambar tidak berhasil dikirim.`,
    });
  }
}

// Fungsi untuk menambahkan gambar ke galeri
const addImagesToGallery = async (listResult, gallery) => {
  // Daftar ekstensi gambar yang diizinkan
  const allowedExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];

  // Hitung total item untuk progress
  const totalItems = listResult.items.length;

  let processedItems = 0; // Melacak jumlah item yang diproses

  for (const itemRef of listResult.items) {
    const url = await getDownloadURL(itemRef);
    const fileName = itemRef.name;

    // Periksa apakah fileName memiliki ekstensi yang valid
    const fileExtension = fileName.split(".").pop().toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      console.warn(
        `File "${fileName}" tidak ditambahkan karena bukan file gambar yang valid.`
      );
      processedItems++;
      progressFoto.value = Math.round((processedItems / totalItems) * 95);
      continue; // Lewati iterasi ini jika ekstensi tidak valid
    }

    // Periksa apakah fileName sudah ada dalam gallery
    const exists = gallery.value.some((image) => image.name === fileName);
    if (!exists) {
      gallery.value.push({
        name: fileName,
        url: url,
      });
    }

    // Update progress setelah item diproses
    processedItems++;
    progressFoto.value = Math.round((processedItems / totalItems) * 95);
  }

  console.log("Proses selesai, Progress:", progressFoto.value, "%");
};

// Fungsi utama untuk memuat galeri
const loadGallery = async (orderId) => {
  localStorage.setItem("visitedCustomer", "true");

  const storage = getStorage(); // Initialize Firebase Storage

  try {
    const folderPath = `${lokasi}/${orderId}/THUMB`;
    const editFolderPath = `${lokasi}/${orderId}_edit`;

    const folderRef = storageRef(storage, folderPath);
    const editFolderRef = storageRef(storage, editFolderPath);

    const listResult = await listAll(folderRef);
    const listEditResult = await listAll(editFolderRef);

    if (listResult.items.length === 0 && listEditResult.items.length === 0) {
      throw new Error("No images found in the specified order or edit folder.");
    }

    // Tambahkan gambar ke galeri yang sesuai
    await addImagesToGallery(listResult, galleryImages);
    await addImagesToGallery(listEditResult, galleryEdit);

    // Simpan ke localStorage
    localStorage.setItem("galleryImages", JSON.stringify(galleryImages.value));
    localStorage.setItem("galleryEdit", JSON.stringify(galleryEdit.value));
    localStorage.setItem(
      "galleryDownload",
      JSON.stringify(galleryDownload.value)
    );

    console.log("Gallery Images Loaded:", galleryImages.value); // Debugging
    console.log("Gallery Edit Loaded:", galleryEdit.value); // Debugging

    await loadSavedComments(); // Load saved comments from Firebase
    await loadSavedSelections();

    progressFoto.value = 100;

    // Tambahkan jeda 2 detik sebelum mengubah loadingGallery menjadi false
    await new Promise((resolve) => setTimeout(resolve, 3000));

    loadingGallery.value = false;

    console.log(`${lokasi}/orders/${orderId}/fg`);
    const fgRef = dbRef(db, `${lokasi}/orders/${orderId}/fg`);
    const editorRef = dbRef(db, `${lokasi}/orders/${orderId}/editor`);
    const csRef = dbRef(db, `${lokasi}/orders/${orderId}/cs`);

    // Fetch the snapshot from the database
    await get(fgRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          // Data exists at the path, log it
          fg.value = snapshot.val();
          console.log("Fetched fg data:", fg.value);
        } else {
          // No data found at the path
          console.log("No data available at this path");
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });

    await get(editorRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          // Data exists at the path, log it
          editor.value = snapshot.val();
          console.log("Fetched fg data:", editor.value);
        } else {
          // No data found at the path
          console.log("No data available at this path");
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });

    await get(csRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          // Data exists at the path, log it
          cs.value = snapshot.val();
          console.log("Fetched fg data:", cs.value);
        } else {
          // No data found at the path
          console.log("No data available at this path");
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  } catch (error) {
    console.error("Failed to load images:", error.message);
    galleryImages.value.splice(0, galleryImages.value.length);
    galleryEdit.value.splice(0, galleryEdit.value.length);
  } finally {
    loadingGallery.value = false; // Set loading state to false
  }
};

// Check session on page load
onMounted(async () => {
  const storedIsLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const storedOrderId = localStorage.getItem("orderId");
  const visitedCustomer = localStorage.getItem("visitedCustomer") === "true";
  const emailStored = localStorage.getItem("email");
  console.log(JSON.parse(localStorage.getItem("galleryImages")));

  email.value = emailStored;

  console.log("Stored isVisited:", visitedCustomer);
  console.log("Stored email:", emailStored);

  // checkIsMobile(); // Periksa ukuran layar saat komponen dimuat
  // window.addEventListener("resize", checkIsMobile); // Tambahkan listener untuk resize

  if (storedIsLoggedIn && storedOrderId) {
    isLoggedIn.value = true;
    orderId.value = storedOrderId;
    await loadGallery(orderId.value); // Load gallery images based on the stored orderId

    // Initialize socket connection
    socket = io(`http://${ip}`);
    socket.emit("joinOrder", storedOrderId); // Join the room for the stored orderId
    socket.on("connect", () => {
      console.log("Connected to Socket.io server");
    });

    socket.on("newImage", (data) => {
      console.log("Received new image event:", data); // Log data
      if (data.orderId === orderId.value) {
        loadGallery(orderId.value); // Reload images for the current order
      }
    });
  }
});

// Handle login
const handleMasuk = async () => {
  const ordersRef = dbRef(db, `${lokasi}/orders`);
  const snapshot = await get(ordersRef);

  // Reset error message
  errorMessage.value = "";

  if (!snapshot.exists()) {
    errorMessage.value = "Data tidak ditemukan!";
    return;
  }

  const orders = snapshot.val();

  if (otp.value) {
    // Validate with OTP
    const validOrder = Object.values(orders).find(
      (order) => order.kode === otp.value
    );

    if (validOrder) {
      const visitedCustomer = localStorage.getItem("visitedCustomer");
      console.log("Stored isVisited:", visitedCustomer);
      if (validOrder.orderId) {
        loadGallery(validOrder.orderId); // Load gallery images based on order ID
        orderId.value = validOrder.orderId; // Set the orderId to trigger socket connection
        email.value = validOrder.email; // Set the email to trigger socket connection
        isLoggedIn.value = true; // Set logged-in status
        localStorage.setItem("isLoggedIn", "true"); // Store session in localStorage
        localStorage.setItem("orderId", validOrder.orderId); // Store orderId in localStorage
        localStorage.setItem("email", validOrder.email); // Store email in localStorage

        // Initialize socket connection and join the room for this orderId
        socket = io(`http://${ip}`);
        socket.emit("joinOrder", validOrder.orderId); // Join the room for the specific orderId
        socket.on("connect", () => {
          console.log("Connected to Socket.io server");
        });

        socket.on("newImage", (data) => {
          console.log("Received new image event:", data); // Log data
          if (data.orderId === orderId.value) {
            loadGallery(orderId.value); // Reload images for the current order
          }
        });
      } else {
        console.error("ID tidak ditemukan pada validOrder!");
      }
    } else {
      errorMessage.value = "Kode salah!";
    }
  } else if (selectedItem.value) {
    // Validate with dropdown ID
    const validOrder = Object.values(orders).find(
      (order) => order.orderId === selectedItem.value.id
    );

    console.log("Selected Item ID:", validOrder); // Log the ID of the selected item

    if (validOrder) {
      const visitedCustomer = localStorage.getItem("visitedCustomer");
      console.log("Stored isVisited:", visitedCustomer);
      if (validOrder.orderId) {
        console.log("Order ID:", validOrder.orderId);
        loadGallery(validOrder.orderId); // Load gallery images based on order ID
        orderId.value = validOrder.orderId; // Set the orderId to trigger socket connection
        email.value = validOrder.email; // Set the email to trigger socket connection
        isLoggedIn.value = true; // Set logged-in status
        localStorage.setItem("isLoggedIn", "true"); // Store session in localStorage
        localStorage.setItem("orderId", validOrder.orderId); // Store orderId in localStorage
        localStorage.setItem("email", validOrder.email); // Store email in localStorage

        // Initialize socket connection and join the room for this orderId
        socket = io(`http://${ip}`);
        socket.emit("joinOrder", validOrder.orderId); // Join the room for the specific orderId
        socket.on("connect", () => {
          console.log("Connected to Socket.io server");
        });

        socket.on("newImage", (data) => {
          console.log("Received new image event:", data); // Log data
          if (data.orderId === orderId.value) {
            loadGallery(orderId.value); // Reload images for the current order
          }
        });
      } else {
        console.error("ID tidak ditemukan pada validOrder!");
      }
    } else {
      errorMessage.value = "Data tidak ditemukan!";
    }
  } else {
    errorMessage.value = "Masukkan kode akses Anda untuk masuk ke galeri";
  }
};

// Handle logout confirmation
const confirmLogout = () => {
  confirm.require({
    message: "Apakah Anda yakin ingin keluar?",
    header: "Konfirmasi Keluar",
    icon: "pi pi-exclamation-triangle mt-1",
    acceptLabel: "Ya",
    rejectProps: {
      label: "Batal",
      severity: "secondary",
      outlined: true,
    },
    accept: () => {
      handleLogout(); // If confirmed, proceed with logout
    },
    reject: () => {
      // toast.add({
      //   group: "tr",
      //   severity: "info",
      //   summary: "Logout Dibatalkan",
      //   detail: "Anda tetap berada dalam sesi.",
      //   life: 3000,
      // });
    },
  });
};

// Handle actual logout action
const handleLogout = () => {
  // Clear session data
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("orderId");
  localStorage.removeItem("visitedCustomer");
  localStorage.removeItem("galleryImages");
  localStorage.removeItem("galleryEdit");
  localStorage.removeItem("email");

  const visitedCustomer = localStorage.getItem("visitedCustomer");
  console.log("Stored isVisited:", visitedCustomer);

  // Reset state
  isLoggedIn.value = false;
  orderId.value = "";
  selectedImages.value = [];
  imageComments.value = {};
  galleryImages.value = [];
  galleryEdit.value = [];
  galleryToShow.value = [];
  fg.value = null;
  editor.value = null;
  cs.value = null;

  // Disconnect socket
  if (socket) {
    socket.disconnect(); // Disconnect the socket connection
    console.log("Disconnected from Socket.io server");
  }

  // Optional: Show a toast notification for logout
  toast.add({
    group: "tr",
    severity: "success",
    summary: "Logout Successful",
    detail: "Anda telah berhasil keluar.",
    life: 3000,
  });
};

// Cleanup the socket connection on component unmount
onBeforeUnmount(() => {
  if (socket) {
    socket.off("newImage"); // Remove the listener when the component is destroyed
  }

  // window.removeEventListener("resize", checkIsMobile); // Hapus listener saat komponen dihancurkan
});
</script>

<style scoped>
/* Full Screen Gallery */

h3 {
  margin-bottom: 1.5rem;
}

.grid {
  column-count: 4; /* Creates 4 columns */
  column-gap: 10px; /* Adjust gap between columns */
  display: block; /* Ensure block-level layout for images */
}

@media (max-width: 640px) {
  .grid {
    column-count: 2; /* 2 columns on small screens */
  }
}

@media (max-width: 1024px) {
  .grid {
    column-count: 2; /* 3 columns on medium screens */
  }
}

@media (min-width: 1280px) {
  .grid {
    column-count: 4; /* 4 columns on larger screens */
  }
}
</style>
