<template>
  <div class="p-5">
    <h1 class="text-xl font-bold mb-4">Print File</h1>

    <!-- Files grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div
        v-for="file in files"
        :key="file.name"
        class="border rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
      >
        <img
          :src="file.thumbnail"
          alt="File thumbnail"
          class="w-full h-32 object-cover"
        />
        <div class="p-2 text-center">
          <p class="text-sm font-medium">{{ file.name }}</p>
          <Button
            label="Print"
            class="p-button-success mt-2"
            @click="printFile(file)"
            :loading="file.isLoading"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import Button from "primevue/button";
const ip = import.meta.env.VITE_SERVER_IP_PRINT;

export default {
  name: "Print",
  components: {
    Button,
  },
  setup() {
    const toast = useToast();
    const files = ref([]); // Initialize files array

    const fetchFiles = async () => {
      try {
        const response = await fetch(`http://${ip}/print/files`);
        if (response.ok) {
          const fetchedFiles = await response.json();
          // Set loading state to false for all files initially
          files.value = fetchedFiles.map((file) => ({
            ...file,
            isLoading: false,
          }));
        } else {
          throw new Error("Failed to fetch files.");
        }
      } catch (error) {
        toast.add({
          severity: "error",
          summary: "Error",
          detail: error.message,
          life: 3000,
        });
      }
    };

    const printFile = async (file) => {
      file.isLoading = true; // Set loading state to true for the clicked file
      try {
        const response = await fetch(`http://${ip}/print`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ path: file.path }),
        });

        if (response.ok) {
          toast.add({
            severity: "success",
            summary: "Success",
            detail: "File sent to printer!",
            life: 3000,
          });
        } else {
          throw new Error("Failed to send file to printer.");
        }
      } catch (error) {
        toast.add({
          severity: "error",
          summary: "Error",
          detail: error.message,
          life: 3000,
        });
      } finally {
        file.isLoading = false; // Set loading state to false after print process
      }
    };

    onMounted(fetchFiles);

    return {
      files,
      printFile,
    };
  },
};
</script>

<style scoped>
.grid {
  display: grid;
  gap: 1rem;
}
</style>
