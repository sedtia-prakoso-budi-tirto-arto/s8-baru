<template>
  <div
    v-if="isMobile || !isMobile"
    class="h-screen max-h-screen flex flex-col bg-gray-100 overflow-hidden p-4"
  >
    <div class="flex justify-between items-center mb-4">
      <div class="flex items-center">
        <Button
          icon="pi pi-arrow-left"
          variant="text"
          severity="secondary"
          rounded
          @click="back"
          class="mr-2 slg:mr-4"
        />
        <h2 class="md:text-2xl text-xl font-semibold text-gray-800">
          Edit Foto
        </h2>
      </div>
      <Button label="Selesai" @click="requireConfirmation()" class="" />
    </div>

    <!-- Main Content -->
    <div
      class="flex flex-1 w-full mx-auto flex-col overflow-hidden justify-center md:mt-5 gap-5"
    >
      <!-- Editor Section -->
      <div class="flex-1 flex flex-col items-center justify-center rounded-lg">
        <div
          class="canvas-container relative md:h-full md:w-auto w-[90%] shadow-lg"
          :style="{ aspectRatio: '4 / 6' }"
        >
          <!-- Background -->
          <div
            class="background absolute inset-0"
            :style="combinedBackgroundStyle"
          ></div>

          <!-- Image -->
          <div
            ref="imageContainer"
            class="image-wrapper absolute inset-0 flex justify-center items-center"
            :style="transformStyles"
          >
            <Image
              :src="imageUrl"
              alt="Editable Image"
              class="image max-w-full max-h-full"
              :style="filterStyle"
            />
          </div>
        </div>
      </div>

      <!-- Sidebar (Template Selection) -->
      <div class="bg-white rounded-lg shadow-lg overflow-x-auto md:mt-5">
        <div class="p-2 flex">
          <div class="template-scroll-container flex gap-2">
            <div class="text-center w-24 md:w-22">
              <label for="bg-color" class="text-gray-800 text-sm"
                >Kustom:</label
              >
              <div class="items-center justify-center md:mt-2">
                <input
                  id="bg-color"
                  type="color"
                  v-model="backgroundColor"
                  class="h-14 w-20 mb-2 p-1 rounded"
                />
                <input
                  type="text"
                  v-model="backgroundHex"
                  placeholder="#FFFFFF"
                  class="p-2 border rounded w-20 h-10"
                />
              </div>
            </div>
            <div
              v-for="(template, index) in templates"
              :key="index"
              class="template-item cursor-pointer border rounded-lg overflow-hidden transition-transform transform hover:scale-105"
              @click="applyTemplate(template)"
            >
              <Image
                :src="template"
                :alt="'Template ' + index"
                class="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Rating Dialog -->
    <ConfirmDialog group="headless">
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

          <!-- Rating Component -->
          <div class="my-4">
            <Rating
              v-model="ratingValue"
              cancel
              icon="pi pi-star-o"
              class="text-yellow-500"
            />
          </div>

          <!-- Feedback Textarea -->
          <div class="my-2 w-full">
            <textarea
              v-model="feedback"
              placeholder="Tulis kritik & saran Anda di sini..."
              rows="4"
              class="p-inputtext p-component w-full border rounded-lg"
            ></textarea>
          </div>

          <!-- Sumber Informasi -->
          <div class="my-2 w-full">
            <div class="text-center">
              <label for="source" class="text-center">Tahu dari mana?</label>
            </div>
            <Select
              id="source"
              v-model="source"
              :options="sourceOptions"
              optionLabel="label"
              class="w-full mt-2"
              placeholder="Pilih salah satu"
              @change="onSourceChange"
            />
            <!-- Error message if no selection is made -->
            <div v-if="sourceError" class="text-red-500 text-sm mt-2">
              <p>Harap pilih salah satu.</p>
            </div>
          </div>

          <div class="flex items-center gap-2 mt-6">
            <Button label="Simpan" @click="handleAccept(acceptCallback)" />
            <Button
              label="Batal"
              outlined
              @click="handleReject(rejectCallback)"
            />
          </div>
        </div>
      </template>
    </ConfirmDialog>

    <!-- Dialog Penilaian Customer Service -->
    <Dialog
      v-model:visible="showCSRatingDialog"
      modal
      header="Rate Customer Service"
      class="w-[90%] md:w-[40%] rounded-lg shadow-lg"
    >
      <!-- Rating Section -->
      <div class="p-4 space-y-3">
        <div class="p-field flex flex-col mb-10">
          <label
            for="ratingCS"
            class="text-sm text-center font-medium text-gray-700 mb-2"
            >Rating:</label
          >
          <Rating
            v-model="ratingCS"
            :stars="5"
            cancel="false"
            class="text-blue-500 justify-center"
          />
        </div>
        <div class="p-field flex flex-col space-y-2">
          <!-- <label
            for="feedbackCS"
            class="text-sm text-center font-medium text-gray-700"
            >Feedback:</label
          > -->
          <Textarea
            v-model="feedbackCS"
            rows="4"
            placeholder="Tulis kritik & saran Anda di sini..."
            class="p-2 border rounded-lg focus:ring focus:ring-blue-300"
          ></Textarea>
        </div>
      </div>

      <!-- Footer Buttons -->
      <template #footer>
        <div class="flex justify-end gap-4 p-4">
          <Button
            label="Cancel"
            icon="pi pi-times"
            class="p-button-secondary px-5 py-2 text-sm font-medium"
            @click="showCSRatingDialog = false"
          />
          <Button
            label="Submit"
            icon="pi pi-check"
            class="p-button-primary px-5 py-2 text-sm font-medium"
            @click="submitCSRating"
          />
        </div>
      </template>
    </Dialog>

    <!-- Layout Modal -->
    <Dialog
      v-model:visible="showModal"
      header="Pilih Layout untuk Print"
      class="p-fluid p-d-flex p-flex-column p-ai-center w-[90%] md:w-[40%]"
      modal
      :closable="!isLoading"
      @hide="clearSelectedLayout"
    >
      <div class="layout-options grid grid-cols-2 gap-2 mb-4 p-4">
        <Button
          v-for="layout in layouts"
          :key="layout"
          :label="`${layout}`"
          icon="pi pi-image"
          class="p-button-secondary"
          :class="{ 'bg-[#e0e8f0]': selectedLayout === layout }"
          @click="selectingLayout(layout)"
        />
      </div>

      <!-- Toggle for saving all backgrounds -->
      <div class="flex justify-center items-center">
        <span class="text-sm mr-3">Simpan dalam Semua BG</span>
        <div class="card flex justify-center">
          <ToggleSwitch v-model="saveInAllBackgrounds" />
        </div>
      </div>

      <!-- Cancel and Save Buttons -->
      <div class="flex justify-center gap-2">
        <Button
          type="button"
          label="Print"
          icon="pi pi-print"
          class="mt-[4rem] py-2 px-[3rem]"
          @click="saveLayout"
          :disabled="!selectedLayout || isLoading"
          :loading="isLoading"
        />
      </div>
    </Dialog>
  </div>
  <div v-else class="flex items-center justify-center h-screen bg-gray-200">
    <p class="text-center text-gray-600">
      Maaf, halaman ini hanya dapat diakses pada perangkat smartphone.
    </p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from "vue";
