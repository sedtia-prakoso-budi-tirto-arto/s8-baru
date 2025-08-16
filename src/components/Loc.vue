<template>
  <div>
    <Toast
      position="top-right"
      class="max-w-[80%] lg:max-w-2xl mx-auto"
      group="tr"
    />

    <div class="card">
      <!-- Toolbar with buttons -->
      <Toolbar class="mb-6">
        <template #start>
          <Button label="New" icon="pi pi-plus" class="mr-2" @click="openNew" />
          <Button
            label="Delete"
            icon="pi pi-trash"
            severity="danger"
            outlined
            @click="confirmDeleteSelected"
            :disabled="!selectedLocations || !selectedLocations.length"
          />
        </template>
      </Toolbar>

      <!-- DataTable -->
      <DataTable
        ref="dt"
        v-model:selection="selectedLocations"
        :value="locations"
        dataKey="id"
        :paginator="true"
        :rows="10"
        :filters="filters"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[5, 10, 25]"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} locations"
        class="pb-5"
      >
        <template #header>
          <div
            class="flex flex-wrap gap-2 items-center justify-between py-3 ml-3"
          >
            <h2 class="m-0 text-xl font-bold">Atur Lokasi</h2>
            <Button
              label="Baru"
              icon="pi pi-plus"
              class="mr-2"
              @click="openNew"
            />

            <!-- <IconField>
              <InputIcon>
                <i class="pi pi-search" />
              </InputIcon>
              <InputText
                v-model="filters['global'].value"
                placeholder="Search..."
              />
            </IconField> -->
          </div>
        </template>

        <Column style="width: 3rem"></Column>
        <Column
          field="name"
          header="Kode"
          sortable
          style="min-width: 6rem"
        ></Column>
        <Column
          field="address"
          header="Alamat"
          sortable
          style="min-width: 16rem"
        ></Column>
        <Column
          field="coordinate"
          header="Koordinat"
          sortable
          style="min-width: 16rem"
        ></Column>
        <Column :exportable="false" style="min-width: 8rem">
          <template #body="slotProps">
            <Button
              icon="pi pi-pencil"
              outlined
              rounded
              class="mr-2"
              @click="editLocation(slotProps.data)"
            />
            <Button
              icon="pi pi-trash"
              outlined
              rounded
              severity="danger"
              @click="confirmDeleteLocation(slotProps.data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Location Add/Edit Dialog -->
    <Dialog
      v-model:visible="locationDialog"
      header="Location Details"
      :modal="true"
      class="w-[80%] lg:w-[450px] md:w-[50vw]"
    >
      <div class="flex flex-col gap-6">
        <div>
          <label for="name" class="block font-bold mb-3">Kode</label>
          <InputText
            id="name"
            v-model.trim="tempLocation.name"
            required="true"
            autofocus
            fluid
          />
        </div>
        <div>
          <label for="address" class="block font-bold mb-3">Alamat</label>
          <InputText
            id="address"
            v-model.trim="tempLocation.address"
            required="true"
            fluid
          />
        </div>
        <div>
          <label for="coordinate" class="block font-bold mb-3">Koordinat</label>
          <InputText
            id="coordinate"
            v-model.trim="tempLocation.coordinate"
            required="true"
            fluid
          />
        </div>
      </div>

      <template #footer>
        <!-- <Button label="Cancel" icon="pi pi-times" text @click="hideDialog" /> -->
        <Button label="Save" icon="pi pi-check" @click="saveLocation" />
      </template>
    </Dialog>

    <!-- Delete Location Confirmation Dialog -->
    <Dialog
      v-model:visible="deleteLocationDialog"
      header="Confirm"
      :modal="true"
      class="w-[80%] lg:w-[450px] md:w-[50vw]"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle !text-3xl" />
        <span
          >Are you sure you want to delete <b>{{ locationToDelete?.name }}</b
          >?</span
        >
      </div>
      <template #footer>
        <Button
          label="No"
          icon="pi pi-times"
          text
          @click="deleteLocationDialog = false"
        />
        <Button label="Yes" icon="pi pi-check" @click="deleteLocation" />
      </template>
    </Dialog>

    <!-- Delete Selected Locations Confirmation Dialog -->
    <Dialog
      v-model:visible="deleteSelectedLocationsDialog"
      header="Confirm"
      :modal="true"
      class="w-[80%] lg:w-[450px] md:w-[50vw]"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle !text-3xl" />
        <span>Are you sure you want to delete the selected locations?</span>
      </div>
      <template #footer>
        <Button
          label="No"
          icon="pi pi-times"
          text
          @click="deleteSelectedLocationsDialog = false"
        />
        <Button
          label="Yes"
          icon="pi pi-check"
          text
          @click="deleteSelectedLocations"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import { db } from "../firebase";
