<template>
  <div class="p-10 overflow-hidden bg-gray-50">
    <!-- Header Section -->
    <!-- <h1 class="text-xl font-semibold mb-4">Manage Background Images</h1> -->

    <!-- Input Form -->
    <div class="mb-6">
      <form
        @submit.prevent="uploadImages"
        class="space-y-6 bg-white p-10 rounded-xl shadow-sm"
      >
        <!-- File Upload -->
        <div class="w-full">
          <label
            for="images"
            class="text-center block text-lg text-gray-700 mb-2"
            >Select Images:</label
          >
          <FileUpload
            name="images"
            mode="basic"
            accept="image/*"
            multiple
            @select="onFilesSelect"
            :showUploadButton="false"
            class="mt-1 w-1/4 p-button-outlined"
          />
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div
              v-for="(preview, index) in previews"
              :key="index"
              class="text-center break-inside-avoid relative"
            >
              <img
                :src="preview"
                alt="Image Preview"
                class="shadow-md rounded-xl w-40 mx-auto border border-gray-200"
              />
              <p class="text-sm mt-2 text-gray-600 truncate">
                {{ files[index].name }}
              </p>
            </div>
          </div>
        </div>

        <!-- Dropdown and Submit -->
        <div class="flex flex-wrap gap-4 justify-center">
          <Select
            v-model="selectedCategory"
            :options="categories"
            optionLabel="name"
            optionValue="id"
            placeholder="Select Category"
            class="w-full md:w-1/2 p-inputtext"
          />
          <Button
            icon="pi pi-cloud-upload"
            label="Upload"
            class="p-button w-full md:w-1/3"
            @click="uploadImages"
            :loading="loading"
          />
        </div>
      </form>
    </div>

    <!-- Display Gallery -->
    <h2 class="text-xl font-semibold mb-4">Pilihan Background</h2>
    <div class="grid grid-cols-5 gap-4 space-y-4">
      <div
        v-for="image in uniqueImages"
        :key="image.id"
        class="break-inside-avoid relative flex flex-col items-center bg-gray-100 p-4 rounded-lg"
      >
        <Image
          :src="image.url"
          alt="Background Image"
          class="rounded-md object-cover"
          width="450"
          preview
        />
        <p class="mt-2 text-center">{{ image.name }}</p>
        <Button
          severity="danger"
          icon="pi pi-trash"
          class="absolute bottom-14 right-6 mt-2"
          @click="showDeleteModal(image)"
        />
      </div>
    </div>

    <!-- Confirmation Modal -->
    <Dialog
      v-model:visible="showModal"
      header="Confirm Delete"
      modal
      :closable="false"
      :style="{ width: '400px' }"
    >
      <p>Are you sure you want to delete this image?</p>
      <div class="flex justify-between mt-8">
        <Button
          label="Cancel"
          class="p-button-text"
          @click="showModal = false"
        />
        <Button label="Delete" class="p-button-danger" @click="confirmDelete" />
      </div>
    </Dialog>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from "vue";
import { db, storage } from "../firebase";
import { ref as databaseRef, set, get, child, push } from "firebase/database";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { useToast } from "primevue/usetoast";
import Image from "primevue/image";

const lokasi = import.meta.env.VITE_LOCATION;

