<template>
  <div
    class="h-screen bg-gray-100 grid gap-4 p-3 justify-center"
    style="grid-template-columns: 40% 25%"
  >
    <!-- Grid Tengah: Canvas 4R -->
    <div
      class="bg-white py-4 shadow-lg rounded-lg flex flex-col items-center relative"
    >
      <h2 class="text-lg font-semibold text-gray-700 mb-3">Preview</h2>

      <div
        id="canvas"
        class="bg-gray-100 rounded-lg border-gray-300 w-[500px] h-[750px] flex items-center justify-center relative"
        ref="canvas"
      >
        <!-- Selected frame image displayed on canvas -->
        <img
          v-if="selectedFrame"
          :src="selectedFrame"
          alt="Selected Frame"
          class="absolute inset-0 w-full h-full object-cover"
          usemap="#image-map"
          style="z-index: 2; pointer-events: none"
        />

        <!-- Render drop zone areas -->
        <div
          v-for="(coord, index) in dropZones"
          :key="index"
          :style="getStyleFromCoords(coord)"
          class="drop-zone absolute bg-transparent cursor-pointer flex items-center justify-center"
          @click="onDropZoneClick(index)"
        >
          <span
            v-if="!draggedImage[index] && !isLoading"
            class="text-gray-500 text-sm"
          >
            Klik di sini
          </span>
          <div
            v-if="!draggedImage[index] && isLoading"
            class="flex items-center justify-center"
          >
            <svg
              class="animate-spin h-5 w-5 text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
          </div>
          <img
            v-if="draggedImage[index]"
            :src="draggedImage[index].url"
            alt="Dropped Image"
            :style="{
              ...draggedImage[index].style,
              zIndex: 1,
            }"
            class="absolute overflow-hidden object-contain"
          />
        </div>
      </div>
    </div>

    <!-- Grid Kanan: Pilihan Frame -->
    <div
      class="bg-white p-4 shadow-lg rounded-lg flex flex-col overflow-y-auto"
    >
      <h2 class="text-lg font-semibold mb-4 text-gray-700">Pilih Frame</h2>
      <div class="grid grid-cols-2 gap-4">
        <img
          v-for="(frame, index) in frames"
          :key="index"
          :src="frame.url"
          alt="Frame Option"
          class="w-full h-auto rounded-lg shadow-md cursor-pointer hover:opacity-50"
          @click="selectFrame(frame, index)"
        />
      </div>
    </div>
  </div>

  <!-- Back Button -->
  <div class="absolute top-4 left-6">
    <router-link to="/customer">
      <Button
        class="bg-gray-100 border-none text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition duration-200 back-button"
        icon="pi pi-arrow-left"
      />
    </router-link>
  </div>

  <!-- Popup Modal for Image Selection -->
  <div
    v-if="showImagePicker"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10"
  >
    <div
      class="max-h-[90%] bg-white p-4 rounded-lg shadow-lg w-[90%] sm:w-[75%] md:w-1/2 overflow-y-auto"
    >
      <h2 class="text-lg font-semibold mb-4 text-center">Pilih Gambar</h2>
      <div class="flex flex-wrap gap-4 justify-center">
        <img
          v-for="(image, index) in galleryImages"
          :key="index"
          :src="image.url"
          alt="Selectable Image"
          class="w-32 h-32 object-cover rounded-lg shadow-md cursor-pointer hover:ring-2 hover:ring-blue-500 transition duration-200"
          @click="placeImageInZone(image)"
        />
      </div>
      <div class="flex justify-center mt-10 mb-3">
        <Button
          @click="closeImagePicker"
          class="py-2 px-10 text-white rounded-lg"
          label="Tutup"
          severity="danger"
        />
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
            v-model="ratingFG"
            cancel
            icon="pi pi-star-o"
            class="text-yellow-500"
          />
        </div>

        <!-- Feedback Textarea -->
        <div class="my-2 w-full">
          <textarea
            v-model="feedbackFG"
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

  <Button
    class="fixed bottom-10 right-10 py-3 px-6 bg-blue-500 text-white rounded-full shadow-lg text-lg"
    @click="handlePrint"
    icon="pi pi-print mr-1"
    label="Print"
    :loading="isLoadingPrint"
  />
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import { getCoords } from "../frame"; // Import function to get frame coordinates
import interact from "interactjs";
import html2canvas from "html2canvas";
import { useToast } from "primevue/usetoast";
import { useRouter } from "vue-router";
import { ref as dbRef, get, update } from "firebase/database"; // Firebase Database
import { useConfirm } from "primevue/useconfirm";
import { db } from "../firebase";