import {
  ref as dbRef,
  push,
  set,
  update,
  get,
  remove,
} from "firebase/database";

const toast = useToast();
const locations = ref([]);
const selectedLocations = ref([]);
const locationDialog = ref(false);
const deleteLocationDialog = ref(false);
const deleteSelectedLocationsDialog = ref(false);
const tempLocation = ref({ name: "", address: "", coordinate: "" });
const locationToDelete = ref(null);
const filters = ref({ global: { value: null, matchMode: "CONTAINS" } });
const submitted = ref(false);

// Fetch locations from Firebase
onMounted(() => {
  get(dbRef(db, "locations")).then((snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      locations.value = Object.keys(data).map((id) => ({ id, ...data[id] }));
    } else {
      locations.value = [];
    }
  });
});

// Open dialog for adding new location
const openNew = () => {
  tempLocation.value = { name: "", address: "", coordinate: "" };
  locationDialog.value = true;
};

// Open dialog for editing location
const editLocation = (location) => {
  tempLocation.value = { ...location };
  locationDialog.value = true;
};

// Save location (Add or Edit)
const saveLocation = () => {
  submitted.value = true;
  if (
    tempLocation.value.name &&
    tempLocation.value.address &&
    tempLocation.value.coordinate
  ) {
    if (!tempLocation.value.id) {
      // Add a new location
      const newLocationRef = push(dbRef(db, "locations"));
      set(newLocationRef, {
        name: tempLocation.value.name,
        address: tempLocation.value.address,
        coordinate: tempLocation.value.coordinate,
      }).then(() => {
        // Add to local locations list
        locations.value.push({
          id: newLocationRef.key,
          ...tempLocation.value,
        });
        toast.add({
          severity: "success",
          summary: "Location Saved",
          detail: "The new location has been saved.",
          life: 3000,
        });
        locationDialog.value = false;
      });
    } else {
      // Update existing location
      const locationRef = dbRef(db, `locations/${tempLocation.value.id}`);
      update(locationRef, {
        name: tempLocation.value.name,
        address: tempLocation.value.address,
        coordinate: tempLocation.value.coordinate,
      })
        .then(() => {
          // Update the local list
          const index = locations.value.findIndex(
            (loc) => loc.id === tempLocation.value.id
          );
          if (index !== -1) {
            locations.value[index] = { ...tempLocation.value };
          }
          toast.add({
            severity: "success",
            summary: "Location Updated",
            detail: "The location details have been updated.",
            life: 3000,
            group: "tr",
          });
          locationDialog.value = false;
        })
        .catch((error) => {
          toast.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to update the location.",
            life: 3000,
            group: "tr",
          });
        });
    }
  } else {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Semua field harus diisi.",
      life: 3000,
      group: "tr",
    });
  }
};

// Show confirmation dialog for deleting a location
const confirmDeleteLocation = (location) => {
  locationToDelete.value = location;
  deleteLocationDialog.value = true;
};

// Delete selected location
const deleteLocation = () => {
  remove(dbRef(db, `locations/${locationToDelete.value.id}`)).then(() => {
    locations.value = locations.value.filter(
      (loc) => loc.id !== locationToDelete.value.id
    );
    deleteLocationDialog.value = false;
    toast.add({
      severity: "success",
      summary: "Deleted",
      detail: "Location deleted successfully.",
      life: 3000,
      group: "tr",
    });
  });
};

// Confirm deletion of selected locations
const confirmDeleteSelected = () => {
  deleteSelectedLocationsDialog.value = true;
};

// Delete selected locations
const deleteSelectedLocations = () => {
  const selectedIds = selectedLocations.value.map((loc) => loc.id);
  selectedIds.forEach((id) => {
    remove(dbRef(db, `locations/${id}`));
  });
  locations.value = locations.value.filter(
    (loc) => !selectedIds.includes(loc.id)
  );
  deleteSelectedLocationsDialog.value = false;
  selectedLocations.value = [];
  toast.add({
    severity: "success",
    summary: "Deleted",
    detail: "Selected locations deleted.",
    life: 3000,
    group: "tr",
  });
};
</script>
