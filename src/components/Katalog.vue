<template>
  <!-- Sticky Menu Bar -->
  <div class="fixed top-0 z-10 w-full bg-white shadow-sm">
    <Menubar class="py-4">
      <template #start>
        <h2 class="lg:text-2xl text-xl font-bold">Admin Dashboard</h2>
      </template>
      <template #end>
        <div>
          <!-- Tombol untuk layar besar (md dan lg) -->
          <Button
            label="Tambah Paket Baru"
            icon="pi pi-plus"
            class="p-button-primary hidden md:inline-flex"
            @click="openAddDialog"
          />
          <!-- Tombol untuk layar kecil (sm dan xs) -->
          <Button
            label="Tambah"
            icon="pi pi-plus"
            class="p-button-primary inline-flex md:hidden text-sm px-2 py-1"
            @click="openAddDialog"
          />
        </div>
      </template>
    </Menubar>
  </div>

  <div
    class="px-5 pb-4 lg:px-10 lg:pb-8 bg-gray-100 min-h-screen pt-[5rem] lg:pt-[6rem]"
  >
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-6 gap-2">
      <Card
        v-for="(service, index) in services"
        :key="index"
        class="relative pb-16"
      >
        <template #header>
          <img
            :src="service.image"
            alt="Service Image"
            class="w-full h-48 object-cover rounded-tl-xl rounded-tr-xl object-top"
          />
        </template>
        <template #title>{{ service.name }}</template>
        <template #subtitle>
          <p>{{ service.desc }}</p>
        </template>
        <template #content>
          <p>{{ service.price }}</p>
          <ul v-if="service.services && service.services.length" class="mt-2">
            <li
              v-for="(subService, subIndex) in service.services"
              :key="subIndex"
              class="text-sm lg:text-md text-gray-600"
            >
              • {{ subService.name }}
            </li>
          </ul>
        </template>
        <template #footer>
          <div
            class="absolute bottom-0 left-0 right-0 bg-white flex gap-1 p-3 rounded-xl"
          >
            <!-- Button to Delete the Service -->
            <Button
              icon="pi pi-trash"
              outlined
              :label="isDesktopOrTablet ? 'Hapus' : ''"
              class="p-button-danger w-full text-sm"
              @click="deleteService(index)"
            />
            <Button
              icon="pi pi-file-edit"
              :label="isDesktopOrTablet ? 'Update' : ''"
              class="w-full"
              @click="openEditDialog(service, index)"
            />
          </div>
        </template>
      </Card>
    </div>

    <!-- Add/Edit Service Dialog -->
    <Dialog
      modal
      v-model:visible="isDialogVisible"
      header="Service Details"
      :style="{ width: '90vw', maxWidth: '600px' }"
      class="rounded-xl"
      @hide="closeDialog"
    >
      <div class="p-4 space-y-4">
        <!-- Service fields as before -->
        <div>
          <label for="name" class="block text-sm font-medium mb-1">Name</label>
          <InputText
            v-model="tempService.name"
            id="name"
            placeholder="Service Name"
            class="w-full p-inputtext-sm"
          />
        </div>

        <div>
          <label for="desc" class="block text-sm font-medium mb-1"
            >Description</label
          >
          <InputText
            v-model="tempService.desc"
            id="desc"
            placeholder="Description"
            class="w-full p-inputtext-sm"
          />
        </div>

        <div>
          <label for="price" class="block text-sm font-medium mb-1"
            >Price</label
          >
          <InputNumber
            v-model="tempService.price"
            id="price"
            mode="currency"
            currency="IDR"
            class="w-full"
          />
        </div>

        <div>
          <label for="image" class="block text-sm font-medium mb-1"
            >Image URL</label
          >
          <InputText
            v-model="tempService.image"
            id="image"
            placeholder="Image URL"
            class="w-full p-inputtext-sm"
          />
        </div>

        <!-- New Input for Jumlah Pilihan Foto -->
        <div>
          <label for="pilFoto" class="block text-sm font-medium mb-1">
            Jumlah Pilihan Foto
          </label>
          <InputNumber
            v-model="tempService.pilFoto"
            id="pilFoto"
            class="w-full"
          />
        </div>

        <!-- New Input for Jumlah Pilihan Background -->
        <div>
          <label for="pilBg" class="block text-sm font-medium mb-1">
            Jumlah Pilihan Background
          </label>
          <InputNumber v-model="tempService.pilBg" id="pilBg" class="w-full" />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Services</label>
          <div
            v-for="(service, index) in tempService.services"
            :key="index"
            class="flex items-center gap-2 mb-2"
          >
            <InputText
              v-model="service.name"
              placeholder="Service Name"
              class="flex-1 p-inputtext-sm"
            />
            <Button
              icon="pi pi-trash"
              class="p-button-danger p-button-sm"
              @click="removeSubService(index)"
            />
          </div>
          <Button
            label="Add Service"
            icon="pi pi-plus"
            class="p-button-sm p-button-outlined mt-2"
            @click="addSubService"
          />
        </div>
      </div>

      <!-- Display error message if exists -->
      <div v-if="errorMessage" class="text-sm text-red-600 mb-4 ml-4">
        {{ errorMessage }}
      </div>

      <!-- Show error message below the inputs -->
      <template #footer>
        <div class="flex flex-col justify-end gap-2 p-4">
          <div class="flex gap-2">
            <Button
              label="Cancel"
              icon="pi pi-times"
              class="p-button-text"
              @click="closeDialog"
            />
            <Button
              label="Save"
              icon="pi pi-check"
              class="p-button-primary"
              @click="saveService"
            />
          </div>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from "vue";
