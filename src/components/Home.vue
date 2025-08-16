<script setup>
import {
  ref,
  onMounted,
  watch,
  reactive,
  watchEffect,
  nextTick,
  computed,
} from "vue";
import { db } from "../firebase"; // Make sure Firebase is correctly configured
import {
  ref as dbRef,
  set,
  get,
  child,
  query,
  orderByChild,
  onValue,
} from "firebase/database";
import {
  getStorage,
  ref as storageRef,
  listAll,
  getDownloadURL,
} from "firebase/storage";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Toast from "primevue/toast";
import { useToast } from "primevue/usetoast";
import Textarea from "primevue/textarea";
import axios from "axios";

const toast = useToast();
const selectedServices = ref([]);
const showModal = ref(false);
const name = ref("");
const whatsapp = ref("");
const email = ref("");
const keterangan = ref("");
const errorMessage = ref("");
const location = ref({}); // Store selected location data
const locations = ref([]); // Store available locations from Firebase
const loading = ref(false); // Status loading
const services = ref([]);
const searchQuery = ref("");
const serviceIds = ref([]);
const lokasi = import.meta.env.VITE_LOCATION;
const csOptions = ref([]); // CS options loaded from the database
const selectedCS = ref(null); // Selected CS
const emailError = ref(false);
const backgroundImages = ref(Array.from({ length: 100000 }));
const loadLazyTimeout = ref();
const repeatCount = ref(1);
const selectedBackgrounds = ref(Array(repeatCount.value).fill(null));
const pilFoto = ref(1);
const showDialog = ref(false);
const selectedIndex = ref(null);

// Ekstrak kategori unik dari label
const categories = computed(() => {
  const uniqueCategories = new Set(
    backgroundImages.value.map(image => image.label.split('/')[0])
  );

  return [...uniqueCategories];
});

const selectedCategory = ref(null);

// Filter gambar berdasarkan kategori yang dipilih
const filteredImages = computed(() => {
  if (!selectedCategory.value) return backgroundImages.value;
  return backgroundImages.value.filter(image => 
    image.label.startsWith(selectedCategory.value)
  );
});

const openDialog = (index) => {
  selectedIndex.value = index;
  showDialog.value = true;
  selectedCategory.value = categories.value[0];
};

const selectImage = (image) => {
  if (selectedIndex.value !== null) {
    selectedBackgrounds.value[selectedIndex.value] = image;
    showDialog.value = false;
  }
};

const onLazyLoad = (event) => {
  loading.value = true;

  if (loadLazyTimeout.value) {
    clearTimeout(loadLazyTimeout.value);
  }

  //imitate delay of a backend call
  loadLazyTimeout.value = setTimeout(() => {
    // const { first, last } = event;
    // const _backgroundImages = [...backgroundImages.value];

    // for (let i = first; i < last; i++) {
    //   _backgroundImages[i] = { label: `Item #${i}`, value: i };
    // }

    // backgroundImages.value = _backgroundImages;
    loading.value = false;
  }, Math.random() * 1000 + 250);
};

console.log(`${lokasi}`);

const isValidEmail = (email) => {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailPattern.test(email);
};

watch(email, (newEmail) => {
  emailError.value = !isValidEmail(newEmail);
});

// Fetch locations from Firebase when component mounts
onMounted(() => {
  fetchLocations();
  fetchServices();
  // getUserLocation();

  fetchCSList();
});