import { ref as dbRef, get, update } from "firebase/database"; // Firebase Database
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Rating from "primevue/rating"; // Import the Rating component
import ToggleButton from "primevue/togglebutton";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import interact from "interactjs";
import { useRouter } from "vue-router";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { db } from "../firebase";
import { nextTick } from "vue";
import Dropdown from "primevue/dropdown";
import createSketch from "canvas-sketch";

const ip = import.meta.env.VITE_SERVER_IP;
const router = useRouter();
// Akses imageUrl dari store
const imageUrl = localStorage.getItem("imageUrl");
const customerId = localStorage.getItem("orderId");
console.log("imageUrl", imageUrl);
console.log("customerId", customerId);

const isMobile = ref(window.innerWidth <= 768);

const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 768;
};

const isLoading = ref(false);
const confirm = useConfirm();
const toast = useToast();
const scale = ref(1);
const rotate = ref(0);
const translateX = ref(0);
const translateY = ref(0);
const templates = ref([]);
const background = ref(null);
const selectedLayout = ref(null);
const layouts = ref(["2x3", "3x3", "3x4", "4x6"]);
const showModal = ref(false);
const saveInAllBackgrounds = ref(false); // Toggle state
const showRatingDialog = ref(false); // Rating dialog visibility state
const ratingValue = ref(0); // Rating value
const lokasi = import.meta.env.VITE_LOCATION;
const fg = ref(null);
const feedback = ref(""); // Store the feedback
const backgroundColor = ref(null); // Color picker
const backgroundHex = ref(null); // Hexadecimal color input
const source = ref(null); // Model for the selected value
const sourceError = ref(false); // Flag to show error if no source is selected
const orderId = localStorage.getItem("orderId") || "default_order_id";
const showCSRatingDialog = ref(false); // Dialog untuk rating CS
const ratingCS = ref(0); // Nilai rating untuk CS
const feedbackCS = ref(""); // Feedback untuk CS

