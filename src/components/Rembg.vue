<template>
  <div class="flex h-screen bg-gray-100">
    <!-- Left Panel: File Upload -->
    <div class="w-1/2 p-6 overflow-auto">
      <div class="card">
        <Toast />
        <FileUpload
          name="imageFile"
          accept="image/*"
          :multiple="true"
          :maxFileSize="100000000"
          @select="onFileSelected"
          @upload="onFileUpload"
        >
          <template
            #header="{ chooseCallback, uploadCallback, clearCallback, files }"
          >
            <div class="flex justify-between items-center gap-4">
              <div class="flex gap-2">
                <Button
                  @click="chooseCallback()"
                  icon="pi pi-images"
                  rounded
                  outlined
                  severity="secondary"
                ></Button>
                <Button
                  @click="uploadEvent(uploadCallback)"
                  icon="pi pi-cloud-upload"
                  rounded
                  outlined
                  severity="success"
                  :disabled="!files || files.length === 0"
                ></Button>
                <Button
                  @click="clearCallback()"
                  icon="pi pi-times"
                  rounded
                  outlined
                  severity="danger"
                  :disabled="!files || files.length === 0"
                ></Button>
              </div>
            </div>
          </template>

          <template #content="{ files }">
            <div v-if="files.length > 0" class="mt-4">
              <h5>Pending Upload</h5>
              <div class="flex flex-wrap gap-4">
                <div
                  v-for="(file, index) in files"
                  :key="file.name + file.type + file.size"
                  class="p-4 rounded-border flex flex-col border items-center gap-4"
                >
                  <img :src="file.objectURL" alt="image preview" width="100" />
                  <span class="font-semibold">{{ file.name }}</span>
                  <div>{{ formatSize(file.size) }}</div>
                  <ProgressBar
                    :value="uploadProgress"
                    :showValue="false"
                    class="w-full md:ml-auto"
                  />
                </div>
              </div>
            </div>
          </template>

          <template #empty>
            <div class="flex items-center justify-center flex-col">
              <i class="pi pi-cloud-upload text-4xl text-muted-color" />
              <p class="mt-6 mb-0">Drag and drop files here to upload.</p>
            </div>
          </template>
        </FileUpload>
      </div>
    </div>

    <!-- Right Panel: Result -->
    <div class="w-1/2 h-full p-6 overflow-auto">
      <div v-if="processedImages.length > 0" class="card">
        <h2 class="text-lg font-medium text-gray-600 mb-2">
          Processed Images:
        </h2>
        <div class="flex flex-wrap gap-4">
          <div
            v-for="(image, index) in processedImages"
            :key="index"
            class="flex flex-col items-center"
          >
            <img
              :src="image.src"
              alt="Processed Image"
              class="rounded-lg shadow-md"
              width="250"
            />
            <a
              :href="image.src"
              :download="image.name"
              class="mt-2 p-button p-button-success"
            >
              Download
            </a>
          </div>
        </div>
      </div>
      <div v-if="errorMessage" class="mt-6 text-red-600 text-sm text-center">
        {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useToast } from "primevue/usetoast";
import axios from "axios";

const toast = useToast();
const selectedFile = ref([]);
const processedImages = ref([]); // Array to store all processed images
const errorMessage = ref(null);
const uploadProgress = ref(0);
const individualProgress = ref([]); // Array to track progress per file

// Handle file selection
const onFileSelected = (event) => {
  selectedFile.value = event.files;
  errorMessage.value = null;
  individualProgress.value = Array(event.files.length).fill(0);
};

// Format file size
const formatSize = (bytes) => {
  const k = 1024;
  const dm = 2;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  if (bytes === 0) return `0 ${sizes[0]}`;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(dm)} ${sizes[i]}`;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const uploadEvent = async (uploadCallback) => {
  if (!selectedFile.value || selectedFile.value.length === 0) return;

  const totalFiles = selectedFile.value.length;
  let uploadedFiles = 0; // Track the number of successfully uploaded files

  // To calculate overall progress more smoothly
  let totalProgress = 0;

  for (let i = 0; i < totalFiles; i++) {
    const currentFile = selectedFile.value[i];
    const formData = new FormData();
    formData.append("file", currentFile);

    try {
      const response = await axios.post(
        "http://192.168.0.229:8080/segment/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            individualProgress.value[i] = percent;

            // Calculate the overall progress smoothly
            totalProgress = individualProgress.value.reduce(
              (sum, prog) => sum + prog,
              0
            );
          },
        }
      );

      if (response.data.success) {
        uploadProgress.value = Math.round(totalProgress / totalFiles);
        toast.add({
          severity: "success",
          summary: `File ${i + 1} of ${totalFiles}`,
          detail: `${currentFile.name} uploaded successfully!`,
          life: 3000,
        });

        const processedImage = {
          src: `data:image/png;base64,${response.data.image}`,
          name: `${currentFile.name.split(".")[0]}.png`,
        };
        processedImages.value.push(processedImage);
        uploadedFiles++; // Increment uploaded files counter
      } else {
        errorMessage.value = `Error processing ${currentFile.name}: ${
          response.data.message || "Unknown error."
        }`;
      }
    } catch (error) {
      errorMessage.value = `Error uploading ${currentFile.name}: ${error.message}`;
    }
  }

  // Delay of 2 seconds before calling the callback
  await sleep(2000); // Wait for 2 seconds
  uploadCallback();
  uploadProgress.value = 0; // Reset the overall progress
};

const onFileUpload = () => {
  toast.add({
    severity: "success",
    summary: "Success",
    detail: "All files uploaded successfully!",
    life: 3000,
  });
};
</script>

<style scoped>
/* Scoped styling for this component */
</style>