// Computed property to filter services based on searchQuery
const filteredServices = computed(() => {
  return services.value.filter(
    (service) =>
      service.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      service.desc.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const capitalize = (str) => {
  if (!str) return "";
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// Fetch CS list from Firebase
const fetchCSList = () => {
  const csRef = dbRef(db, `${lokasi}/cs`);
  get(csRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        // Convert snapshot into an array of CS names
        const csList = snapshot.val();
        csOptions.value = Object.keys(csList).map((key) => ({
          label: capitalize(csList[key]), // CS name
          value: key, // CS identifier (key)
        }));
      } else {
        csOptions.value = [];
      }
    })
    .catch((error) => {
      console.error("Error fetching CS list:", error);
      toast.add({
        severity: "error",
        summary: "Error Fetching CS",
        detail: "Terjadi kesalahan saat memuat daftar Customer Service.",
        group: "tr",
        life: 3000,
      });
    });
};

// Function to send email after saving order
async function sendEmail(
  timestamp,
  orderId,
  kode,
  name,
  email,
  whatsapp,
  services
) {
  try {
    const emailData = {
      timestamp,
      orderId,
      kode,
      name,
      email,
      whatsapp,
      services,
    };

    const response = await axios.post(
      "https://mailer-absensi-rev.vercel.app/send-nota",
      emailData
    );

    if (response.status === 200) {
      toast.add({
        group: "tr",
        severity: "success",
        summary: "Email Sent",
        detail: "The order details have been sent to the customer.",
        life: 3000,
      });
    } else {
      throw new Error("Error sending email");
    }
  } catch (error) {
    console.error("Error sending email:", error);
    toast.add({
      group: "tr",
      severity: "error",
      summary: "Email Error",
      detail: "There was an issue sending the email.",
      life: 3000,
    });
  }
}

async function fetchServices() {
  const servicesRef = dbRef(db, `${lokasi}/katalog`); // Referensi ke path 'katalog' di Firebase

  // Dengarkan perubahan pada node 'katalog' menggunakan onValue
  onValue(servicesRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val(); // Data mentah dari Firebase
      const loadedServices = []; // Array untuk menyimpan layanan yang sudah diolah
      const ids = []; // Array untuk menyimpan ID layanan

      console.log("Data:", data);

      // Iterasi melalui setiap entri di data menggunakan Object.keys
      Object.keys(data).forEach((id) => {
        const service = data[id]; // Data layanan terkait ID ini

        // Tetapkan repeatCount dari service.pilBg
        repeatCount.value = service.pilBg || 0; // Default 0 jika pilBg tidak ada atau undefined
        pilFoto.value = service.pilFoto || 1; // Default kosong jika pilFoto tidak ada atau undefined

        // Buat objek layanan yang terstruktur
        const serviceDetails = {
          id, // Menyimpan ID untuk referensi
          name: service.name,
          desc: service.desc,
          price: service.price,
          image: service.image,
          pilBg: service.pilBg, // Simpan pilBg untuk referensi
          pilFoto: service.pilFoto, // Simpan pilFoto untuk referensi
          services: [], // Array untuk sub-layanan
        };

        console.log(`Repeat count for service ID ${id}: ${repeatCount.value}`);
        console.log("pilFoto : ", pilFoto.value);

        // Jika ada sub-layanan (services), tambahkan ke array
        if (service.services) {
          Object.keys(service.services).forEach((key) => {
            const subService = service.services[key]; // Data sub-layanan
            serviceDetails.services.push(subService); // Tambahkan ke array sub-layanan
          });
        }

        // Tambahkan objek layanan ke array loadedServices
        loadedServices.push(serviceDetails);
        ids.push(id); // Simpan ID untuk referensi
      });

      // Perbarui data di state Vue
      services.value = loadedServices; // Semua data layanan
      serviceIds.value = ids; // Simpan semua ID layanan
      console.log("Loaded services:", services.value); // Debugging
    } else {
      console.log("No data available");
      services.value = []; // Kosongkan data jika tidak ada layanan
      serviceIds.value = []; // Kosongkan ID jika tidak ada data
      repeatCount.value = 0; // Reset repeatCount jika tidak ada data
    }
  });
}

async function fetchLocations() {
  try {
    const locationsSnapshot = await get(child(dbRef(db), "locations"));
    if (locationsSnapshot.exists()) {
      const locationsData = locationsSnapshot.val();
      // Use locations.value instead of this.locations
      locations.value = Object.keys(locationsData).map((id) => ({
        id: id, // Use the Firebase key as the ID
        kode: locationsData[id].name,
        name: locationsData[id].address, // Assuming `address` is the location's name
      }));
    } else {
      console.log("No locations found in Firebase.");
    }
  } catch (error) {
    console.error("Error fetching locations:", error);
    toast.add({
      group: "tr",
      severity: "error",
      summary: "Error Fetching Locations",
      detail: "Unable to retrieve locations from the database.",
      life: 3000,
    });
  }
}