const router = useRouter();
const ip = import.meta.env.VITE_SERVER_IP;
const lokasi = import.meta.env.VITE_LOCATION;
const isLoading = ref(false);
const isLoadingPrint = ref(false);
const selectedFrame = ref(null);
const frameName = ref(null);
const dropZones = ref([]); // Stores coordinates for drop zones
const draggedImage = ref([]);
const showImagePicker = ref(false); // Controls the visibility of the image picker popup
const currentZoneIndex = ref(null); // Stores the index of the clicked drop zone
const galleryImages = ref([]);
const fg = ref(null);
const feedbackFG = ref(""); // Store the feedback
const source = ref(null); // Model for the selected value
const sourceError = ref(false); // Flag to show error if no source is selected
const confirm = useConfirm();
const toast = useToast();
const showRatingDialog = ref(false); // Rating dialog visibility state
const ratingFG = ref(0); // Rating value
const customerId = localStorage.getItem("orderId");
const showModal = ref(false);

const originalWidth = 1200;
const originalHeight = 1800;
const newWidth = 500;
const newHeight = 750;

// Dynamically import all frame images from the assets folder
const frameContext = import.meta.glob("../assets/frame/*.png");
const frames = ref([]);

// Store frames with their names
Object.keys(frameContext).forEach((path) => {
  const frameName = path.split("/").pop().replace(".png", ""); // Extract frame name from the path
  frameContext[path]().then((module) => {
    frames.value.push({ name: frameName, url: module.default }); // Store both name and URL
  });
});

// Declare a ref to store the orderId
const orderId = ref(null);

// Use onMounted to get the orderId from localStorage
onMounted(() => {
  const storedOrderId = localStorage.getItem("orderId");
  if (storedOrderId) {
    orderId.value = storedOrderId;
    console.log("Order ID retrieved from localStorage:", orderId.value);
  } else {
    console.log("No Order ID found in localStorage.");
  }

  const storedGalleryImages = localStorage.getItem("galleryImages");
  if (storedGalleryImages) {
    galleryImages.value = storedGalleryImages
      ? JSON.parse(storedGalleryImages)
      : []; // Default value as an empty array

    console.log(
      "Gallery images restored from localStorage:",
      galleryImages.value
    );
  }
  // Jika galleryImages kosong, arahkan ke halaman /customer
  if (!galleryImages.value.length) {
    console.log("Gallery images are empty. Redirecting to /customer...");
    router.push("/customer");
  }
});

