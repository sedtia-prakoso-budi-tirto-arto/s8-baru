<template>
  <div>
    <input type="file" @change="uploadFile" />
    <img v-if="imageUrl" :src="imageUrl" alt="Uploaded Image" />
  </div>
</template>

<script>
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase"; // Pastikan import konfigurasi Firebase

export default {
  data() {
    return {
      imageUrl: null,
    };
  },
  methods: {
    async uploadFile(event) {
      const file = event.target.files[0];
      const storageRef = ref(storage, `uploads/${file.name}`);

      // Upload file
      await uploadBytes(storageRef, file);

      // Dapatkan URL file
      this.imageUrl = await getDownloadURL(storageRef);
    },
  },
};
</script>