// When location is selected, set it and generate the location code
function selectLocation(selectedLocation) {
  location.value = selectedLocation;
  console.log("Selected Location:", selectedLocation.value);
}

// Open service modal
function openModal(service) {
  selectedServices.value = [];
  selectService(service);
  showModal.value = true;
  selectedBackgrounds.value = [];
  repeatCount.value = service.pilBg || 1;
  pilFoto.value = service.pilFoto || 1;
  loadBackgroundImages();
}

// Function to load background images for a service
const loadBackgroundImages = async () => {
  // Initialize Firebase storage
  const storage = getStorage();

  // Create a reference to the root folder containing all service folders
  const rootRef = storageRef(storage, "bg");

  try {
    // List all items and subfolders in the root folder
    const itemsAndFolders = await listAll(rootRef);

    // Fetch URLs for all items across all folders
    const images = await Promise.all(
      itemsAndFolders.prefixes.map(async (folder) => {
        const folderItems = await listAll(folder);
        return Promise.all(
          folderItems.items.map(async (item) => {
            const url = await getDownloadURL(item);
            return {
              label: `${folder.name}/${item.name}`, // Folder and file name
              value: url, // URL of the file
            };
          })
        );
      })
    );

    // Flatten the array of images from all folders
    backgroundImages.value = images.flat();
  } catch (error) {
    console.error("Error fetching background images:", error);
  }
};

// Close modal
function closeModal() {
  showModal.value = false;
  name.value = "";
  whatsapp.value = "";
  email.value = "";
  selectedServices.value = [];
  errorMessage.value = "";
}

// Save order
async function saveData() {
  if (!name.value || !whatsapp.value || !email.value || !location.value) {
    errorMessage.value = "All fields must be filled!";
    return;
  }
  errorMessage.value = "";
  loading.value = true;

  const totalAmount = selectedServices.value.reduce(
    (sum, service) => sum + service.price,
    0
  );
  const orderId = `${name.value}-${Date.now()}`;

  await saveOrderToFirebase(
    orderId,
    email.value,
    name.value,
    whatsapp.value,
    selectedBackgrounds.value,
    pilFoto.value
  );
  closeModal();

  // proceedToMidtrans(
  //   totalAmount,
  //   orderId,
  //   name.value,
  //   whatsapp.value,
  //   email.value
  // );
}

// Handle Midtrans payment processing
// async function proceedToMidtrans(totalAmount, orderId, name, whatsapp, email) {
//   try {
//     const productDetails = selectedServices.value.map((service) => ({
//       id: service.name,
//       price: service.price,
//       quantity: 1,
//       name: service.name,
//     }));

//     const response = await fetch(
//       "https://midtrans-gateway.vercel.app/create-snap-token",
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           totalAmount,
//           orderId,
//           email,
//           name,
//           phone: whatsapp,
//           items: productDetails,
//         }),
//       }
//     );

//     const { token, error } = await response.json();

//     if (error) {
//       throw new Error(error);
//     }

//     if (window.snap) {
//       loading.value = false;
//       window.snap.pay(token, {
//         onSuccess: function (result) {
//           toast.add({
//             group: "tr",
//             severity: "success",
//             summary: "Payment Successful",
//             detail: "Your payment has been completed.",
//             life: 3000,
//           });
// saveOrderToFirebase(orderId, email, name, whatsapp);
// closeModal();
//         },
//         onPending: function (result) {
//           toast.add({
//             group: "tr",
//             severity: "info",
//             summary: "Payment Pending",
//             detail: "Your payment is being processed.",
//             life: 3000,
//           });
//           loading.value = false;
//         },
//         onError: function (result) {
//           toast.add({
//             group: "tr",
//             severity: "error",
//             summary: "Payment Failed",
//             detail: "There was an issue processing the payment.",
//             life: 3000,
//           });
//           loading.value = false;
//         },
//         onClose: function () {
//           loading.value = false;
//         },
//       });
//     } else {
//       throw new Error("Snap library not loaded");
//     }
//   } catch (error) {
//     console.error("Error during Midtrans payment:", error);
//     toast.add({
//       group: "tr",
//       severity: "error",
//       summary: "Payment Failed",
//       detail: error.message || "Error processing payment.",
//       life: 3000,
//     });
//     loading.value = false;
//   }
// }