const handlePrint = async () => {
  isLoadingPrint.value = true;
  await nextTick(); // Ensure the DOM is updated before capturing the element

  const element = document.getElementById("canvas");
  if (!element) return;

  // Get the current size of the canvas
  const originalWidth = element.offsetWidth;
  const originalHeight = element.offsetHeight;

  const targetWidth = 1200; // Desired width for printing
  const targetHeight = 1800; // Desired height for printing

  // Scale calculation for print
  const scaleX = targetWidth / originalWidth;
  const scaleY = targetHeight / originalHeight;
  const scale = Math.min(scaleX, scaleY); // Maintain aspect ratio
  console.log("Scale:", scale);

  try {
    // Capture the element with html2canvas
    const canvas = await html2canvas(element, {
      scale: scale, // Ensure the scale is applied correctly
      useCORS: true, // Enable CORS if images are loaded from external URLs
      backgroundColor: null, // Remove background color for transparency
    });

    const canvasDataUrl = canvas.toDataURL("image/png", 1); // Convert the canvas to a PNG data URL

    // Convert the data URL to a Blob
    const blob = await fetch(canvasDataUrl)
      .then((res) => res.blob())
      .catch((err) => console.error("Error converting canvas to blob:", err));

    const formData = new FormData();
    formData.append("file", blob, `${orderId.value}-${frameName.value}.png`);

    // Send the image to the server for printing
    const response = await fetch(`http://${ip}/print`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    isLoadingPrint.value = false;
    if (response.ok) {
      // Wait for confirmation before updating status
      await requireConfirmation();

      // Update Firebase status to 'printing' after confirmation
      const orderRef = dbRef(db, `${lokasi}/orders/${orderId.value}`);
      update(orderRef, { status: "printing" })
        .then(() => {
          console.log("Order status updated to printing");
        })
        .catch((error) => {
          console.error("Error updating order status:", error);
        });

      console.log("File uploaded successfully:", result);
      toast.add({
        group: "tr",
        severity: "success",
        summary: "Print Request",
        detail: "Print request sent successfully!",
        life: 3000,
      });
    } else {
      console.error("Failed to upload file:", result.error);
      toast.add({
        group: "tr",
        severity: "error",
        summary: "Print Request",
        detail: "Failed to upload the print request.",
        life: 3000,
      });
    }
  } catch (error) {
    isLoadingPrint.value = false;
    console.error("Error capturing the element:", error);
    toast.add({
      group: "tr",
      severity: "error",
      summary: "Error",
      detail: "An error occurred while capturing the element.",
      life: 3000,
    });
  }
};

// Fungsi memilih frame dan membuat drop zone
const selectFrame = (frame, frameIndex) => {
  selectedFrame.value = frame.url; // Set the selected frame URL
  frameName.value = frame.name; // Set the selected frame name
  const mapName = frame.name; // Use the name from the selected frame object
  const coords = getCoords(
    mapName,
    originalWidth,
    originalHeight,
    newWidth,
    newHeight
  );

  // Reset dragged images and drop zones
  draggedImage.value = []; // Clear all dropped images
  dropZones.value = []; // Clear existing drop zones

  if (coords.length === 0) {
    console.warn("Koordinat tidak ditemukan untuk frame ini.");
  } else {
    console.log("Koordinat drop zone:", coords); // Debugging log
    dropZones.value = coords;
  }
};

// Fungsi untuk klik drop zone
const onDropZoneClick = (index) => {
  // Jika drop zone sudah berisi gambar, keluar dari fungsi tanpa mengubah loading
  if (draggedImage.value[index]) {
    console.log(`Drop zone ${index} sudah terisi gambar.`);
    return;
  }

  // Jika drop zone belum terisi gambar, set loading dan buka image picker
  console.log(`Drop zone ${index} diklik`);
  isLoading.value = true;
  currentZoneIndex.value = index;

  setTimeout(() => {
    showImagePicker.value = true; // Tampilkan modal image picker
    isLoading.value = false; // Set loading ke false
  }, 2000); // Simulasi delay
};

const placeImageInZone = (image) => {
  isLoading.value = false;
  if (currentZoneIndex.value !== null) {
    draggedImage.value[currentZoneIndex.value] = {
      url: image.url,
      style: { zIndex: 2 },
    };

    nextTick(() => {
      console.log("Inside nextTick");
      const dropZoneElementCheck =
        document.querySelectorAll(".drop-zone")[currentZoneIndex.value];
      const imageElementCheck = dropZoneElementCheck?.querySelector("img");

      console.log("dropZoneElementCheck:", dropZoneElementCheck);
      console.log("imageElementCheck:", imageElementCheck);

      if (imageElementCheck) {
        initializeInteract(imageElementCheck, dropZoneElementCheck);
      } else {
        console.warn("Image element not found inside nextTick.");
      }
    });
  }
  showImagePicker.value = false;
};

const initializeInteract = (imageElement, dropZone) => {
  console.log("Interacting with image:", imageElement);

  // Ensure the image has touch-action and transform-origin properly set
  imageElement.style.touchAction = "none";

  interact(imageElement)
    .draggable({
      listeners: {
        start() {
          imageElement.style.transition = "none"; // Disable transition for smoother drag
        },
        move(event) {
          const scale =
            parseFloat(imageElement.getAttribute("data-scale")) || 1;
          const rotation =
            parseFloat(imageElement.getAttribute("data-rotation")) || 0;
          const dataX = parseFloat(imageElement.getAttribute("data-x")) || 0;
          const dataY = parseFloat(imageElement.getAttribute("data-y")) || 0;

          // Adjust the new position based on the scale
          let newX = dataX + event.dx / scale; // Adjust movement by scale
          let newY = dataY + event.dy / scale; // Adjust movement by scale

          // Apply the combined transform: translate + scale + rotate
          imageElement.style.transform = `translate(${newX}px, ${newY}px) rotate(${rotation}deg) scale(${scale})`;
          imageElement.setAttribute("data-x", newX);
          imageElement.setAttribute("data-y", newY);
        },
        end() {
          // Optional: Log final position
          console.log(
            `Final Position - x: ${imageElement.getAttribute(
              "data-x"
            )}, y: ${imageElement.getAttribute("data-y")}`
          );
        },
      },
      options: {
        passive: false, // Disable passive listener for preventDefault
      },
    })
    .gesturable({
      listeners: {
        start() {
          imageElement.style.transition = "none"; // Disable transition during gesture
        },
        move(event) {
          let scale = parseFloat(imageElement.getAttribute("data-scale")) || 1;
          let rotation =
            parseFloat(imageElement.getAttribute("data-rotation")) || 0;

          // Calculate the new scale based on gesture (zoom)
          const newScale = scale * (1 + event.ds); // Scale change
          const newRotation = rotation + event.da; // Rotation change

          // Apply the combined transform: translate + scale + rotate
          const dataX = imageElement.getAttribute("data-x") || 0;
          const dataY = imageElement.getAttribute("data-y") || 0;

          imageElement.style.transform = `translate(${dataX}px, ${dataY}px) rotate(${newRotation}deg) scale(${newScale})`;

          // Store the new scale and rotation values in attributes
          imageElement.setAttribute("data-scale", newScale);
          imageElement.setAttribute("data-rotation", newRotation);
        },
      },
      options: {
        passive: false, // Disable passive listener for preventDefault
      },
    });
};

// Fungsi untuk menutup modal
const closeImagePicker = () => {
  showImagePicker.value = false;
};

// Utility untuk mengonversi koordinat ke style CSS
const getStyleFromCoords = (coords) => {
  const [x1, y1, x2, y2] = coords.split(",").map(Number);
  return {
    left: `${Math.min(x1, x2)}px`,
    top: `${Math.min(y1, y2)}px`,
    width: `${Math.abs(x2 - x1)}px`,
    height: `${Math.abs(y2 - y1)}px`,
    position: "absolute",
    zIndex: 1,
  };
};

const openLayoutModal = () => {
  showRatingDialog.value = false; // Close rating dialog
  showModal.value = true; // Open layout modal
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
  return new Promise((resolve, reject) => {
    // Cek apakah sudah ada rating di database
    const ratingRef = dbRef(db, `${lokasi}/orders/${customerId}/ratingFG`);
    get(ratingRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          // Rating sudah ada, tampilkan pesan info atau lakukan tindakan lainnya
          openLayoutModal();
          resolve(); // Proceed with the next step after confirmation
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
                  detail: `You rated: ${ratingFG.value}`,
                  group: "tr",
                  life: 3000,
                });
                openLayoutModal();
                resolve(); // Proceed with the next step after rating
              },
              reject: () => {
                toast.add({
                  severity: "error",
                  summary: "Rating Dibatalkan",
                  detail: "Anda belum memberikan rating.",
                  group: "tr",
                  life: 3000,
                });
                reject("Rating process was cancelled");
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
            reject("Failed to load rating data");
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
        reject("Error occurred while checking rating");
      });
  });
};

const handleAccept = (acceptCallback) => {
  // Check if a rating has been given
  if (ratingFG.value > 0) {
    // Check if source is selected, and handle error if not
    if (source.value === null || source.value === "") {
      sourceError.value = true; // Show error if no source is selected
      return; // Stop further processing if no source is selected
    } else {
      sourceError.value = false; // Reset error if source is selected

      // Proceed with the database update if validation passes
      const ratingRef = dbRef(db, `${lokasi}/orders/${customerId}/`);
      update(ratingRef, {
        ratingFG: ratingFG.value,
        feedbackFG: feedbackFG.value, // Save feedback
        infoDari: source.value.label, // Save source
      })
        .then(() => {
          acceptCallback(); // Call the callback if the update is successful
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
</script>

<style>
.drop-zone {
  position: absolute;
  z-index: 1; /* Ensure drop zone itself is at a lower z-index */
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.drop-zone img {
  /* transform-origin: center center; */
  touch-action: none; /* Disable default touch behavior */
  transition: none; /* Disable transition for smoother drag and gesture */
  z-index: 2;
}

/* Custom CSS to increase icon size */
.back-button .pi {
  font-size: 1.25rem; /* Adjust size as needed */
}
</style>