const FOUR_R_WIDTH = 1200; // Width in pixels (300 DPI)
const FOUR_R_HEIGHT = 1800; // Height in pixels (300 DPI)
const IMAGE_WIDTH_4x6 = 472.44; // Image width (4 cm at 300 DPI)
const IMAGE_HEIGHT_4x6 = 708.66; // Image height (6 cm at 300 DPI)

const IMAGE_WIDTH_2x3 = 236.22; // Image width (2 cm at 300 DPI)
const IMAGE_HEIGHT_2x3 = 354.33; // Image height (3 cm at 300 DPI)

const IMAGE_WIDTH_3x3 = 354.33; // Image width (3 cm at 300 DPI)
const IMAGE_HEIGHT_3x3 = 354.33; // Image height (3 cm at 300 DPI)

const IMAGE_WIDTH_3x4 = 354.33; // Image width (3 cm at 300 DPI)
const IMAGE_HEIGHT_3x4 = 472.44; // Image height (4 cm at 300 DPI)

const cropAndDrawImage = (context, image, x, y, width, height) => {
  const originalRatio = image.width / image.height;
  const targetRatio = width / height;

  let cropX = 0,
    cropY = 0,
    cropWidth = image.width,
    cropHeight = image.height;

  if (originalRatio > targetRatio) {
    // Image is too wide, crop left and right
    cropWidth = image.height * targetRatio;
    cropX = (image.width - cropWidth) / 2; // Center horizontally
  } else if (originalRatio < targetRatio) {
    // Image is too tall, crop only the bottom
    cropHeight = image.width / targetRatio;
    cropY = 0; // Start from the top (no centering)
  }

  context.drawImage(
    image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    x,
    y,
    width,
    height
  );
};

const clearSelectedLayout = () => {
  selectedLayout.value = null; // Kosongkan layout saat dialog ditutup
};