// Save order data to Firebase
async function saveOrderToFirebase(
  orderId,
  email,
  name,
  whatsapp,
  selectedBackgrounds,
  pilFoto
) {
  const timestamp = new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
  });

  try {
    // Generate 5 random alphanumeric characters (uppercase + numbers)
    const randomCode = generateRandomCode();

    // Define orderData early in the function
    const orderData = {
      orderId: orderId,
      timestamp_waiting: timestamp,
      services: selectedServices.value,
      location: location.value,
      keterangan: keterangan.value, // Tambahkan ini
      name: name,
      whatsapp: whatsapp,
      email: email,
      status: "waiting", // Default status is active
      kode: randomCode, // Include the combined 'kode'
      cs: selectedCS.value.label,
      pilBg: selectedBackgrounds,
      pilFoto: pilFoto,
    };

    // Check if there are existing active orders with the same first 3 digits of 'kode'
    // const kodePrefix = locationKode.substring(0, 3); // Get the first 3 digits
    // const ordersRef = dbRef(db, `${lokasi}/orders`);

    // // Query the database for orders that match the prefix and have status "active"
    // const querySnapshot = await get(query(ordersRef, orderByChild("kode")));
    // let foundActiveOrder = false;

    // querySnapshot.forEach((doc) => {
    //   const order = doc.val();
    //   if (
    //     order.kode.substring(0, 3) === kodePrefix &&
    //     order.status === "active"
    //   ) {
    //     foundActiveOrder = true;
    //   }
    // });

    await set(dbRef(db, `${lokasi}/orders/${orderId}`), orderData);

    toast.add({
      group: "tr",
      severity: "success",
      summary: "Order Success",
      detail: "Your order has been successfully saved.",
      life: 3000,
    });

    // if (foundActiveOrder) {
    //   // Update status to 'pending' for orders that match
    //   await set(dbRef(db, `${lokasi}/orders/${orderId}`), {
    //     ...orderData,
    //     status: "active", // Change status to 'pending'
    //   });

    //   toast.add({
    //     group: "tr",
    //     severity: "success",
    //     summary: "Order Success",
    //     detail:
    //       "An active order with the same kode prefix was found. Status set to pending.",
    //   });
    // } else {
    //   // No active order found, proceed with saving the new order
    //   await set(dbRef(db, `${lokasi}/orders/${orderId}`), orderData);

    //   toast.add({
    //     group: "tr",
    //     severity: "success",
    //     summary: "Order Success",
    //     detail: "Your order has been successfully saved.",
    //   });
    // }

    // Send email with order details
    console.log("SelectedServices.value : ", selectedServices.value);
    await sendEmail(
      timestamp,
      orderId,
      randomCode,
      name,
      email,
      whatsapp,
      selectedServices.value
    );
  } catch (error) {
    console.error("Error saving order to Firebase:", error);
    toast.add({
      group: "tr",
      severity: "error",
      summary: "Error Saving Order",
      detail: "There was an issue saving your order.",
      life: 3000,
    });
  }
  loading.value = false;
}

// Function to generate 5 random alphanumeric characters
function generateRandomCode() {
  const timestamp = Date.now().toString(36); // Timestamp dalam basis 36
  const randomString = Math.random().toString(36).substring(2, 4).toUpperCase(); // String acak 2 karakter
  return (timestamp + randomString).slice(-4).toUpperCase();
}

// Fungsi untuk mengubah harga ke format ribuan (K)
const formattedPrice = (price) => {
  if (price >= 1000) {
    return (price / 1000).toFixed(0) + "K";
  }
  return price.toString();
};

function selectService(service) {
  const existingService = selectedServices.value.find(
    (s) => s.name === service.name
  );
  if (!existingService) {
    selectedServices.value.push({ ...service });
  }
}
</script>