import {
  ref as dbRef,
  get,
  set,
  update,
  remove,
  child,
  push,
} from "firebase/database";
import { db, storage } from "../firebase";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

export default {
  setup() {
    const services = ref([]);
    const isDialogVisible = ref(false);
    const tempService = ref({
      name: "",
      desc: "",
      price: 0,
      image: "",
      services: [], // Sublayanan sementara
      pilFoto: 0, // Jumlah Pilihan Foto
      pilBg: 0, // Jumlah Pilihan Background
    });
    const editIndex = ref(null);
    const serviceIds = ref({}); // This will hold the IDs of the services
    const errorMessage = ref(""); // This will store the error message
    const lokasi = import.meta.env.VITE_LOCATION;

    console.log("lokasi", lokasi);

    // Screen size check
    const isDesktopOrTablet = ref(false);

    // Check screen size and update isDesktopOrTablet
    const checkScreenSize = () => {
      isDesktopOrTablet.value = window.innerWidth >= 768; // Consider desktop/tablet screens to be >= 768px
    };

    // Listen to window resize event to update screen size
    onMounted(() => {
      checkScreenSize();
      window.addEventListener("resize", checkScreenSize);
      fetchServices();
    });

    onBeforeUnmount(() => {
      window.removeEventListener("resize", checkScreenSize);
    });

    // Fetch services data from Firebase
    const fetchServices = async () => {
      const snapshot = await get(dbRef(db, `${lokasi}/katalog`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        services.value = Object.values(data);
        serviceIds.value = Object.keys(data); // Store the IDs of the services
      } else {
        services.value = [];
        serviceIds.value = {}; // No services, reset IDs
      }
    };

    // Open the add new service dialog
    const openAddDialog = () => {
      tempService.value = {
        name: "",
        desc: "",
        price: 0,
        image: "",
        services: [], // Reset layanan sementara
        pilFoto: 0, // Reset Jumlah Pilihan Foto
        pilBg: 0, // Reset Jumlah Pilihan Background
      };
      editIndex.value = null;
      isDialogVisible.value = true;
    };

    // Open the edit service dialog
    const openEditDialog = (serviceId, index) => {
      // Find the service by its ID
      const service = services.value[index];
      tempService.value = JSON.parse(JSON.stringify(service)); // Deep copy
      editIndex.value = index;
      isDialogVisible.value = true;
    };

    // Save new or updated service
    const saveService = async () => {
      try {
        // Hapus pesan kesalahan sebelumnya
        errorMessage.value = "";

        // Validasi data sebelum menyimpan
        if (
          !tempService.value.name ||
          !tempService.value.image ||
          tempService.value.price === 0 ||
          !tempService.value.services ||
          tempService.value.pilFoto === 0 ||
          tempService.value.pilBg === 0
        ) {
          errorMessage.value = "Pastikan semua data sudah terisi.";
          return; // Hentikan proses jika data tidak lengkap
        }

        if (editIndex.value !== null) {
          // If editing an existing service
          const serviceId = serviceIds.value[editIndex.value]; // Correct way to get the service ID
          if (serviceId) {
            await update(
              dbRef(db, `${lokasi}/katalog/${serviceId}`),
              tempService.value
            );
          } else {
            console.error("Service ID not found for update.");
            errorMessage.value = "Gagal memperbarui layanan.";
            return;
          }
        } else {
          // If adding a new service
          await push(dbRef(db, `${lokasi}/katalog`), tempService.value);
        }

        // Tutup dialog dan refresh data
        isDialogVisible.value = false;
        fetchServices(); // Ambil data terbaru setelah menyimpan
      } catch (error) {
        console.error("Firebase save error:", error);
        errorMessage.value =
          "Terjadi kesalahan saat menyimpan layanan. Silakan coba lagi.";
      }
    };

    // Close the dialog
    const closeDialog = () => {
      isDialogVisible.value = false;
      errorMessage.value = "";
    };

    // Add a new sub-service
    const addSubService = () => {
      // Ensure services array is initialized
      if (!Array.isArray(tempService.value.services)) {
        tempService.value.services = [];
      }

      // Add an empty sub-service to the temporary service
      tempService.value.services.push({ name: "" });

      // Update Firebase with the new sub-service if it is the first one
      const serviceId = serviceIds.value[editIndex.value];
      if (serviceId && tempService.value.services.length === 1) {
        update(dbRef(db, `${lokasi}/katalog/${serviceId}/services/0`), {
          name: "",
        });
      }
    };

    // Delete a service using its ID from Firebase
    const deleteService = async (index) => {
      const serviceId = serviceIds.value[index]; // Retrieve ID based on the index
      if (serviceId) {
        try {
          await remove(dbRef(db, `${lokasi}/katalog/${serviceId}`));
          services.value.splice(index, 1);
          delete serviceIds.value[index]; // Remove from serviceIds to maintain consistency
        } catch (error) {
          console.error("Failed to delete service:", error);
        }
      } else {
        console.warn("Service ID is not found.");
      }
    };

    // Remove a sub-service
    const removeSubService = (index) => {
      tempService.value.services.splice(index, 1); // Hapus layanan berdasarkan indeks
    };

    return {
      services,
      isDialogVisible,
      tempService,
      openAddDialog,
      openEditDialog,
      saveService,
      closeDialog,
      addSubService,
      removeSubService,
      deleteService,
      errorMessage,
      isDesktopOrTablet, // Expose this variable to the template
    };
  },
};
</script>

<style scoped>
/* TailwindCSS customizations */
</style>