export default {
  setup() {
    const files = ref([]); // Array to store selected files
    const previews = ref([]); // Array to store image previews
    const selectedCategory = ref("");
    const categories = ref([]);
    const images = ref([]);
    const loading = ref(false);
    const toast = useToast();
    const showModal = ref(false);
    const imageToDelete = ref(null);

    const onFilesSelect = (event) => {
      files.value = event.files;
      previews.value = files.value.map((file) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        return new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target.result);
        });
      });
      // Resolve all previews
      Promise.all(previews.value).then((resolvedPreviews) => {
        previews.value = resolvedPreviews;
      });
    };

    const uniqueImages = computed(() => {
      const unique = {};
      return images.value.filter((image) => {
        if (!unique[image.name]) {
          unique[image.name] = true;
          return true;
        }
        return false;
      });
    });

    const showDeleteModal = (image) => {
      imageToDelete.value = image;
      showModal.value = true;
    };

    const confirmDelete = async () => {
      try {
        // Remove the image from Firebase Storage
        const imageRef = storageRef(storage, imageToDelete.value.url); // Assuming `image.url` stores the storage path
        await deleteObject(imageRef);

        // Remove the image from Firebase Database
        const imageDatabaseRef = databaseRef(
          db,
          `${lokasi}/backgrounds/${selectedCategory.value}/${imageToDelete.value.id}`
        );
        await set(imageDatabaseRef, null);

        toast.add({
          severity: "success",
          summary: "Deleted successfully",
          detail: `Image ${imageToDelete.value.name} has been deleted.`,
          group: "tr",
          life: 3000,
        });

        // Fetch images again to reflect the changes
        fetchImages();
      } catch (error) {
        toast.add({
          severity: "error",
          summary: "Delete Error",
          detail: "An error occurred while deleting the image.",
          group: "tr",
          life: 3000,
        });
        console.error("Error deleting image:", imageToDelete.value.name, error);
      } finally {
        // Hide modal after delete attempt
        showModal.value = false;
      }
    };

    const uploadImages = async () => {
      loading.value = true;

      if (files.value.length === 0 || !selectedCategory.value) {
        toast.add({
          severity: "warn",
          summary: "Cek Kembali",
          detail: "Belum pilih file atau kategori",
          group: "tr",
          life: 3000,
        });
        return;
      }

      const categoryName =
        categories.value.find((cat) => cat.id === selectedCategory.value)
          ?.name || "Unknown Category";

      for (const file of files.value) {
        try {
          const storageRefPath = storageRef(
            storage,
            `/bg/${categoryName}/${file.name}`
          );
          const uploadTask = await uploadBytes(storageRefPath, file);
          const imageUrl = await getDownloadURL(uploadTask.ref);

          const imageRef = databaseRef(
            db,
            `${lokasi}/backgrounds/${categoryName}`
          );
          const newImageRef = push(imageRef);
          await set(newImageRef, {
            name: file.name,
            url: imageUrl,
          });
        } catch (error) {
          toast.add({
            severity: "error",
            summary: "Uploaded Error",
            group: "tr",
            life: 3000,
          });
          console.error("Error uploading image:", file.name, error);
        }
      }

      files.value = [];
      previews.value = [];
      selectedCategory.value = "";
      toast.add({
        severity: "success",
        summary: "Uploaded successfully",
        detail: "Semua gambar berhasil terupload",
        group: "tr",
        life: 3000,
      });
      loading.value = false;
      fetchImages();
    };

    const fetchCategories = async () => {
      const snapshot = await get(
        child(databaseRef(db), `${lokasi}/kelompokBg`)
      );
      const categoriesData = snapshot.val();
      if (categoriesData) {
        categories.value = Object.keys(categoriesData).map((key) => {
          let categoryName = categoriesData[key].name;
          return {
            id: key,
            name: categoryName,
          };
        });
      }
    };

    const fetchImages = async () => {
      if (!selectedCategory.value) return;

      const selectedCategoryName = categories.value.find(
        (cat) => cat.id === selectedCategory.value
      )?.name;

      const snapshot = await get(
        child(databaseRef(db), `${lokasi}/backgrounds/${selectedCategoryName}`)
      );
      const imagesData = snapshot.val();
      if (imagesData) {
        images.value = Object.keys(imagesData).map((key) => ({
          id: key,
          name: imagesData[key].name,
          url: imagesData[key].url,
        }));
      }
    };

    onMounted(() => {
      fetchCategories();
    });

    watch(selectedCategory, () => {
      fetchImages();
    });

    return {
      files,
      previews,
      selectedCategory,
      categories,
      images,
      uploadImages,
      onFilesSelect,
      uniqueImages,
      loading,
      showModal,
      showDeleteModal,
      confirmDelete,
    };
  },
};
</script>

<style scoped>
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

.break-inside-avoid {
  break-inside: avoid;
}
</style>