const printToCanvas4R = (imageUrls, imageWidth, imageHeight, rows, cols) => {
  if (imageUrls.length !== rows * cols) {
    console.error(`Please provide exactly ${rows * cols} images.`);
    return;
  }

  const settings = {
    dimensions: [FOUR_R_WIDTH, FOUR_R_HEIGHT], // Set canvas dimensions
    pixelsPerInch: 300, // Standard DPI for printing
  };

  // Create a hidden off-screen canvas
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = FOUR_R_WIDTH;
  canvas.height = FOUR_R_HEIGHT;

  // Function to load images
  function loadImages(urls) {
    return Promise.all(
      urls.map((url) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () =>
            reject(new Error(`Failed to load image at ${url}`));
          img.src = url;
        });
      })
    );
  }

  // Process the images
  loadImages(imageUrls)
    .then((images) => {
      // Calculate the starting positions to center the grid of images
      const xOffset = (canvas.width - cols * imageWidth) / 2; // Horizontal offset to center the images
      const yOffset = (canvas.height - rows * imageHeight) / 2; // Vertical offset to center the images

      // Define positions for the images in a grid
      const positions = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          positions.push({
            x: xOffset + col * imageWidth,
            y: yOffset + row * imageHeight,
          });
        }
      }

      // Draw images onto the off-screen canvas
      images.forEach((image, index) => {
        const position = positions[index];

        // Draw the image at the calculated position
        cropAndDrawImage(
          context,
          image,
          position.x,
          position.y,
          imageWidth,
          imageHeight
        );

        // Optional: Draw cutting lines (borders) around each image, extending to the canvas edges
        context.beginPath();
        context.moveTo(0, position.y); // Start from the left edge of the canvas
        context.lineTo(canvas.width, position.y); // Top border to the right edge of the canvas
        context.moveTo(0, position.y + imageHeight); // Bottom border to the left edge of the canvas
        context.lineTo(canvas.width, position.y + imageHeight); // Bottom border to the right edge of the canvas

        context.moveTo(position.x, 0); // Start from the top edge of the canvas
        context.lineTo(position.x, canvas.height); // Left border from top to bottom edge of the canvas
        context.moveTo(position.x + imageWidth, 0); // Right border from top edge of the canvas
        context.lineTo(position.x + imageWidth, canvas.height); // Right border from top to bottom edge of the canvas
        context.closePath();

        // Style for cutting lines
        context.strokeStyle = "red"; // Line color
        context.lineWidth = 0.75; // Line thickness
        context.stroke();
      });

      // Add the orderId text below the photo grid
      const textX = (canvas.width - context.measureText(orderId).width) / 2; // Center the text horizontally
      const textY = yOffset + rows * imageHeight + 50; // Position text just below the grid of images

      context.font = "30px Arial"; // Set font size and family
      context.fillStyle = "black"; // Set text color
      context.fillText(orderId, textX, textY); // Draw the orderId text

      // Send the image to the server
      canvas.toBlob(
        (blob) => {
          const formData = new FormData();
          formData.append(
            "file",
            blob,
            `${orderId}_${selectedLayout.value}.png`
          );

          // Send POST request to the /print endpoint
          fetch(`http://${ip}/print`, {
            method: "POST",
            body: formData,
          })
            .then((response) => response.json())
            .then((data) => {
              console.log("File uploaded successfully", data);

              // Update Firebase status to 'printing'
              const orderRef = dbRef(db, `${lokasi}/orders/${orderId}`);
              update(orderRef, { status: "printing" })
                .then(() => {
                  console.log("Order status updated to printing");
                })
                .catch((error) => {
                  console.error("Error updating order status:", error);
                });
            })
            .catch((error) => {
              console.error("Error uploading file", error);
            });
        },
        "image/png",
        1
      );
    })
    .catch((error) => {
      console.error(error);
    });
};

const selectingLayout = (layout) => {
  selectedLayout.value = layout;
  console.log(`Selected Layout: ${selectedLayout.value}`);
};

// Update the selectLayout function
const selectLayout = (layout) => {
  let imageWidth, imageHeight, rows, cols;

  // Set image width, height, rows, and columns based on the layout
  switch (layout) {
    case "4x6":
      imageWidth = IMAGE_WIDTH_4x6;
      imageHeight = IMAGE_HEIGHT_4x6;
      rows = 2;
      cols = 2;
      break;
    case "2x3":
      imageWidth = IMAGE_WIDTH_2x3;
      imageHeight = IMAGE_HEIGHT_2x3;
      rows = 4; // 4 rows
      cols = 4; // 4 columns (16 images in total)
      break;
    case "3x3":
      imageWidth = IMAGE_WIDTH_3x3;
      imageHeight = IMAGE_HEIGHT_3x3;
      rows = 4; // 3 rows
      cols = 3; // 4 columns (12 images in total)
      break;
    case "3x4":
      imageWidth = IMAGE_WIDTH_3x4;
      imageHeight = IMAGE_HEIGHT_3x4;
      rows = 3; // 3 rows
      cols = 3; // 3 columns (9 images in total)
      break;
    default:
      console.error("Unknown layout type");
      return;
  }

  // Get the current image URL from the canvas container
  const canvasContainer = document.querySelector(".canvas-container");
  html2canvas(canvasContainer, {
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
  }).then((canvas) => {
    // Convert the canvas to a data URL
    const imageUrl = canvas.toDataURL("image/png", 1);

    // Create an array of the appropriate number of identical image URLs
    const imageUrls = Array(rows * cols).fill(imageUrl); // Fill with the correct number of images

    // Call the printToCanvas4R function with the array of image URLs
    printToCanvas4R(imageUrls, imageWidth, imageHeight, rows, cols); // Pass the selected width, height, and grid size
  });
};