<template>
  <div class="bg-white flex items-center justify-center lg:p-10 p-8">
    <!-- Sticky Menu Bar -->
    <div class="fixed top-0 z-10 w-full bg-white shadow-sm">
      <Menubar class="p-3 md:p-5">
        <template #start>
          <!-- SVG Logo -->
          <img src="/icon.png" alt="Logo" class="h-9 w-auto mr-1" />
          <h1 class="ml-2 text-lg font-semibold">Pemesanan Studio 8</h1>
        </template>
        <!-- Search Bar -->
        <template #end>
          <div class="flex items-center gap-2">
            <!-- Search Input -->
            <IconField class="">
              <InputIcon class="pi pi-search ml-1" />
              <InputText
                v-model="searchQuery"
                class="rounded-full p-2 px-8 lg:w-[25rem] w-[15rem]"
                placeholder="Cari layanan..."
              />
            </IconField>
          </div>
        </template>
        <!-- <template #end>
          <div class="flex items-center gap-2">
            <Button
              label="Masuk"
              class="bg-blue-500 text-white rounded-md px-4 py-2 shadow-lg flex items-center gap-2"
              @click="showCodeDialog = true"
            >
              <span>Masukkan Kode</span>
            </Button>
          </div>
        </template> -->
      </Menubar>
    </div>

    <section
      class="dark:bg-surface-900 lg:p-12 rounded-xl flex flex-col md:mt-4 mt-10"
    >
      <div class="grid gap-10 md:grid-cols-2">
        <!-- Loop through services and display them -->
        <div
          v-for="(service, index) in filteredServices"
          :key="index"
          class="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg flex flex-col lg:flex-row"
        >
          <!-- Card content (text and button) -->
          <div
            class="p-6 flex flex-col justify-between h-full flex-1 order-2 lg:order-1"
          >
            <div>
              <h2 class="text-2xl font-bold text-center">{{ service.name }}</h2>
              <h1 class="text-xl text-center mt-1">
                {{ service.desc }}
              </h1>
              <p class="price text-[3rem] font-black text-center mt-2">
                {{ formattedPrice(service.price) }}
              </p>
              <DataTable
                :value="service.services"
                tableStyle="min-width: 12.5rem"
              >
                <Column
                  field="name"
                  class="bg-gray-100 text-lg"
                  :style="{ textAlign: 'center' }"
                />
              </DataTable>
            </div>
            <Button
              label="Mulai"
              class="mt-4 w-full rounded-full"
              @click="openModal(service)"
            />
          </div>

          <!-- Card image -->
          <div class="flex items-center justify-center order-1 lg:order-2">
            <img
              :src="service.image"
              alt="Paket"
              class="lg:w-[30rem] h-[20rem] lg:h-[40rem] w-full object-cover rounded-tr-lg rounded-tl-lg lg:rounded-tl-none lg:rounded-br-lg object-top"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Modal untuk Input Data -->
    <Dialog
      v-model:visible="showModal"
      modal
      header="Masukkan Data Anda"
      class="w-[90%] lg:max-w-xl md:max-w-md"
    >
      <span class="text-surface-500 dark:text-surface-400 block mb-8">
        Lengkapi informasi berikut ini.
      </span>

      <!-- User Information Inputs -->
      <div class="flex items-center gap-4 mb-4">
        <label for="username" class="font-semibold w-24">Nama</label>
        <InputText
          id="username"
          v-model="name"
          class="w-full"
          autocomplete="off"
        />
      </div>
      <div class="flex items-center gap-4 mb-4">
        <label for="whatsapp" class="font-semibold w-24">WA</label>
        <InputText
          type="number"
          id="whatsapp"
          v-model="whatsapp"
          class="w-full"
          autocomplete="off"
        />
      </div>
      <div class="flex items-center gap-4 mb-4">
        <label for="email" class="font-semibold w-24">Email</label>
        <InputText
          type="email"
          id="email"
          v-model="email"
          class="w-full"
          autocomplete="on"
          :class="{ 'border-red-500': emailError }"
        />
        <div v-if="emailError" class="text-red-500 text-sm">
          Email tidak valid
        </div>
      </div>

      <!-- Location Select -->
      <div class="flex items-center gap-4 mb-4">
        <label for="cs" class="font-semibold w-24">CS</label>
        <Select
          id="cs"
          v-model="selectedCS"
          :options="csOptions"
          optionLabel="label"
          class="w-full mt-2"
          placeholder="Pilih Customer Service"
        />
      </div>

      <!-- Background Image Select -->
      <!-- <div
        class="flex items-center gap-4 mb-4"
        v-for="(n, index) in repeatCount"
        :key="n"
      >
        <label for="background" class="font-semibold w-24"
          >Pilih BG {{ index + 1 }}</label
        >
        <Select
          id="background"
          v-model="selectedBackgrounds[index]"
          filter
          :options="backgroundImages"
          optionLabel="label"
          class="w-full mt-2"
          :virtualScrollerOptions="{
            // lazy: true,
            onLazyLoad: onLazyLoad,
            itemSize: 50,
            showLoader: true,
            loading: loading,
            // delay: 250,
          }"
          placeholder="Pilih Gambar Background"
        >
          <template #value="slotProps">
            <div v-if="slotProps.value" class="flex items-center">
               <img
                :alt="slotProps.value.label"
                :src="slotProps.value.value"
                :class="`mr-2`"
                style="height: 32px"
              />
              <div>{{ slotProps.value.label }}</div>
            </div>
            <span v-else>
              {{ slotProps.placeholder }}
            </span>
          </template>
          <template #option="slotProps">
            <div class="flex items-center">
               <img
                :alt="slotProps.option.label"
                :src="slotProps.option.value"
                :class="`mr-2`"
                style="height: 80px"
              />
              <div>{{ slotProps.option.label }}</div>
            </div>
          </template>
        </Select>
      </div>
    -->

      <div
      class="flex items-center mb-4"
      v-for="(n, index) in repeatCount"
      :key="n"
    >
      <label class="font-semibold w-24">Pilih BG {{ index + 1 }}</label>
      <button @click="openDialog(index)" class="mr-3 px-4 py-2 bg-blue-500 text-white rounded">
        Pilih
      </button>
      <span v-if="selectedBackgrounds[index]">{{ selectedBackgrounds[index].label }}</span>
    </div>

    <Dialog v-model:visible="showDialog" header="Pilih Background" :modal="true" class="w-[90%]">
  <div class="flex h-[80vh]">
    <!-- Sidebar Filter (Tetap di tempat) -->
    <div class="w-1/5 p-4 border-r h-full sticky top-0">
      <h3 class="font-semibold mb-2">Filter Kategori</h3>
      <ul>
        <li 
          v-for="category in categories"
          :key="category"
          @click="selectedCategory = category"
          class="cursor-pointer py-1 px-2 rounded hover:bg-gray-200"
          :class="{'bg-gray-300': selectedCategory === category}"
        >
          {{ category }}
        </li>
      </ul>
    </div>

    <!-- Grid Gambar (Bisa Scroll) -->
    <div class="w-4/5 p-4 overflow-y-auto">
      <div class="grid grid-khusus grid-cols-5 gap-4 space-y-2">
        <div
          v-for="image in filteredImages"
          :key="image.value"
          @click="selectImage(image)"
          class="text-center break-inside-avoid relative cursor-pointer space-y-2 p-2 rounded hover:bg-gray-200"
        >
          <img :src="image.value" :alt="image.label" class="w-full h-auto" />
          <div>{{ image.label }}</div>
        </div>
      </div>
    </div>
  </div>
</Dialog>


      <!-- Additional Information -->
      <div class="flex items-center gap-4 mb-4">
        <label for="keterangan" class="font-semibold w-24">Request</label>
        <Textarea
          id="keterangan"
          v-model="keterangan"
          class="w-full"
          rows="3"
          placeholder="Berikan keterangan tambahan untuk fotografer... "
        />
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="text-red-500">{{ errorMessage }}</div>

      <!-- Buttons -->
      <div class="flex justify-end gap-2">
        <Button
          type="button"
          label="Batal"
          severity="secondary"
          @click="closeModal"
        />
        <Button
          type="button"
          label="Simpan"
          @click="saveData"
          :loading="loading"
        />
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
.border-red-500 {
  border-color: #f87171;
}

.grid-khusus {
  column-count: 4; /* Creates 4 columns */
  column-gap: 10px; /* Adjust gap between columns */
  display: block; /* Ensure block-level layout for images */
}
</style>