// Define the available options for the dropdown
const sourceOptions = ref([
  { label: "Media Sosial Official", value: "social_media" },
  { label: "Orang Lain", value: "other" },
  { label: "Website", value: "website" },
  { label: "Media Sosial Influencer", value: "influencer" },
  { label: "Lainnya", value: "others" },
]);

// Optional: Add a method to handle dropdown changes (if needed)
const onSourceChange = (event) => {
  console.log("Selected Source:", event.value); // Log the selected value
  // Reset the error flag if the user selects a value
  sourceError.value = !source.value;
};

// State untuk pilihan filter
const filter = ref(0); // Default filter (0 = Contrast)
const filterValues = ref([100, 100, 0]); // Nilai default untuk Contrast, Brightness, dan Sepia
const filterOptions = ref([
  { label: "Contrast", value: 0 },
  { label: "Brightness", value: 1 },
  { label: "Hue", value: 2 },
]);

// Computed property untuk menghasilkan filter style berdasarkan pilihan
const filterStyle = computed(() => {
  return {
    filter: `contrast(${filterValues.value[0]}%) brightness(${filterValues.value[1]}%) hue-rotate(${filterValues.value[2]}deg)`,
  };
});

const lastChange = ref(null); // Menyimpan waktu perubahan terakhir

const combinedBackgroundStyle = computed(() => {
  // Prioritaskan berdasarkan yang terakhir berubah
  if (lastChange.value === "color" && backgroundHex.value) {
    return {
      backgroundColor: backgroundHex.value, // Jika terakhir mengubah warna latar belakang
    };
  }

  if (lastChange.value === "image" && background.value) {
    return {
      backgroundImage: `url(${background.value})`, // Jika terakhir memilih gambar template
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }

  // Default fallback jika tidak ada perubahan
  return {
    backgroundColor: "#FFFFFF",
  };
});

// Watchers untuk mendeteksi perubahan yang terakhir
watch(backgroundHex, (newVal) => {
  if (newVal) {
    lastChange.value = "color"; // Tandai jika perubahan datang dari color picker
  }
});

watch(background, (newVal) => {
  if (newVal) {
    lastChange.value = "image"; // Tandai jika perubahan datang dari template image
  }
});

// Watch for hex input changes
watch(
  () => backgroundColor.value,
  (newVal) => {
    // Check if the value is a valid hex color format
    if (/^#[0-9A-Fa-f]{6}$/i.test(newVal)) {
      backgroundHex.value = newVal; // Update hex input when color picker changes
    } else {
      console.error("Invalid hex color format:", newVal);
    }
  }
);

console.log(`${lokasi}/orders/${customerId}/fg`);
// Construct the database reference for the 'fg' field
const fgRef = dbRef(db, `${lokasi}/orders/${customerId}/fg`);

// Fetch the snapshot from the database
get(fgRef)
  .then((snapshot) => {
    if (snapshot.exists()) {
      // Data exists at the path, log it
      fg.value = snapshot.val();
      console.log("Fetched fg data:", fg);
    } else {
      // No data found at the path
      console.log("No data available at this path");
    }
  })
  .catch((error) => {
    console.error("Error fetching data:", error);
  });

const requireConfirmation = () => {
  // Cek apakah sudah ada rating di database
  const ratingRef = dbRef(db, `${lokasi}/orders/${customerId}/ratingFG`);
  get(ratingRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const ratingRef = dbRef(db, `${lokasi}/orders/${customerId}/ratingCS`);

        get(ratingRef).then((snapshot) => {
          if (snapshot.exists()) {
            // Jika rating CS sudah ada
            showCSRatingDialog.value = false; // Tutup dialog
            openLayoutModal();
          } else {
            showCSRatingDialog.value = true;
          }
        });
      } else {
        // Rating belum ada, tampilkan dialog rating
        if (fg.value) {
          confirm.require({
            group: "headless",
            header: "Rate Fotografer",
            message: `Mohon memberikan rating untuk ${fg.value}`,
            accept: () => {
              toast.add({
                severity: "info",
                summary: "Rating Saved",
                detail: `You rated: ${ratingValue.value}`,
                group: "tr",
                life: 3000,
              });
            },
            reject: () => {
              toast.add({
                severity: "error",
                summary: "Rating Dibatalkan",
                detail: "Anda belum memberikan rating.",
                group: "tr",
                life: 3000,
              });
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
};

const handleAccept = (acceptCallback) => {
  // Check if a rating has been given
  if (ratingValue.value > 0) {
    // Check if source is selected, and handle error if not
    if (source.value === null || source.value === "") {
      sourceError.value = true; // Show error if no source is selected
      return; // Stop further processing if no source is selected
    } else {
      sourceError.value = false; // Reset error if source is selected

      // Proceed with the database update if validation passes
      const ratingRef = dbRef(db, `${lokasi}/orders/${customerId}/`);
      update(ratingRef, {
        ratingFG: ratingValue.value,
        feedbackFG: feedback.value, // Save feedback
        infoDari: source.value.label, // Save source
      })
        .then(() => {
          acceptCallback(); // Call the callback if the update is successful
          showCSRatingDialog.value = true; // Tampilkan dialog rating CS
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
  } else {
    // Display a warning if no rating is provided
    toast.add({
      severity: "warn",
      summary: "No Rating",
      detail: "Isi rating dahulu sebelum melanjutkan.",
      group: "tr",
      life: 3000,
    });
  }
};

const handleReject = (rejectCallback) => {
  rejectCallback();
};

const submitCSRating = () => {
  const ratingRef = dbRef(db, `${lokasi}/orders/${customerId}/ratingCS`);

  get(ratingRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        // Jika rating CS sudah ada

        showCSRatingDialog.value = false; // Tutup dialog
      } else {
        // Simpan rating CS jika belum ada
        if (ratingCS.value > 0) {
          update(dbRef(db, `${lokasi}/orders/${customerId}/`), {
            ratingCS: ratingCS.value,
            feedbackCS: feedbackCS.value,
          })
            .then(() => {
              toast.add({
                severity: "success",
                summary: "Rating CS Tersimpan",
                detail: "Terima kasih atas penilaian Anda!",
                group: "tr",
                life: 3000,
              });
              showCSRatingDialog.value = false; // Tutup dialog
              openLayoutModal(); // Lanjutkan ke modal layout
            })
            .catch((error) => {
              console.error("Error updating rating CS:", error);
              toast.add({
                severity: "error",
                summary: "Gagal Menyimpan Rating",
                detail: "Terjadi kesalahan saat menyimpan rating CS.",
                group: "tr",
                life: 3000,
              });
            });
        } else {
          toast.add({
            severity: "warn",
            summary: "Rating Belum Diisi",
            detail: "Isi rating terlebih dahulu sebelum melanjutkan.",
            group: "tr",
            life: 3000,
          });
        }
      }
    })
    .catch((error) => {
      console.error("Error checking existing rating CS:", error);
      toast.add({
        severity: "error",
        summary: "Gagal Mengecek Rating",
        detail: "Terjadi kesalahan saat memeriksa rating CS.",
        group: "tr",
        life: 3000,
      });
    });
};

const transformStyles = computed(() => ({
  transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value}) rotate(${rotate.value}deg)`,
}));

const applyTemplate = (template) => {
  background.value = template;
};

const openLayoutModal = () => {
  showRatingDialog.value = false; // Close rating dialog
  showModal.value = true; // Open layout modal
};

const closeModal = () => {
  showModal.value = false;
};

const saveLayout = async () => {
  isLoading.value = true;
  if (!selectedLayout.value) {
    toast.add({
      severity: "warn",
      summary: "Pilih Layout",
      detail: "Silakan pilih layout sebelum menyimpan.",
      group: "tr",
      life: 3000,
    });
    return; // Prevent saving if no layout selected
  } else {
    try {
      console.log("Start saving layout...");

      const canvasContainers = document.querySelectorAll(".canvas-container");

      // Check if there are any canvas containers found
      if (canvasContainers.length === 0) {
        console.error("No canvas containers found");
        return;
      }
      console.log(`${canvasContainers.length} canvas containers found`);

      // Iterate over each canvas container
      for (const canvasContainer of canvasContainers) {
        console.log(`Processing canvas container:`, canvasContainer);

        // Ensure the canvas container has a valid size
        if (
          canvasContainer.offsetWidth === 0 ||
          canvasContainer.offsetHeight === 0
        ) {
          console.error("Canvas container size is invalid", canvasContainer);
          continue; // Skip this container if size is invalid
        }

        const desiredWidth = 2000;
        const desiredHeight = 3000;
        const scaleX = desiredWidth / canvasContainer.offsetWidth;
        const scaleY = desiredHeight / canvasContainer.offsetHeight;
        const scale = Math.min(scaleX, scaleY);

        console.log("Scale factor calculated:", scale);

        // Before capturing the image, make sure the filterStyle is applied
        const imageContainer = canvasContainer.querySelector(".image");
        if (imageContainer) {
          const computedStyle = window.getComputedStyle(imageContainer);
          console.log("Computed filter:", computedStyle.filter); // Pastikan nilainya sesuai
          const filterValue = filterStyle.value; // Dereference the computed ref
          imageContainer.style.filter = filterStyle.value.filter; // Apply just the filter property value as a string
          imageContainer.offsetHeight;
          console.log(
            "Applied filterStyle to image container:",
            filterValue.filter
          );
        } else {
          console.error("Image container not found within canvas container");
        }

        const canvas = await html2canvas(canvasContainer, {
          useCORS: true,
          allowTaint: true,
          scale: scale,
          backgroundColor: null,
          x: 0,
          y: 0,
        });
        console.log(`Canvas container:`, canvasContainer);
        console.log("Canvas captured : ", canvas);

        // Resize the canvas to 2000x3000 after capturing
        const resizedCanvas = document.createElement("canvas");
        const ctx = resizedCanvas.getContext("2d");
        resizedCanvas.width = 2000;
        resizedCanvas.height = 3000;
        // ctx.filter = filterStyle.value.filter;
        ctx.drawImage(canvas, 0, 0, 2000, 3000); // Draw the original canvas into the resized canvas

        console.log("Canvas resized to 2000x3000");

        // If not saving all backgrounds, directly save the single layout
        if (!saveInAllBackgrounds.value) {
          const imageUrl = resizedCanvas.toDataURL("image/png", 1);
          console.log("Image URL created for layout:", imageUrl);

          isLoading.value = false;
          const link = document.createElement("a");
          link.href = imageUrl;
          link.download = `${orderId}.png`;
          link.click();
          console.log("Layout saved as PNG");
          selectLayout(selectedLayout.value); // Call selectLayout after saving
          closeModal();
          return; // Exit function as no zip is required
        }

        // For multiple backgrounds, zip the images
        const zip = new JSZip();
        console.log("Creating zip for multiple backgrounds...");

        // Iterate through templates to generate background images
        for (let i = 0; i < templates.value.length; i++) {
          console.log(`Processing template ${i}:`, templates.value[i]);

          // Apply background and wait before capturing image
          applyTemplate(templates.value[i]);
          console.log(`Applied template ${i}:`, templates.value[i]);

          await new Promise((resolve) => setTimeout(resolve, 500)); // Ensure background is applied before capturing image

          // Capture the image after delay
          const imageCanvas = await html2canvas(canvasContainer, {
            useCORS: true,
            allowTaint: true,
            scale: scale,
            backgroundColor: null,
            x: 0,
            y: 0,
          });

          // Resize the captured canvas for the template to 2000x3000
          const resizedImageCanvas = document.createElement("canvas");
          const resizedCtx = resizedImageCanvas.getContext("2d");
          resizedImageCanvas.width = 2000;
          resizedImageCanvas.height = 3000;
          // ctx.filter = filterStyle.value.filter;
          resizedCtx.drawImage(imageCanvas, 0, 0, 2000, 3000);

          console.log(
            `Captured and resized image for template ${i}, width: 2000, height: 3000`
          );

          const imageUrl = resizedImageCanvas.toDataURL("image/png", 1);
          zip.file(`background_${i}.png`, imageUrl.split(",")[1], {
            base64: true,
          });
          console.log(`Added background_${i}.png to zip`);

          // Create grayscale version for specific templates only
          if (
            templates.value[i] === "/template-bg/polisi.jpg" ||
            templates.value[i] === "/template-bg/putih.jpg"
          ) {
            console.log(`Creating grayscale version for template ${i}`);

            const grayscaleCanvas = document.createElement("canvas");
            const ctx = grayscaleCanvas.getContext("2d");
            grayscaleCanvas.width = resizedImageCanvas.width;
            grayscaleCanvas.height = resizedImageCanvas.height;
            ctx.drawImage(resizedImageCanvas, 0, 0);
            ctx.filter = "grayscale(100%)";
            ctx.drawImage(resizedImageCanvas, 0, 0); // Corrected source for grayscale

            zip.file(
              `background_${i}_grayscale.png`,
              grayscaleCanvas.toDataURL("image/png", 1).split(",")[1],
              { base64: true }
            );
            console.log(`Added grayscale background_${i}_grayscale.png to zip`);
          }
        }

        // Generate and download zip file
        const content = await zip.generateAsync({ type: "blob" });
        isLoading.value = false;
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = `${orderId}.zip`;
        link.click();
        console.log("Generated and downloaded zip file");
        selectLayout(selectedLayout.value); // Call selectLayout after saving
        closeModal();
      }
    } catch (error) {
      console.error("Error occurred in saveLayout:", error);
    }
  }
};

onMounted(() => {
  window.addEventListener("resize", checkScreenSize);
  const storedOrderId = localStorage.getItem("orderId");
  console.log("Stored Order ID:", storedOrderId);
  const templateFiles = import.meta.glob(
    "/public/template-bg/*.{png,jpg,jpeg}"
  );
  templates.value = Object.keys(templateFiles).map((file) =>
    file.replace("/public", "")
  );
  const container = document.querySelector(".image-wrapper");

  interact(container)
    .gesturable({
      listeners: {
        start: () => {
          container.style.transition = "none";
        },
        move: (event) => {
          scale.value = Math.max(0.5, scale.value * (1 + event.ds));
          rotate.value += event.da;
          translateX.value += event.dx;
          translateY.value += event.dy;
        },
      },
      options: {
        // Menonaktifkan passive listener untuk dapat menggunakan preventDefault
        passive: false,
      },
    })
    .draggable({
      listeners: {
        move: (event) => {
          translateX.value += event.dx;
          translateY.value += event.dy;
        },
        end: (event) => {
          console.log(
            `Final Position - x: ${translateX.value}, y: ${translateY.value}`
          );
        },
      },
      options: {
        // Menonaktifkan passive listener untuk dapat menggunakan preventDefault
        passive: false,
      },
    });
});

// Hapus event listener saat komponen di-unmount
onBeforeUnmount(() => {
  window.removeEventListener("resize", checkScreenSize);
});

const back = () => {
  router.push("/customer"); // This will navigate to the previous page in history
};
</script>

<style scoped>
.canvas-container {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  /* border-radius: 8px; */
  overflow: hidden;
  position: relative;
}
.canvas-container .image-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.slider-container {
  touch-action: none; /* Prevent default scrolling behavior */
}

.template-scroll-container {
  max-height: 100%; /* Batasi tinggi agar tidak melebihi */
  padding: 3px;
}

.template-item {
  width: 100px;
  height: autopx; /* Pastikan tinggi gambar tidak terlalu besar */
  object-fit: cover;
  border-radius: 8px;
}

.image-wrapper {
  touch-action: none; /* Prevents default touch scrolling */
}
</style>
