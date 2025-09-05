<template>
  <div class="card px-6 py-2">
    <!-- DataTable with filters and pagination -->
    <DataTable
      resizableColumns
      columnResizeMode="fit"
      showGridlines
      scrollable
      scrollHeight="100%"
      v-model:filters="filters"
      :value="sortedOrders"
      paginator
      :rows="10"
      dataKey="orderId"
      filterDisplay="row"
      :loading="loading"
      :globalFilterFields="[
        'name',
        'status',
        'timestamp_waiting',
        'timestamp_photo',
        'timestamp_orderEdit',
        'timestamp_editting',
        'timestamp_done',
        'paket',
        'email',
        'whatsapp',
        'orderId',
        'fg',
        'keterangan',
        'kode',
        'editor',
        'cs',
        'timestampDeadline',
      ]"
    >
      <!-- Header for Search Input -->
      <template #header>
        <div class="flex justify-end">
          <Button icon="pi pi-refresh" @click="reloadPage()" class="mr-2" />
          <Button
            label=""
            icon="pi pi-key"
            @click="showKeyDialog = true"
            class="mr-2"
          />
          <Button
            label="Tugas Editor"
            icon="pi pi-eye"
            @click="showDataDialog = true"
            class="mr-2"
          />
          <Button
            type="button"
            label="Notif"
            icon="pi pi-inbox"
            :badge="
              notifications.length > 0 ? String(notifications.length) : ''
            "
            class="mr-2"
            @click="showNotificationsModal = true"
          />
          <IconField>
            <InputIcon>
              <i class="pi pi-search" style="margin-top: -0.25rem" />
            </InputIcon>
            <InputText
              v-model="filters['global'].value"
              placeholder="Masukkan kata kunci"
            />
          </IconField>
        </div>
      </template>

      <!-- Empty Data and Loading Messages -->
      <template #empty>No orders found.</template>
      <template #loading>Loading orders data. Please wait...</template>

      <!-- Columns for DataTable -->
      <!-- <Column
        field="name"
        header="Nama Kustomer"
        :sortable="true"
        style="min-width: 12rem"
      >
        <template #body="{ data }">
          {{ data.name }}
        </template>
        
      </Column> -->

      <Column
        field="orderId"
        header="Folder"
        frozen
        :sortable="true"
        style="min-width: 16rem"
      >
        <template #body="{ data }">
          <button
            @click="openFolder(data.orderId)"
            class="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition"
          >
            <i class="pi pi-folder-open"></i>
            {{ data.orderId }}
          </button>
        </template>

        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            @input="filterCallback()"
            placeholder="Cari berdasarkan nama"
            class="p-inputtext p-component w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
          />
        </template>
      </Column>

      <Column
        field="timestamp_photo"
        header="Tgl Foto"
        :sortable="true"
        style="min-width: 12rem"
      >
        <template #body="{ data }">
          {{ data.timestamp_photo }}
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            @input="filterCallback()"
            placeholder="Cari"
            class="p-inputtext p-component w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
          />
        </template>
      </Column>

      <Column
        field="whatsapp"
        header="Whatsapp"
        :sortable="true"
        style="min-width: 10rem"
      >
        <template #body="{ data }">
          <a
            v-if="data.whatsapp"
            :href="'https://wa.me/' + data.whatsapp"
            target="_blank"
            class="text-blue-500 hover:text-blue-700"
          >
            {{ data.whatsapp }}
          </a>
          <span v-else>N/A</span>
        </template>
      </Column>

      <Column
        field="paket"
        header="Paket"
        :sortable="true"
        style="min-width: 12rem"
      >
        <template #body="{ data }">
          {{ data.paket }}
        </template>
      </Column>

      <Column field="keterangan" header="Keterangan" style="min-width: 12rem">
        <template #body="{ data }">
          {{ data.keterangan }}
        </template>
      </Column>

      <Column
        field="status"
        header="Status"
        :showFilterMenu="false"
        style="min-width: 8rem"
      >
        <template #body="{ data }">
          <Tag :value="data.status" :severity="getTagSeverity(data.status)" />
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <Select
            v-model="filterModel.value"
            @change="filterCallback()"
            :options="statuses"
            placeholder="Pilih status"
            style="min-width: 8rem"
            :showClear="true"
          >
            <template #option="slotProps">
              <Tag
                :value="slotProps.option"
                :severity="getTagSeverity(slotProps.option)"
              />
            </template>
          </Select>
        </template>
      </Column>

      <Column field="totalFoto" header="Foto" style="min-width: 4rem">
        <template #body="{ data }">
          {{ data.imageCount }}
        </template>
      </Column>

      <Column field="pilBG" header="PilFoto" style="min-width: 5rem">
        <template #body="{ data }">
          <li
            v-for="(item, index) in data.pilBg"
            :key="index"
            class="flex items-center mt-1"
          >
            <Image
              :alt="item.label"
              :src="item.value"
              :class="`mr-2 w-16`"
              preview
            />
          </li>
        </template>
      </Column>

      <Column field="pilFoto" header="PilFoto" style="min-width: 5rem">
        <template #body="{ data }">
          <div style="display: flex; align-items: center">
            <div v-if="data.adding" class="p-2">
              <!-- Input fields -->
              <div class="flex flex-wrap gap-2">
                <!-- Input to add number for pilFoto -->
                <div class="flex flex-col flex-1">
                  <InputText
                    id="pilFoto"
                    type="number"
                    v-model="data.tambahPilih"
                    placeholder="Add PilFoto"
                    class="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <!-- Input to add value for Print -->
                <div class="flex flex-col flex-1">
                  <InputText
                    id="printValue"
                    type="number"
                    v-model="data.printValue"
                    placeholder="Add Cetak"
                    class="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <!-- Background selection -->
              <div class="mt-4">
                <Select
                  id="background"
                  placeholder="Pilih Gambar Background"
                  v-model="selectedBackgrounds"
                  filter
                  :options="backgroundImages"
                  optionLabel="label"
                  class="w-full border border-gray-300 rounded-md focus:ring focus:ring-blue-300"
                  :virtualScrollerOptions="{
                    onLazyLoad: onLazyLoad,
                    itemSize: 50,
                    showLoader: true,
                    loading: loading,
                  }"
                >
                  <!-- Selected value template -->
                  <template #value="slotProps">
                    <div v-if="slotProps.value" class="flex items-center">
                      <div>{{ slotProps.value.label }}</div>
                    </div>
                    <span v-else class="text-gray-500">
                      {{ slotProps.placeholder }}
                    </span>
                  </template>

                  <!-- Option template -->
                  <template #option="slotProps">
                    <div class="flex items-center">
                      <div>{{ slotProps.option.label }}</div>
                    </div>
                  </template>
                </Select>
              </div>

              <div class="mt-4">
                <p class="mb-2">Yang sudah dipilih :</p>
                <div v-if="data.pilBg && data.pilBg.length">
                  <ul>
                    <li
                      v-for="(item, index) in data.pilBg"
                      :key="index"
                      class="flex items-center mt-1"
                    >
                      <Image
                        :alt="item.label"
                        :src="item.value"
                        :class="`mr-2`"
                        preview
                      />
                      <span>{{ item.label }}</span>
                      <button
                        @click="removeBackground(item, index, data)"
                        style="margin-left: 0.5rem"
                      >
                        <i class="pi pi-trash" style="color: #ef4444"></i>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Save button -->
              <div class="mt-4 flex gap-3">
                <Button
                  label="Simpan"
                  icon="pi pi-check-circle"
                  class="w-full bg-blue-500 text-white hover:bg-blue-600 focus:ring focus:ring-blue-300 rounded-md"
                  @click="savePilFoto(data)"
                />
                <Button
                  severity="danger"
                  label="Batal"
                  icon="pi pi-times-circle"
                  class="w-full"
                  @click="cancelAdd(data)"
                />
              </div>
            </div>

            <div v-else>
              <!-- Displaying the pilFoto and print status -->
              <span>{{ data.pilFoto }} </span>
              <span v-if="data.tambahCetak">
                - AddCetak: {{ data.tambahCetak }}</span
              >
              <button
                v-if="isCS === true"
                @click="enableAdd(data)"
                style="margin-left: 0.5rem"
              >
                <i class="pi pi-pen-to-square text-primary"></i>
              </button>
            </div>
          </div>
        </template>
      </Column>

      <!-- Actions Column -->
      <Column header="Actions" style="min-width: 14rem">
        <template #body="{ data }">
          <div class="flex gap-2">
            <!-- <Button
              v-if="data.status === 'photo' && isPaused === false"
              label="Pause"
              severity="secondary"
              outlined
              class="w-full"
              @click="toggleMusic"
            />
            <Button
              v-if="data.status === 'photo' && isPaused === true"
              label="Lanjut"
              severity="secondary"
              outlined
              class="w-full"
              @click="toggleMusic"
            /> -->

            <Button
              v-if="
                ['order edit', 'editting', 'done', 'selesai edit'].includes(
                  data.status
                )
              "
              severity="info"
              label="Pilihan"
              class="w-full"
              @click="
                showCommentsModal(
                  data.pil?.length ? data.pil : data.comments,
                  data.orderId
                )
              "
            />
            <Button
              v-if="
                (data.status === 'order edit' ||
                  data.status === 'editting' ||
                  (data.paket &&
                    data.paket.split(' ')[0] === 'PASFOTO' &&
                    data.status !== 'waiting')) &&
                data.hasilEdit.length < 1
              "
              label="Pilih Editor"
              severity="primary"
              class="w-full"
              @click="showEditorModal(data.orderId)"
            />
            <p
              v-if="
                data.status === 'photo' &&
                data.paket.split(' ')[0] !== 'PASFOTO'
              "
              class="text-gray-500"
            >
              Belum pilih foto
            </p>
            <Button
              v-if="data.hasilEdit.length > 0"
              label="Hasil"
              severity="primary"
              class="w-full"
              @click="showHasilModal(data.hasilEdit)"
            />
            <!-- <Button
              v-if="data.status === 'photo'"
              label="Selesai Foto"
              class="w-full"
              @click="selesaiPhoto(data.orderId)"
            />
            <Button
              severity="danger"
              v-if="
                data.status !== 'waiting' &&
                data.status !== 'photo' &&
                data.status !== 'printing' &&
                data.status !== 'done'
              "
              label="Kembali Foto"
              class="w-full"
              @click="returnToPhoto(data.orderId)"
            />
            <Button
              severity="success"
              v-if="data.status === 'printing'"
              label="Tuntas"
              class="w-full"
              @click="doneOrder(data.orderId)"
            /> -->
            <Button
              v-if="data.status == 'waiting'"
              label="Mulai Foto"
              class="w-full"
              @click="showPhotographerModal(data.orderId)"
            />
            <Button
              v-if="data.status == 'photo'"
              label="Selesai Foto"
              class="w-full"
              @click="selesaiPhoto(data.orderId)"
            />
          </div>
        </template>
      </Column>

      <Column
        field="timestampDeadline"
        header="Deadline"
        :sortable="true"
        style="min-width: 10rem"
      >
        <template #body="{ data }">
          <Tag
            :value="data.deadline"
            :severity="getTagSeverity(data.deadline)"
          />
        </template>
      </Column>

      <!-- <Column field="kode" header="Kode Akses" style="min-width: 8rem">
        <template #body="{ data }">
          {{ data.kode }}
        </template>
      </Column> -->

      <!-- CS Column -->
      <Column field="cs" header="CS" :sortable="true" style="min-width: 8rem">
        <template #body="{ data }">
          {{ data.cs }}
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            @input="filterCallback()"
            placeholder="Cari"
          />
        </template>
      </Column>

      <Column
        field="fg"
        header="Fotografer"
        :sortable="true"
        style="min-width: 8rem"
      >
        <template #body="{ data }">
          {{ data.fg }}
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            @input="filterCallback()"
            placeholder="Cari"
          />
        </template>
      </Column>

      <!-- CS Column -->
      <Column
        field="editor"
        header="Editor"
        :sortable="true"
        style="min-width: 8rem"
      >
        <template #body="{ data }">
          {{ data.editor }}
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            @input="filterCallback()"
            placeholder="Cari"
          />
        </template>
      </Column>

      <Column
        field="price"
        header="Harga"
        :sortable="true"
        style="min-width: 12rem"
      >
        <template #body="{ data }">
          {{ data.price }}
        </template>
      </Column>

      <Column
        field="email"
        header="Email"
        :sortable="true"
        style="min-width: 14rem"
      >
        <template #body="{ data }">
          {{ data.email }}
        </template>
      </Column>

      <Column
        field="timestamp"
        header="Order"
        :sortable="true"
        style="min-width: 14rem"
      >
        <template #body="{ data }">
          {{ data.timestamp_waiting }}
        </template>
      </Column>

      <Column
        field="timestampOrderEdit"
        header="Pilih Foto"
        :sortable="true"
        style="min-width: 14rem"
      >
        <template #body="{ data }">
          {{ data.timestamp_orderEdit }}
        </template>
      </Column>

      <Column
        field="timestampEdit"
        header="Editting"
        :sortable="true"
        style="min-width: 14rem"
      >
        <template #body="{ data }">
          {{ data.timestamp_editting }}
        </template>
      </Column>

      <Column
        field="timestamp_done"
        header="Done"
        :sortable="true"
        style="min-width: 14rem"
      >
        <template #body="{ data }">
          {{ data.timestamp_done }}
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            @input="filterCallback()"
            placeholder="Cari"
          />
        </template>
      </Column>

      <!-- Rating FG Column -->
      <Column
        header="Rating FG"
        field="ratingFG"
        style="min-width: 12rem"
        :sortable="true"
      >
        <template #body="{ data }">
          <div>
            <span v-html="renderStars(data.ratingFG)" class="ml-1"></span>
            <p
              v-if="data.feedbackFG"
              class="text-sm text-gray-500 mt-1 whitespace-pre-line break-words max-w-[200px]"
            >
              {{ data.feedbackFG }}
            </p>
          </div>
        </template>
      </Column>

      <!-- Rating CS Column -->
      <Column
        header="Rating CS"
        field="ratingCS"
        style="min-width: 12rem"
        :sortable="true"
      >
        <template #body="{ data }">
          <div>
            <span v-html="renderStars(data.ratingCS)" class="ml-1"></span>
            <p
              v-if="data.feedbackCS"
              class="text-sm text-gray-500 mt-1 whitespace-pre-line break-words max-w-[200px]"
            >
              {{ data.feedbackCS }}
            </p>
          </div>
        </template>
      </Column>

      <!-- Rating Editor Column -->
      <Column
        header="Rating Editor"
        field="ratingEditor"
        style="min-width: 12rem"
        :sortable="true"
      >
        <template #body="{ data }">
          <div>
            <span v-html="renderStars(data.ratingEditor)" class="ml-1"></span>
            <p
              v-if="data.feedbackEditor"
              class="text-sm text-gray-500 mt-1 whitespace-pre-line break-words max-w-[200px]"
            >
              {{ data.feedbackEditor }}
            </p>
          </div>
        </template>
      </Column>
    </DataTable>
  </div>

  <!-- Photographer Selection Modal -->
  <Dialog
    v-model:visible="showModalFg"
    modal
    header="Fotografer"
    showHeader
    class="w-[30%]"
  >
    <Select
      v-model="selectedPhotographer"
      :options="photographers"
      optionLabel="name"
      placeholder="Pilih Fotografer"
      class="w-full"
    />
    <div v-if="photographerError" class="text-red-500 mt-2 text-sm">
      Pilih fotografer terlebih dahulu.
    </div>
    <template #footer>
      <Button label="Batal" class="p-button-secondary" @click="cancelModal" />
      <Button label="OK" @click="confirmPhotographer" />
    </template>
  </Dialog>

  <Dialog
    v-model:visible="showModalEditor"
    modal
    header="Editor"
    showHeader
    class="w-[30%]"
  >
    <Select
      v-model="selectedEditor"
      :options="editors"
      optionLabel="nama"
      placeholder="Pilih Editor"
      class="w-full"
    />
    <div v-if="editorError" class="text-red-500 mt-2 text-sm">
      Pilih editor terlebih dahulu.
    </div>
    <template #footer>
      <!-- <Button label="Batal" class="p-button-secondary" @click="cancelModal" /> -->
      <Button label="OK" @click="confirmEditor" />
    </template>
  </Dialog>

  <!-- Comments Modal -->
  <Dialog
    v-model:visible="showModalComments"
    modal
    header="Requests"
    showHeader
    class="w-full sm:w-[80%] lg:w-[45%]"
  >
    <!-- Header Row for "Pil Foto", "Detail", "Bg", and "Editor" -->
    <div
      class="grid grid-cols-4 gap-6 text-sm text-gray-600 font-semibold px-6 py-4 border-b border-gray-200"
    >
      <div class="flex justify-start">Pil Foto</div>
      <div class="flex justify-center">Detail</div>
      <div class="flex justify-end">Bg</div>
      <div class="flex justify-end">Editor</div>
    </div>

    <div v-if="comments.length === 0" class="text-center text-gray-500 p-6">
      Tidak ada komentar.
    </div>

    <div v-else class="grid gap-6 p-6">
      <div
        v-for="(comment, index) in comments"
        :key="index"
        class="flex flex-col sm:flex-row gap-6 items-start sm:items-center"
      >
        <!-- Comment Image and Details -->
        <div
          class="flex gap-6 items-start sm:items-center w-full cursor-pointer"
          @click="previewImage(comment.url, comment.filename)"
        >
          <a v-if="comment.preview" :href="comment.preview" target="_blank">
            <img
              :src="comment.url"
              alt="Comment Image"
              class="w-32 h-32 object-cover rounded-md cursor-pointer transition-transform transform hover:scale-105"
            />
          </a>
          <img
            v-else
            :src="comment.url"
            alt="Comment Image"
            class="w-32 h-32 object-cover rounded-md cursor-pointer transition-transform transform hover:scale-105"
          />

          <div class="flex flex-col">
            <p class="text-base font-semibold text-gray-800">
              {{ comment.comment }}
            </p>
            <p class="text-sm text-gray-500 mt-1">{{ comment.filename }}</p>
            <p class="text-sm text-gray-500 mt-3">{{ comment.timestamp }}</p>
          </div>
        </div>

        <!-- Background Image -->
        <div class="w-32 h-32 flex items-center justify-center overflow-hidden">
          <Image
            :src="comment.bg"
            alt="Background Image"
            class="w-full h-full object-cover rounded-md cursor-pointer transition-opacity hover:opacity-80"
            preview
          />
        </div>

        <!-- Select Editor Button -->
        <div class="flex justify-center w-full sm:w-auto mt-4 sm:mt-0">
          <Button
            v-if="!comment.editor"
            label="Pilih Editor"
            class="p-button-primary w-full sm:w-auto"
            @click="selectEditor(selectedOrderId, index)"
          />
          <Button
            v-else
            :label="`${comment.editor}`"
            class="p-button-primary w-full sm:w-auto"
            @click="selectEditor(selectedOrderId, index)"
          />
          <Button
            icon="pi pi-times"
            class="p-button-danger ml-2"
            @click="removeEditor(index)"
          />
        </div>
      </div>
    </div>

    <!-- Footer Section -->
    <template #footer>
      <div class="flex justify-end gap-4 mt-4">
        <Button label="Tutup" class="p-button-secondary" @click="cancelModal" />
        <Button
          label="Download Semua"
          class="p-button-primary"
          @click="downloadAllImages"
          :loading="downloadingImages"
        />
      </div>
    </template>
  </Dialog>

  <!-- Image Preview Dialog -->
  <Dialog
    v-model:visible="showImagePreview"
    modal
    header="Preview"
    showHeader
    class="w-[80%] lg:w-[40%] h-screen p-0"
  >
    <div class="relative flex flex-col items-center p-4 space-y-4">
      <!-- Comment displayed above the image -->
      <div class="text-center text-gray-800 font-semibold text-lg">
        {{ selectedComment }}
      </div>

      <!-- File name displayed below the comment -->
      <div class="text-center text-sm text-gray-500">
        {{ selectedFileName }}
      </div>

      <!-- Background Image Filename -->
      <div class="text-center text-sm text-gray-500">
        {{ selectedBg }}
      </div>

      <!-- Image Preview -->
      <div class="flex justify-center w-full h-[50vh] overflow-auto">
        <img
          :src="selectedImageUrl"
          alt="Preview Image"
          class="max-w-full max-h-full object-contain rounded-md shadow-md"
        />
      </div>
    </div>
  </Dialog>

  <!-- Notifications Modal -->
  <Dialog
    v-model:visible="showNotificationsModal"
    modal
    header="Notifikasi"
    showHeader
    class="w-[40%]"
  >
    <div
      v-if="notifications.length === 0"
      class="py-5 text-center text-gray-500"
    >
      Tidak ada notifikasi baru.
    </div>
    <div v-else>
      <ul>
        <li
          v-for="(notification, index) in notifications"
          :key="index"
          class="p-2 border-b"
        >
          {{ notification.message }}
          <div class="text-sm text-gray-500 mt-2">
            {{ notification.timestamp }}
          </div>
        </li>
      </ul>
    </div>
    <template #footer>
      <div class="py-3 space-x-2">
        <Button
          label="Tutup"
          class="p-button-secondary"
          @click="showNotificationsModal = false"
        />
        <Button
          label="Hapus Semua"
          class="p-button-danger"
          @click="clearNotifications"
        />
      </div>
    </template>
  </Dialog>

  <Dialog
    v-model:visible="isHasilModalVisible"
    header="Hasil Edit"
    class="w-[40%]"
    showHeader
    modal
  >
    <div v-if="selectedHasilEdit.length > 0">
      <div v-for="(item, index) in selectedHasilEdit" :key="index" class="mb-3">
        <a
          v-if="item.link"
          :href="item.link"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            :src="item.url || item.thumbnail"
            :alt="'Hasil Edit ' + (index + 1)"
            class="w-full h-auto rounded shadow cursor-pointer"
          />
        </a>
        <img
          v-else
          :src="item.url || item.thumbnail"
          :alt="'Hasil Edit ' + (index + 1)"
          class="w-full h-auto rounded shadow"
        />
        <p class="text-sm mt-2">Hasil Edit {{ index + 1 }}</p>
      </div>
    </div>
    <div v-else>
      <p class="text-center text-gray-500">
        Tidak ada hasil edit yang tersedia.
      </p>
    </div>
  </Dialog>

  <Dialog
    v-model:visible="showDataDialog"
    header="Editor Data"
    modal
    :style="{ width: '90vw' }"
    class="p-4"
  >
    <DataTable :value="editorTasks" class="p-datatable-sm shadow-md rounded-lg">
      <!-- Kolom Utama -->
      <Column
        field="editor"
        header="Editor"
        class="text-gray-900 font-semibold"
      />
      <Column field="pendingTasks" header="Total" class="text-gray-600" />

      <!-- Tabel Detail -->
      <Column header="Daftar Tugas">
        <template #body="slotProps">
          <div class="divide-y divide-gray-200">
            <div
              v-for="(task, index) in slotProps.data.details"
              :key="index"
              class="grid grid-cols-5 items-center gap-4 py-3 px-2 hover:bg-gray-50 rounded-md transition"
              :class="{ 'bg-yellow-50': task.onProgress }"
            >
              <!-- On Progress -->
              <div class="flex items-center space-x-2">
                <Checkbox
                  v-model="task.onProgress"
                  :binary="true"
                  @change="toggleOnProgress(task)"
                />
                <span class="text-sm text-gray-700">Progress</span>
              </div>

              <!-- Customer -->
              <div class="text-sm font-medium text-gray-800">
                {{ task.orderId }}
              </div>

              <!-- Paket -->
              <div class="text-sm text-gray-600">
                {{ task.paket }}
              </div>

              <!-- Nama File -->
              <div class="text-sm truncate max-w-xs text-gray-700">
                {{
                  Array.isArray(task.filename)
                    ? task.filename.join(", ").replace(/[\[\]"]+/g, "")
                    : task.filename
                }}
              </div>

              <!-- Deadline -->
              <div class="flex items-center">
                <Tag
                  v-if="!isCS"
                  :value="task.deadline"
                  :severity="getTagSeverity(task.deadline)"
                  class="text-xs px-2 py-1"
                />
                <DatePicker
                  v-else
                  showIcon
                  fluid
                  dateFormat="dd/mm/yy"
                  v-model="task.deadline"
                  @blur="updateDeadline(task.orderId, task.deadline)"
                />
              </div>
            </div>
          </div>
        </template>
      </Column>
    </DataTable>
  </Dialog>

  <Dialog
    v-model:visible="showKeyDialog"
    modal
    header="Masuk Sebagai CS"
    :style="{ width: '25rem' }"
  >
    <form @submit.prevent="checkPassword">
      <div class="flex justify-center items-center mb-8">
        <Password
          id="password"
          v-model="password"
          :feedback="false"
          toggleMask
        ></Password>
      </div>

      <div class="flex justify-end gap-2">
        <Button
          type="button"
          label="Batal"
          severity="secondary"
          @click="showKeyDialog = false"
        ></Button>
        <Button type="submit" label="Masuk"></Button>
      </div>
    </form>
  </Dialog>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { db, storage } from "../firebase"; // Firebase setup
import { ref as dbRef, onValue, update, get } from "firebase/database"; // Firebase methods
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from "firebase/storage";
import { FilterMatchMode } from "@primevue/core/api";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import Cookies from "js-cookie";
import _, { filter } from "lodash";
import moment from "moment-timezone";
import axios from "axios";
import { useRoute } from "vue-router";
import DatePicker from "primevue/datepicker";

const route = useRoute();
const confirm = useConfirm();
const toast = useToast();
const showRatingDialog = ref(false); // Rating dialog visibility state
const ratingValue = ref(0); // Rating value
const feedback = ref("");
const orders = ref([]);
const photographers = ref([]);
const editors = ref([]);
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  orderId: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  status: { value: null, matchMode: FilterMatchMode.EQUALS },
  timestamp_waiting: { value: null, matchMode: FilterMatchMode.CONTAINS },
  timestamp_photo: { value: null, matchMode: FilterMatchMode.CONTAINS },
  timestamp_editting: { value: null, matchMode: FilterMatchMode.CONTAINS },
  timestamp_done: { value: null, matchMode: FilterMatchMode.CONTAINS },
  fg: { value: null, matchMode: FilterMatchMode.CONTAINS },
  keterangan: { value: null, matchMode: FilterMatchMode.CONTAINS },
  kode: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  editor: { value: null, matchMode: FilterMatchMode.CONTAINS },
  cs: { value: null, matchMode: FilterMatchMode.CONTAINS },
});
const showModalFg = ref(false);
const showModalEditor = ref(false);
const selectedPhotographer = ref(null);
const selectedEditor = ref(null);
const photographerError = ref(false);
const editorError = ref(false);
const loading = ref(true);
const statuses = ref([
  "waiting",
  "photo",
  "order edit",
  "editting",
  "selesai edit",
  "done",
]);
let selectedOrderId = null;
let cs = null;
const lokasi = import.meta.env.VITE_LOCATION;
const recipient = import.meta.env.VITE_GRUP_EDITOR;
const pw = import.meta.env.VITE_PASSWORD;
let currentMusic = null; // Variable to store the current playing music
const isPaused = ref(false); // Track if the music is paused
const showModalComments = ref(false);
const comments = ref([]);
const selectedImageUrl = ref("");
const showImagePreview = ref(false);
const selectedComment = ref("");
const selectedFileName = ref("");
const showNotificationsModal = ref(false);
const notifications = ref([]);
const newOrders = ref([]);
const oldOrders = ref([]);
const downloadingImages = ref(false);
const selectedBg = ref("");
let lastKey = null; // Menyimpan kunci terakhir untuk pagination
const itemsPerPage = 15; // Jumlah data yang diambil per halaman
const isHasilModalVisible = ref(false); // Untuk mengontrol visibilitas modal
const selectedHasilEdit = ref([]); // Menyimpan array hasilEdit yang dipilih
const tambahPilih = ref(0); // Menyimpan array tambahPilih yang dipilih
const backgroundImages = ref(Array.from({ length: 100000 }));
const loadLazyTimeout = ref();
const selectedBackgrounds = ref();
const editorTasks = ref([]);
const showDataDialog = ref(false);
const showKeyDialog = ref(false);
const password = ref("");
const isCS = ref(false);
let index = null;

console.log("lokasi", lokasi);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const props = defineProps(["data"]);

const rowClassEditorTasks = (data) => {
  // Cek apakah ada comments/pil dengan onProgress = true
  const hasOnProgress =
    (Array.isArray(data.comments) && data.comments.some((c) => c.onProgress)) ||
    (Array.isArray(data.pil) && data.pil.some((p) => p.onProgress));

  return hasOnProgress ? "highlight-row" : "";
};

const getFileNameFromUrl = (url) => {
  try {
    return decodeURIComponent(url)
      .split("/")
      .pop() // ambil DSC00842.JPG_thumb.jpg?alt=...
      .split("?")[0] // buang query ?alt=...
      .replace("_thumb.jpg", ""); // opsional: kalau kamu simpan nama asli tanpa "_thumb"
  } catch (e) {
    return url;
  }
};

const toggleOnProgress = async (task) => {
  console.log(task);
  try {
    const taskRef = dbRef(db, `${lokasi}/orders/${task.orderId}/comments`);
    const snapshot = await get(taskRef);

    if (snapshot.exists()) {
      const pilData = snapshot.val();
      const pilKey = Object.keys(pilData).find((key) => {
        const fileName = getFileNameFromUrl(pilData[key].url);
        return fileName === task.filename;
      });

      if (pilKey) {
        await update(
          dbRef(db, `${lokasi}/orders/${task.orderId}/comments/${pilKey}`),
          {
            onProgress: task.onProgress,
          }
        );
        console.log(`✅ Task ${task.filename} updated:`, task.onProgress);
      }
    }
  } catch (error) {
    console.error("❌ Error updating onProgress:", error);
  }
};

const checkPassword = () => {
  if (password.value === pw) {
    isCS.value = true;
    password.value = "";
    showKeyDialog.value = false;
  } else {
    toast.add({
      severity: "error",
      summary: "Password salah",
      group: "tr",
    });
  }
};

const selectEditor = (orderId, id) => {
  index = id;
  console.log(`orderId : ${orderId} | index : ${index}`);
  showModalEditor.value = true;
};

// Fungsi untuk menghapus editor
const removeEditor = async (index) => {
  if (typeof index === "undefined" || index === null) return;

  const orderRef = dbRef(db, `${lokasi}/orders/${selectedOrderId}/comments`);
  let target = `${lokasi}/orders/${selectedOrderId}/comments/`;
  let orderData = await get(orderRef);
  let commentsData = orderData.val();

  if (!commentsData) {
    console.log("ℹ️ Tidak ada komentar, mengambil data dari pil...");
    const pilRef = dbRef(db, `${lokasi}/orders/${selectedOrderId}/pil`);
    target = `${lokasi}/orders/${selectedOrderId}/pil/`;
    orderData = await get(pilRef);
    commentsData = orderData.val();
  }

  const commentKeys = Object.keys(commentsData);
  if (index >= commentKeys.length) {
    console.error("❌ Index di luar batas.");
    return;
  }

  const targetKey = commentKeys[index];
  const targetRef = dbRef(db, `${target}${targetKey}`);

  // Update hanya field `editor`
  await update(targetRef, { editor: null });

  // Perbarui tampilan
  comments.value[index].editor = null;
  console.log("✅ Editor berhasil dihapus untuk key:", targetKey);
};

const updateDeadline = async (orderId, newDeadline) => {
  if (newDeadline) {
    // Use moment to format the date as dd/mm/yy
    const formattedDate = moment(newDeadline).format("DD/MM/YYYY");

    // Update the deadline in Firebase
    const orderUpdateRef = dbRef(db, `${lokasi}/orders/${orderId}`);
    await update(orderUpdateRef, {
      deadline: formattedDate,
    });

    console.log(`Order ${orderId} deadline updated to ${formattedDate}`);
  }
};

onMounted(async () => {
  const orderId = route.query.orderId;
  selectedOrderId = orderId;
  const savedNotifications = Cookies.get("notifications");
  console.log("savedNotifications", savedNotifications);
  if (savedNotifications) {
    notifications.value = JSON.parse(savedNotifications);
  }
  const photographersRef = dbRef(db, `${lokasi}/fotographer`);
  const editorsRef = dbRef(db, `${lokasi}/editor`);
  const ordersRef = dbRef(db, `${lokasi}/orders/${orderId}`);
  onValue(photographersRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      photographers.value = Object.keys(data).map((key) => ({
        name: capitalize(data[key]),
        id: key,
      }));
    }
  });

  onValue(editorsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      editors.value = Object.keys(data).map((key) => ({
        nama: capitalize(data[key].nama), // Pastikan field sesuai dengan struktur database
        wa: data[key].wa, // Menyimpan nomor WhatsApp
      }));
    }
  });

  reloadData();
  await loadBackgroundImages();

  onValue(
    ordersRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        console.log("No data available");
        return;
      }

      const orderData = snapshot.val();
      const pil = orderData.pil;
      const comments = orderData.comments;

      console.log("Pil:", pil);
      console.log("Comments:", comments);

      // Pastikan ada data yang valid sebelum memanggil showCommentsModal
      if ((pil && Object.keys(pil).length > 0) || comments) {
        showCommentsModal(
          pil && Object.keys(pil).length > 0 ? pil : comments,
          orderId
        );
      }
    },
    (error) => {
      console.error("Error fetching data: ", error);
    }
  );
});

const reloadPage = () => {
  window.location.reload();
};

const openFolder = (orderId) => {
  axios
    .get(`http://localhost:3333/open-folder/${orderId}`)
    .then(() => console.log("Folder dibuka"))
    .catch(() => alert("Gagal membuka folder"));
};

const addNotification = (message) => {
  const timestamp = new Date().toLocaleString();
  toast.add({
    severity: "info",
    summary: "Notifikasi Baru",
    detail: message,
    group: "tr",
  });
  notifications.value.push({ message, timestamp });
};

const clearNotifications = () => {
  notifications.value = [];
  // Remove notifications from cookies
  Cookies.remove("notifications");
};

const showHasilModal = (hasilEdit) => {
  selectedHasilEdit.value = hasilEdit; // Mengisi data hasilEdit
  console.log(selectedHasilEdit.value);
  isHasilModalVisible.value = true; // Membuka modal
};

const enableAdd = async (row) => {
  row.adding = true; // Enable adding mode
};

const savePilFoto = async (row) => {
  console.log(
    "Saving PilFoto:",
    row.tambahPilih,
    "Print Value:",
    row.printValue,
    "Selected BG",
    selectedBackgrounds.value
  ); // Check the values before saving

  row.adding = false; // Disable adding mode

  // Ensure the number is valid before saving

  try {
    // Get the current value of pilFoto from Firebase
    const ordersRef = dbRef(db, `${lokasi}/orders/${row.orderId}`);
    const priceRef = dbRef(db, `${lokasi}/orders/${row.orderId}/services/0`);
    const snapshot = await get(ordersRef);
    const snapshotPrice = await get(priceRef);

    const currentPrice = snapshotPrice.val().price ?? 0;

    console.log("printValue", row.printValue);

    if (snapshot.exists()) {
      // Fetch the current pilFoto value
      const currentPilFoto = snapshot.val()?.pilFoto ?? 0; // Safely access `pilFoto`
      const currentPrintValue = snapshot.val()?.tambahCetak ?? 0; // Safely access `tambahCetak`

      console.log("price", currentPrice);

      // Add the new number to the current value
      const newPilFoto = Number(currentPilFoto) + Number(row.tambahPilih ?? 0);
      const newPrintValue =
        Number(currentPrintValue) + Number(row.printValue ?? 0);

      // Calculate the new price
      const newPrice =
        Number(currentPrice) +
        (Number(row.tambahPilih ?? 0) * 100000 +
          Number(row.printValue ?? 0) * 10000);

      console.log("newPrice", newPrice);

      const currentPilBg = snapshot.val().pilBg || []; // Ambil nilai pilBg saat ini atau array kosong
      console.log("currentPilBg", currentPilBg);

      // Periksa apakah selectedBackgrounds memiliki isi
      if (selectedBackgrounds.value) {
        // Tambahkan isi selectedBackgrounds ke indeks berikutnya
        const updatedPilBg = [...currentPilBg, selectedBackgrounds.value];

        console.log("updatedPilBg", updatedPilBg);

        // Lakukan pembaruan
        await update(ordersRef, {
          pilFoto: newPilFoto, // New summed number
          tambahCetak: newPrintValue || 0, // New print value
          pilBg: updatedPilBg, // Update with the new backgrounds
        });
      } else {
        // Jika selectedBackgrounds kosong, perbarui field lain saja
        await update(ordersRef, {
          pilFoto: newPilFoto, // New summed number
          tambahCetak: newPrintValue || 0, // New print value
        });
      }

      await update(priceRef, {
        price: newPrice,
      });

      console.log(
        "PilFoto and Print updated successfully:",
        newPilFoto,
        row.printValue
      );
    } else {
      console.log("No data available for this order.");
    }
  } catch (error) {
    console.error("Error saving PilFoto:", error);
  }

  row.printValue = null;
  row.tambahPilih = null;
  selectedBackgrounds.value = null;
};

const removeBackground = async (item, index, row) => {
  console.log("Removing background:", item.label);

  // First, remove the background locally
  row.pilBg.splice(index, 1);

  // Now, remove it from the Firebase database
  try {
    const ordersRef = dbRef(db, `${lokasi}/orders/${row.orderId}`);
    const snapshot = await get(ordersRef);

    if (snapshot.exists()) {
      const currentPilBg = snapshot.val().pilBg || [];

      // Filter out the background that we want to remove
      const updatedPilBg = currentPilBg.filter((bg) => bg.label !== item.label);

      // Update Firebase with the new pilBg array
      await update(ordersRef, {
        pilBg: updatedPilBg,
      });

      console.log("Background deleted successfully:", item.label);
    } else {
      console.log("No data found for this order.");
    }
  } catch (error) {
    console.error("Error deleting background:", error);
  }
};

const cancelAdd = (row) => {
  row.adding = false; // Cancel add mode without saving changes
};

const downloadImage = async (url, filename) => {
  if (!url) {
    console.error("Invalid URL:", url);
    return;
  }

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

const loadBackgroundImages = async () => {
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

const downloadAllImages = async () => {
  downloadingImages.value = true;

  if (!Array.isArray(comments.value)) {
    console.error("❌ Error: Comments is not an array or is undefined.");
    downloadingImages.value = false;
    return;
  }

  for (let i = 0; i < comments.value.length; i++) {
    const comment = comments.value[i];
    console.log(
      `📝 Processing comment at index ${i} → url: ${comment?.url}, download: ${comment?.download}`
    );

    const imageUrl = comment?.download || comment?.url;
    const fileName = comment?.filename || `image_${i + 1}.jpg`; // Gunakan default jika filename tidak ada

    if (imageUrl) {
      console.log(`📥 Downloading image ${i + 1}: ${imageUrl} → ${fileName}`);
      try {
        await downloadImage(imageUrl, fileName);
        console.log(`✅ Successfully downloaded ${fileName}`);
      } catch (error) {
        console.error(`❌ Failed to download ${fileName}:`, error);
      }
      await delay(3000); // Jeda 3 detik sebelum mengunduh gambar berikutnya
    } else {
      console.warn(`⚠️ Skipping invalid comment at index ${i}:`, comment);
    }
  }

  downloadingImages.value = false;
  console.log("✅ All downloads completed!");
};

// Fungsi untuk mendapatkan jumlah file gambar
async function countImageFiles(orderId) {
  const orderRef = storageRef(storage, `SUHAT/${orderId}/`);
  try {
    const result = await listAll(orderRef); // Mengambil list file dalam folder
    const imageFiles = result.items.filter((item) => {
      const fileName = item.name.toLowerCase();
      return (
        fileName.endsWith(".jpg") ||
        fileName.endsWith(".jpeg") ||
        fileName.endsWith(".png")
      );
    });
    return imageFiles.length; // Mengembalikan jumlah gambar
  } catch (error) {
    console.error("Error saat mengambil file gambar: ", error);
    return 0; // Mengembalikan 0 jika ada error
  }
}

// Jika ingin memanggil secara realtime, kamu bisa menggunakan interval
// setInterval(countImageFiles, 5000); // Menyegarkan setiap 5 detik

// Fungsi untuk reload data (mengambil ulang data dari Firebase)
const reloadData = () => {
  loading.value = true;

  // Reload data orders dan menambahkan jumlah foto untuk setiap orderId
  const ordersRef = dbRef(db, `${lokasi}/orders`); // Sesuaikan lokasi data Anda
  onValue(ordersRef, async (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const newOrders = [];
      const editorCounts = {}; // Objek untuk menyimpan tugas editor

      // Iterasi data dan tambahkan jumlah foto ke setiap order
      for (const key in data) {
        const orderId = key;
        const orderData = data[key];

        // Cek jika orderId sudah ada di orders.value
        const existingOrderIndex = orders.value.findIndex(
          (order) => order.orderId === orderId
        );

        if (existingOrderIndex > -1) {
          // Track the last notified status for each order
          const notifiedStatuses = {};

          const oldOrder = orders.value[existingOrderIndex];

          // Check if the status has changed
          if (oldOrder.status !== orderData.status) {
            let notificationMessage;

            // Tentukan pesan notifikasi berdasarkan status
            if (orderData.status === "photo") {
              notificationMessage = `${orderData.orderId} sedang memasuki sesi pemotretan oleh ${orderData.fg}`;
            } else if (orderData.status === "order edit") {
              notificationMessage = `${orderData.orderId} sudah melakukan pemilihan fotonya`;
            } else if (orderData.status === "editting") {
              notificationMessage = `${orderData.orderId} sudah di orderkan edit ke ${orderData.editor?.nama}`;
            } else if (orderData.status === "done") {
              notificationMessage = `${orderData.orderId} sudah memberikan rating lengkap dan melakukan download`;
            }

            if (
              notificationMessage &&
              (!notifiedStatuses[orderData.orderId] ||
                notifiedStatuses[orderData.orderId] !== orderData.status)
            ) {
              // Add notification only if the status hasn't been notified before
              addNotification(notificationMessage);

              // Save the current status as notified for this order
              notifiedStatuses[orderData.orderId] = orderData.status;

              // Simpan notifikasi ke cookies
              const plainNotifications = notifications.value.map(
                (notification) => ({
                  message: notification.message,
                  timestamp: notification.timestamp,
                })
              );
              Cookies.set("notifications", JSON.stringify(plainNotifications), {
                expires: 7,
              });
            }
          }

          // Jika order sudah ada, update data yang ada
          orders.value[existingOrderIndex] = {
            ...orders.value[existingOrderIndex],
            ...{
              name: orderData.name || "Unknown",
              status: orderData.status || "No Status",
              timestamp_waiting: orderData.timestamp_waiting || "N/A",
              timestamp_photo: orderData.timestamp_photo || "N/A",
              timestamp_orderEdit: orderData.timestamp_orderEdit || "N/A",
              timestamp_editting: orderData.timestamp_editting || "N/A",
              timestamp_done: orderData.timestamp_done || "N/A",
              keterangan: orderData.keterangan || "",
              fg: orderData.fg || "Belum sesi foto",
              editor:
                orderData.editor?.nama ||
                orderData.editor ||
                "Belum order editor",
              cs: orderData.cs || "Belum tuntas",
              ratingFG: orderData.ratingFG || 0,
              feedbackFG: orderData.feedbackFG || "",
              ratingCS: orderData.ratingCS || 0,
              feedbackCS: orderData.feedbackCS || "",
              ratingEditor: orderData.ratingEditor || 0,
              feedbackEditor: orderData.feedbackEditor || "",
              kode: orderData.kode || "N/A",
              pilFoto: orderData.pilFoto || "N/A",
              comments: Array.isArray(orderData.comments)
                ? orderData.comments.map((comment) => ({
                    comment: comment.comment || "",
                    bg: comment.bg || "",
                    url: comment.url || "",
                    timestamp_comment: comment.timestamp_comment || "",
                    onProgress: comment.onProgress || false,
                  }))
                : [],
              pil:
                orderData.pil && typeof orderData.pil === "object"
                  ? Object.values(orderData.pil).map((pil) => ({
                      comment: pil.comment || "",
                      bg: pil.background || "",
                      url: pil.thumbnail || "",
                      timestamp: pil.timestamp || "",
                      filename: pil.name || "",
                      preview: pil.link || "",
                      download: pil.download || "",
                      editor: pil.editor || "",
                      onProgress: pil.onProgress || false,
                    }))
                  : [],
              whatsapp: orderData.whatsapp
                ? orderData.whatsapp.startsWith("0")
                  ? "62" + orderData.whatsapp.slice(1)
                  : orderData.whatsapp
                : "N/A",

              email: orderData.email || "N/A",
              paket: orderData.services?.[0]?.name || "No Paket", // Menambahkan paket
              price: orderData.services?.[0]?.price || 0, // Menambahkan harga
              imageCount: orderData.totalFoto, // Menambahkan jumlah gambar
              deadline: orderData.deadline, // Menambahkan deadline
              hasilEdit: Array.isArray(orderData.hasilEdit)
                ? orderData.hasilEdit
                : typeof orderData.hasilEdit === "object" &&
                  orderData.hasilEdit !== null
                ? Object.entries(orderData.hasilEdit).map(([id, data]) => ({
                    id,
                    ...data,
                  }))
                : [],

              pilBg: Array.isArray(orderData.pilBg) ? orderData.pilBg : [],
              tambahCetak: orderData.tambahCetak,
            },
          };
        } else {
          // Jika order belum ada, tambahkan data baru
          newOrders.push({
            orderId: orderId,
            name: orderData.name || "Unknown",
            status: orderData.status || "No Status",
            timestamp_waiting: orderData.timestamp_waiting || "N/A",
            timestamp_photo: orderData.timestamp_photo || "N/A",
            timestamp_orderEdit: orderData.timestamp_orderEdit || "N/A",
            timestamp_editting: orderData.timestamp_editting || "N/A",
            timestamp_done: orderData.timestamp_done || "N/A",
            keterangan: orderData.keterangan || "",
            fg: orderData.fg || "Belum sesi foto",
            editor:
              orderData.editor?.nama ||
              orderData.editor ||
              "Belum order editor",
            cs: orderData.cs || "Belum tuntas",
            ratingFG: orderData.ratingFG || 0,
            feedbackFG: orderData.feedbackFG || "",
            ratingCS: orderData.ratingCS || 0,
            feedbackCS: orderData.feedbackCS || "",
            ratingEditor: orderData.ratingEditor || 0,
            feedbackEditor: orderData.feedbackEditor || "",
            kode: orderData.kode || "N/A",
            pilFoto: orderData.pilFoto || "N/A",
            comments: Array.isArray(orderData.comments)
              ? orderData.comments.map((comment) => ({
                  comment: comment.comment || "",
                  bg: comment.bg || "",
                  url: comment.url || "",
                  timestamp_comment: comment.timestamp_comment || "",
                  onProgress: comment.onProgress || false,
                }))
              : [],
            pil:
              orderData.pil && typeof orderData.pil === "object"
                ? Object.values(orderData.pil).map((pil) => ({
                    comment: pil.comment || "",
                    bg: pil.background || "",
                    url: pil.thumbnail || "",
                    timestamp: pil.timestamp || "",
                    filename: pil.name || "",
                    preview: pil.link || "",
                    download: pil.download || "",
                    editor: pil.editor || "",
                    onProgress: pil.onProgress || false,
                  }))
                : [],
            whatsapp: orderData.whatsapp
              ? orderData.whatsapp.startsWith("0")
                ? "62" + orderData.whatsapp.slice(1)
                : orderData.whatsapp
              : "N/A",

            email: orderData.email || "N/A",
            paket: orderData.services?.[0]?.name || "No Paket", // Menambahkan paket
            price: orderData.services?.[0]?.price || 0, // Menambahkan harga
            imageCount: orderData.totalFoto, // Menambahkan jumlah gambar
            deadline: orderData.deadline, // Menambahkan deadline
            hasilEdit: Array.isArray(orderData.hasilEdit)
              ? orderData.hasilEdit
              : typeof orderData.hasilEdit === "object" &&
                orderData.hasilEdit !== null
              ? Object.entries(orderData.hasilEdit).map(([id, data]) => ({
                  id,
                  ...data,
                }))
              : [],

            pilBg: Array.isArray(orderData.pilBg) ? orderData.pilBg : [],
            tambahCetak: orderData.tambahCetak,
          });
        }

        console.log(
          orderId,
          orderData.hasilEdit,
          orderData.editor?.nama || orderData.editor
        );

        // To keep track of already assigned files (files already processed)
        const assignedFiles = new Set();

        // Menghitung tugas editor berdasarkan pil setiap file
        if (orderData.pil && typeof orderData.pil === "object") {
          Object.values(orderData.pil).forEach((pil) => {
            if (
              (pil.editor && !pil.hasilEdit) ||
              orderData.status === "editting"
            ) {
              const editorName =
                pil.editor?.nama || pil.editor || "Unknown Editor";

              // Pastikan editorCounts untuk editor tertentu sudah ada, jika belum buat array kosong
              if (!editorCounts[editorName]) {
                editorCounts[editorName] = [];
              }

              // Check if the file has already been assigned
              if (!assignedFiles.has(pil.name)) {
                // Add the file to the set of assigned files
                assignedFiles.add(pil.name);

                // Tambahkan tugas editor untuk pil, beserta paket dan deadline dari data umum
                editorCounts[editorName].push({
                  orderId: orderId,
                  filename: pil.name || "Unknown Filename",
                  timestamp: pil.timestamp || "No Timestamp",
                  paket: orderData.services?.[0]?.name || "No Paket",
                  deadline: orderData.deadline || "No Deadline",
                  onProgress: pil.onProgress || false, // << tambahan
                });
              }
            }
          });
        }

        // Hitung jumlah editor yang belum memiliki hasilEdit dan tambahkan informasi lainnya
        if (orderData.editor && !orderData.hasilEdit) {
          const editorName =
            orderData.editor?.nama || orderData.editor || "Unknown Editor";

          if (!editorCounts[editorName]) {
            editorCounts[editorName] = [];
          }

          // Ambil semua filename yang terkait dengan editor dari pil, jika tidak ada di pil, ambil dari comments
          let filenames = Object.values(orderData.pil || {}).map(
            (pil) => pil.name || "Unknown Filename"
          );

          // Jika tidak ada filename di pil, cari di comments
          if (filenames.length === 0 && Array.isArray(orderData.comments)) {
            filenames = orderData.comments.map((comment) => ({
              filename: getFileNameFromUrl(comment.url) || "Unknown Filename",
              onProgress: comment.onProgress || false, // ✅ tambahkan di sini
            }));
          }

          // Tambahkan tugas editor untuk semua file (pil atau comments) di data umum
          filenames.forEach((file) => {
            // kalau hasil map dari pil → string
            // kalau hasil map dari comments → object { filename, onProgress }
            const fileName = typeof file === "string" ? file : file.filename;
            const fileOnProgress =
              typeof file === "string" ? false : file.onProgress;

            if (!assignedFiles.has(fileName)) {
              assignedFiles.add(fileName);

              editorCounts[editorName].push({
                orderId: orderId,
                filename: fileName,
                paket: orderData.services?.[0]?.name || "No Paket",
                deadline: orderData.deadline || "No Deadline",
                onProgress: fileOnProgress, // ✅ ikut disimpan
              });
            }
          });
        }

        // Setelah semua tugas ditambahkan, urutkan berdasarkan deadline yang paling dekat untuk setiap editor
        Object.keys(editorCounts).forEach((editorName) => {
          editorCounts[editorName].sort((a, b) => {
            // Convert the deadline into Date objects for comparison
            const deadlineA = new Date(a.deadline);
            const deadlineB = new Date(b.deadline);

            // If deadline is invalid (e.g. "No Deadline"), we can treat it as an infinite deadline
            if (isNaN(deadlineA)) return 1; // Move tasks with invalid deadline to the end
            if (isNaN(deadlineB)) return -1; // Move tasks with invalid deadline to the end

            // Compare the deadlines
            return deadlineA - deadlineB;
          });
        });

        if (orderData.hasilEdit && orderData.status === "editting") {
          console.log(orderData.hasilEdit && orderData.status === "editting");
          // Update status ke Firebase
          const orderUpdateRef = dbRef(db, `${lokasi}/orders/${orderId}`);
          await update(orderUpdateRef, {
            status: "selesai edit",
          });
          console.log(`Firebase order ${orderId} updated successfully`);
        }
      }

      // Gabungkan data baru ke orders.value
      orders.value = [...orders.value, ...newOrders];

      // Ubah objek editorCounts menjadi array
      editorTasks.value = Object.entries(editorCounts).map(
        ([editor, tasks]) => ({
          editor: editor,
          pendingTasks: tasks.length,
          details: tasks,
        })
      );

      // Tampilkan hasil hitungan editor
      console.log(editorTasks.value); // Hasil perhitungan jumlah editor yang belum memiliki hasilEdit
    }
    loading.value = false;
  });
};

const previewImage = (url, name) => {
  selectedImageUrl.value = url;
  // Ekstrak nama file dari URL Firebase Storage
  selectedFileName.value = name;
  showImagePreview.value = true;
  const selectedCommentData = comments.value.find(
    (comment) => comment.url === url
  );

  selectedComment.value = selectedCommentData
    ? selectedCommentData.comment
    : null;
  selectedBg.value = selectedCommentData
    ? decodeURIComponent(selectedCommentData.bg.split("/").pop().split("?")[0])
    : null;
};

// Fungsi untuk menentukan prioritas berdasarkan status
const getPriority = (status) => {
  if (status === "photo") return 1;
  if (status === "waiting") return 2;
  return 3; // Status lainnya
};

// Fungsi untuk parsing timestamp dari format custom ke objek Date
// const parseTimestamp = (timestamp) => {
//   const [datePart, timePart] = timestamp.split(", ");
//   const [day, month, year] = datePart.split("/").map(Number);
//   const [hours, minutes, seconds] = timePart.split(".").map(Number);
//   return new Date(year, month - 1, day, hours, minutes, seconds); // Date(year, monthIndex, day, hour, minute, second)
// };

// Properti computed untuk sorting data berdasarkan prioritas dan timestamp
const sortedOrders = computed(() => {
  // Pastikan orders adalah array sebelum sorting
  if (!Array.isArray(orders.value)) return [];
  return orders.value.slice().sort((a, b) => {
    // Bandingkan prioritas status
    const priorityA = getPriority(a.status);
    const priorityB = getPriority(b.status);
    if (priorityA !== priorityB) {
      return priorityA - priorityB; // Urutkan berdasarkan prioritas
    }

    // Jika prioritas sama, bandingkan timestamp
    // const dateA = parseTimestamp(a.timestamp_waiting);
    // const dateB = parseTimestamp(b.timestamp_waiting);
    return a.timestamp_waiting - b.timestamp_waiting; // Urutkan berdasarkan timestamp (ascending)
  });
});

// Watcher untuk memantau perubahan pada orders
// watch(
//   () => orders.value,
//   (newOrdersValue, oldOrdersValue) => {
//     // Validasi awal: pastikan kedua nilai adalah array
//     if (!Array.isArray(newOrdersValue) || !Array.isArray(oldOrdersValue)) {
//       console.error("sortedOrders bukan array!");
//       return;
//     }

//     // Deep clone untuk mencegah referensi data yang tidak disengaja
//     const clonedNewOrders = _.cloneDeep(newOrdersValue);
//     const clonedOldOrders = _.cloneDeep(oldOrdersValue);

//     // Periksa perubahan status untuk setiap order
//     clonedNewOrders.forEach((order, index) => {
//       const oldOrder = clonedOldOrders[index];

//       if (oldOrder && order.status !== oldOrder.status) {
//         let notificationMessage;

//         // Tentukan pesan notifikasi berdasarkan status
//         if (order.status === "photo") {
//           notificationMessage = `${order.orderId} sedang memasuki sesi pemotretan oleh ${order.fg}`;
//         } else if (order.status === "order edit") {
//           notificationMessage = `${order.orderId} sudah melakukan pemilihan fotonya`;
//         } else if (order.status === "editting") {
//           notificationMessage = `${order.orderId} sudah di orderkan edit ke ${order.editor.nama}`;
//         } else if (order.status === "done") {
//           notificationMessage = `${order.orderId} sudah memberikan rating lengkap dan melakukan download`;
//         }

//         if (notificationMessage) {
//           addNotification(notificationMessage);

//           // Simpan notifikasi ke cookies
//           const plainNotifications = notifications.value.map(
//             (notification) => ({
//               message: notification.message,
//               timestamp: notification.timestamp,
//             })
//           );
//           Cookies.set("notifications", JSON.stringify(plainNotifications), {
//             expires: 7,
//           });
//         }
//       }
//     });

//     // Simpan perubahan ke cookies, tetapi hanya jika ada perubahan nyata
//     const existingNewOrders = Cookies.get("newOrders");
//     const existingOldOrders = Cookies.get("oldOrders");

//     if (JSON.stringify(clonedNewOrders) !== existingNewOrders) {
//       Cookies.set("newOrders", JSON.stringify(clonedNewOrders), { expires: 7 });
//     }
//     if (JSON.stringify(clonedOldOrders) !== existingOldOrders) {
//       Cookies.set("oldOrders", JSON.stringify(clonedOldOrders), { expires: 7 });
//     }
//   },
//   { deep: true }
// );

const renderStars = (rating) => {
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    stars +=
      i <= rating
        ? `<span class="text-yellow-500 text-lg">★</span>`
        : `<span class="text-gray-400 text-lg">★</span>`;
  }
  return stars;
};

const capitalize = (str) => {
  if (!str) return "";
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const getTagSeverity = (status) => {
  if (!status || typeof status !== "string") {
    return "info"; // Default value if status is invalid or undefined
  }

  switch (status.split(" ")[0]) {
    case "photo":
      return "info";
    case "waiting":
      return "contrast";
    case "editting":
      return "secondary";
    case "order":
      return "warn";
    case "selesai":
      return "help";
    case "done":
      return "success";
    case "Awal":
      return "success";
    case "Tepat":
      return "help";
    case "Telat":
      return "danger";
    case "Belum":
      return "warn";
    case "1":
      return "warn";
    case "2":
      return "warn";
    case "3":
      return "warn";
    case "Hari":
      return "warn";
    default:
      return "info";
  }
};

const showPhotographerModal = (orderId) => {
  selectedOrderId = orderId;
  showModalFg.value = true;
  photographerError.value = false;
};

const selesaiPhoto = async (orderId) => {
  const message = `
Halo, *CS* 👋

Foto *${orderId}* telah dimasukkan ke server\n\nMohon segera cek di :\n\\\\192.168.1.22\\data tes\n\nDan di upload ke\nhttps://studio8.my.id/home?key=$2a$20$zTGuu4O.J2GAXgUOyPZygeutqBGHRNJFLBE73P3Kj4jEO1evAT9tu&folder=${orderId}
  `;

  try {
    const response = await axios.post("https://server.studio8.my.id/wa", {
      recipient: recipient, // Kirim semua data per item
      message: message,
    });

    if (response.data.success) {
      console.log("✅ Pesan berhasil terkirim ke WhatsApp!");
      toast.add({
        severity: "success",
        summary: "✅ Sukses terkirim",
        detail: "Pesan berhasil terkirim ke WhatsApp Grup.",
        group: "tr",
        life: 3000,
      });
    } else {
      console.log("❌ Gagal mengirim pesan ke WhatsApp.");
      toast.add({
        severity: "error",
        summary: "❌ Gagal terkirim",
        detail: "Pesan tidak berhasil terkirim ke WhatsApp Grup.",
        group: "tr",
        life: 3000,
      });
    }
  } catch (error) {
    console.error("❌ Terjadi kesalahan saat mengirim pesan:", error);
    toast.add({
      severity: "error",
      summary: "❌ Kesalahan",
      detail: "Terjadi kesalahan saat mengirim whatsaap ke grup.",
      group: "tr",
      life: 3000,
    });
  }
};

const showEditorModal = (orderId) => {
  selectedOrderId = orderId;
  showModalEditor.value = true;
  editorError.value = false;
};

const fetchEditor = async () => {
  try {
    const editorRef = dbRef(db, `${lokasi}/orders/${selectedOrderId}/editor`);
    const editorSnapshot = await get(editorRef);
    console.log(editorSnapshot.val());
    return editorSnapshot.exists() ? editorSnapshot.val() : "";
  } catch (error) {
    console.error("Error fetching editor:", error);
    return "";
  }
};

const showCommentsModal = async (commentsData, orderId) => {
  selectedOrderId = orderId;
  console.log(commentsData);

  // Jika commentsData berbentuk array
  if (Array.isArray(commentsData)) {
    comments.value = await Promise.all(
      commentsData.map(async (comment) => {
        const filename =
          comment?.filename ||
          decodeURIComponent(comment.url)
            .split("/")
            .pop()
            .split("?")[0]
            .replace("_thumb.jpg", "");

        console.log(comment.name);

        let editor = comment.editor?.nama || "";
        if (!editor) {
          const editorData = await fetchEditor();
          editor = editorData?.nama || editorData || "";
        }

        return {
          comment: comment.comment || "",
          bg: comment.bg || comment.background || "",
          url: comment.url || comment.thumbnail || "",
          filename: comment.name || filename,
          timestamp: comment.timestamp || "",
          preview: comment.preview || comment.link || "",
          download: comment.download || "",
          editor,
        };
      })
    );
  } else {
    comments.value = await Promise.all(
      Object.keys(commentsData).map(async (key) => {
        const comment = commentsData[key];
        const filename =
          comment?.filename ||
          decodeURIComponent(comment.url)
            .split("/")
            .pop()
            .split("?")[0]
            .replace("_thumb.jpg", "");

        console.log(comment.name);

        let editor = comment.editor?.nama || "";
        if (!editor) {
          const editorData = await fetchEditor();
          editor = editorData?.nama || editorData || "";
        }

        return {
          comment: comment.comment || "",
          bg: comment.bg || comment.background || "",
          url: comment.url || comment.thumbnail || "",
          filename: comment.name || filename,
          timestamp: comment.timestamp || "",
          preview: comment.preview || comment.link || "",
          download: comment.download || "",
          editor,
        };
      })
    );
  }

  console.log("comments", comments.value);
  selectedOrderId = orderId;
  console.log("orderId : ", selectedOrderId);
  showModalComments.value = true;
};

const returnToPhoto = (orderId) => {
  const orderRef = dbRef(db, `${lokasi}/orders/${orderId}`);
  update(orderRef, {
    status: "photo",
  })
    .then(() => {
      console.log("Order status updated back to photo");
      // Now, fetch the order data and play the music
      const orderRef = dbRef(db, `${lokasi}/orders/${orderId}`);
      get(orderRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const orderData = snapshot.val();

            // Check if the status is 'photo' and services field exists
            if (
              orderData.status === "photo" &&
              orderData.services &&
              orderData.services.length > 0
            ) {
              const serviceName = orderData.services[0].name;

              console.log("Service name:", serviceName);

              // Extract the number from the service name, assuming the format is 'Self 15'
              const numberMatch = serviceName.match(/(\d+)/);
              if (numberMatch && numberMatch[1]) {
                const number = numberMatch[1]; // Extracted number

                console.log("Number extracted:", number);

                // Now play the music file that starts with this number
                playRandomMusic(number);
              }
            }
          }
        })
        .catch((error) => {
          console.error("Error fetching order data:", error);
        });
    })
    .catch((error) => {
      console.error("Error updating order status:", error);
    });
};

// Function to handle the rating process and order completion
const doneOrder = (orderId) => {
  selectedOrderId = orderId;

  // Cek apakah sudah ada rating untuk order ini
  get(dbRef(db, `${lokasi}/orders/${orderId}/cs`))
    .then((snapshot) => {
      if (snapshot.exists()) {
        cs = snapshot.val(); // Tangkap hasil ke variabel cs
        console.log("Data CS:", cs);
      } else {
        console.error("Data tidak ditemukan");
      }
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });

  const ratingRef = dbRef(db, `${lokasi}/orders/${orderId}/ratingCS`);

  get(ratingRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        // Rating sudah ada, update status jadi "done"
        updateOrderStatus(orderId);
      } else {
        updateOrderStatus(orderId);

        // toast.add({
        //   severity: "error",
        //   summary: "Belum Rating",
        //   detail: "Konsumen belum memberikan rating.",
        //   group: "tr",
        //   life: 3000,
        // });
        // // Rating belum ada, tampilkan dialog untuk rating
        // showRatingDialog.value = true; // Show the rating dialog

        // // Handle the acceptance of the rating
        // const acceptCallback = () => {
        //   // Proceed with the order status update after rating
        //   updateOrderStatus(orderId);
        // };

        // // Handle the rejection of the rating
        // const rejectCallback = () => {
        //   toast.add({
        //     severity: "error",
        //     summary: "Rating Dibatalkan",
        //     detail: "Anda belum memberikan rating.",
        //     group: "tr",
        //     life: 3000,
        //   });
        // };

        // // Show rating dialog and set up callback for accept/reject
        // confirm.require({
        //   group: "headless",
        //   header: "Rate Pelayanan",
        //   message: `Mohon memberikan rating untuk pelayanan CS ${cs} sebelum menyelesaikan.`,
        //   accept: acceptCallback,
        //   reject: rejectCallback,
        // });
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

// Function to update the order status to "done"
const updateOrderStatus = (orderId) => {
  const orderRef = dbRef(db, `${lokasi}/orders/${orderId}`);
  update(orderRef, {
    status: "done",
  })
    .then(() => {
      console.log("Order status updated to 'done'");
      toast.add({
        severity: "success",
        summary: "Order Completed",
        detail: "Order has been marked as done.",
        group: "tr",
        life: 3000,
      });
    })
    .catch((error) => {
      console.error("Error updating order status:", error);
      toast.add({
        severity: "error",
        summary: "Error Updating Status",
        detail: "Terjadi kesalahan saat mengupdate status order.",
        group: "tr",
        life: 3000,
      });
    });
};

// Handle Accept (submit rating and update order status)
const handleAccept = (acceptCallback) => {
  if (ratingValue.value <= 0) {
    toast.add({
      severity: "warn",
      summary: "No Rating",
      detail: "Please provide a rating before proceeding.",
      group: "tr",
      life: 3000,
    });
    return; // Exit early if no rating is provided
  }

  // Log values for debugging
  console.log("ratingValue:", ratingValue.value);
  console.log("feedback:", feedback.value);

  // Construct reference and update data
  const ratingRef = dbRef(db, `${lokasi}/orders/${selectedOrderId}/`);
  console.log("Updating rating at path:", ratingRef);

  update(ratingRef, {
    ratingCS: ratingValue.value,
    feedbackCS: feedback.value || "", // Use empty string if no feedback
  })
    .then(() => {
      console.log("Rating update successful");
      acceptCallback(); // Proceed with callback on success
      toast.add({
        severity: "success",
        summary: "Rating Saved",
        detail: "Your rating has been saved successfully.",
        group: "tr",
        life: 3000,
      });
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
};

// Handle Reject (cancel the rating)
const handleReject = (rejectCallback) => {
  rejectCallback();
};

const confirmPhotographer = () => {
  if (!selectedPhotographer.value) {
    photographerError.value = true;
    return;
  }

  const orderRef = dbRef(db, `${lokasi}/orders/${selectedOrderId}`);
  const timestamp = new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
  });

  update(orderRef, {
    status: "photo",
    fg: selectedPhotographer.value.name,
    timestamp_photo: timestamp, // Menambahkan timestamp_photo dengan format waktu lokal
  })
    .then(() => {
      showModalFg.value = false;
      console.log(
        "Order status updated to photo, photographer assigned, and timestamp added"
      );

      // Now, fetch the order data and play the music
      const orderRef = dbRef(db, `${lokasi}/orders/${selectedOrderId}`);
      get(orderRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const orderData = snapshot.val();

            // Check if the status is 'photo' and services field exists
            if (
              orderData.status === "photo" &&
              orderData.services &&
              orderData.services.length > 0
            ) {
              const serviceName = orderData.services[0].name;

              console.log("Service name:", serviceName);

              // Extract the number from the service name, assuming the format is 'Self 15'
              const numberMatch = serviceName.match(/(\d+)/);
              if (numberMatch && numberMatch[1]) {
                const number = numberMatch[1]; // Extracted number

                console.log("Number extracted:", number);

                // Now play the music file that starts with this number
                playRandomMusic(number);
              }
            }
          }
        })
        .catch((error) => {
          console.error("Error fetching order data:", error);
        });
    })
    .catch((error) => {
      console.error("Error updating order:", error);
    });
};

const confirmEditor = async () => {
  if (!selectedEditor.value) {
    editorError.value = true;
    return;
  }

  console.log("Selected Editor : ", selectedEditor.value.nama);

  const timestamp = new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
  });

  // Hitung deadline (7 hari dari sekarang)
  const deadlineDate = new Date();
  deadlineDate.setDate(deadlineDate.getDate() + 7);
  const deadline = deadlineDate.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
  });

  const orderRef = dbRef(db, `${lokasi}/orders/${selectedOrderId}`);
  const pilRef = dbRef(db, `${lokasi}/orders/${selectedOrderId}/pil`);
  const commentsRef = dbRef(db, `${lokasi}/orders/${selectedOrderId}/comments`);
  let orderData = await get(pilRef);
  let pilData = orderData.val();

  try {
    // Ambil data order saat ini
    const orderSnapshot = await get(orderRef);
    const orderDataDeadline = orderSnapshot.val();

    if (typeof index !== "undefined" && index !== null) {
      // Jika `index` ada, update data di pilRef atau commentsRef

      if (!pilData) {
        orderData = await get(commentsRef);
        pilData = orderData.val();
      }

      if (!pilData) {
        console.error("❌ Data pil/comments tidak ditemukan.");
        return;
      }

      console.log("pilData sebelum update:", pilData);

      // Ambil semua key dalam pilData
      const pilKeys = Object.keys(pilData);

      // Pastikan `index` tidak melebihi jumlah item dalam objek
      if (index >= pilKeys.length) {
        console.error("❌ Index di luar batas.");
        return;
      }

      // Dapatkan key Firebase berdasarkan index yang diberikan
      const targetKey = pilKeys[index];
      console.log("Target Key:", targetKey);

      // Path spesifik ke data yang akan diperbarui
      const targetRef = dbRef(
        db,
        `${lokasi}/orders/${selectedOrderId}/pil/${targetKey}`
      );

      // Update hanya field `editor`
      await update(targetRef, { editor: selectedEditor.value });

      const updateData = {
        timestamp_editting: timestamp,
        status: "editting",
        editor: selectedEditor.value,
      };

      if (!orderDataDeadline?.deadline) {
        updateData.deadline = deadline.split(",")[0];
      }

      await update(orderRef, updateData);
      console.log("✅ Data order berhasil diperbarui.");

      console.log("✅ Editor berhasil diperbarui untuk key:", targetKey);

      // Hanya kirim data untuk item yang diubah (berdasarkan index)
      const pilItem = pilData[targetKey];

      let name = pilItem.name || "Unknown";
      let bg = pilItem.background || pilItem.bg || "Unknown";
      let comment = pilItem.comment || "No comment";

      // Buat pesan WhatsApp untuk item yang diperbarui
      const message = `
Halo, *${selectedEditor.value.nama}* 👋

Customer *${selectedOrderId}* telah dibagikan ke Anda\n\nDeadline : *${
        orderDataDeadline.deadline || deadline.split(",")[0]
      }*\nDetail Pil :\n\n1. *${name}*\n   *BG*: ${bg}\n   *Request*: ${comment}\n\nhttps://suhat.studio8.my.id/list?orderId=${selectedOrderId}
`;

      console.log("Recipient:", recipient);
      console.log("Message:", message);

      const response = await axios.post("https://server.studio8.my.id/wa", {
        recipient: recipient, // Kirim hanya item yang dipilih berdasarkan index
        message: message,
      });

      if (response.data.success) {
        console.log("✅ Pesan berhasil terkirim ke WhatsApp!");
        toast.add({
          severity: "success",
          summary: "✅ Sukses terkirim",
          detail: "Pesan berhasil terkirim ke WhatsApp Grup.",
          group: "tr",
          life: 3000,
        });
      } else {
        console.log("❌ Gagal mengirim pesan ke WhatsApp.");
        toast.add({
          severity: "error",
          summary: "❌ Gagal terkirim",
          detail: "Pesan tidak berhasil terkirim ke WhatsApp Grup.",
          group: "tr",
          life: 3000,
        });
      }
    } else {
      // Jika `index` tidak ada, update data orderRef langsung
      const updateData = {
        timestamp_editting: timestamp,
        status: "editting",
        editor: selectedEditor.value,
      };

      if (!orderDataDeadline?.deadline) {
        updateData.deadline = deadline.split(",")[0];
      }

      await update(orderRef, updateData);
      console.log("✅ Data order berhasil diperbarui.");

      // Buat pilList jika index tidak ada (kirim seluruh data)
      const pilArray = Array.isArray(pilData)
        ? pilData
        : Object.values(pilData);
      const pilList =
        pilArray.length > 0
          ? pilArray
              .map((item, index) => {
                let name = item.name;
                if (!name) {
                  try {
                    name = decodeURIComponent(item.url).match(
                      /([^/]+)_thumb\.jpg/
                    )[1];
                  } catch (error) {
                    name = "Unknown";
                  }
                }

                let bg = "";
                if (item.background || item.bg) {
                  try {
                    bg = decodeURIComponent(
                      (item.background || item.bg)
                        .split("bg%2F")[1]
                        ?.split("?")[0] || ""
                    );
                  } catch (error) {
                    bg = "Unknown";
                  }
                }

                return `${
                  index + 1
                }. *Name*: ${name}\n       *BG*: ${bg}\n       *Request*: ${
                  item.comment || ""
                }\n       *Editor*: ${
                  item.editor?.nama || selectedEditor.value || "Unknown"
                }`;
              })
              .join("\n\n")
          : "No Pil data available";

      // Buat pesan WhatsApp dengan seluruh data
      const message = `
Halo, *${selectedEditor.value.nama}* 👋

Customer *${selectedOrderId}* telah dibagikan ke Anda\n\nDeadline : *${
        orderDataDeadline.deadline || deadline.split(",")[0]
      }*\nDetail Pil :\n${pilList}\n\nhttps://suhat.studio8.my.id/list?orderId=${selectedOrderId}
`;

      console.log("Recipient:", recipient);
      console.log("Message:", message);

      const response = await axios.post("https://server.studio8.my.id/wa", {
        recipient: recipient, // Kirim semua data per item
        message: message,
      });

      if (response.data.success) {
        console.log("✅ Pesan berhasil terkirim ke WhatsApp!");
        toast.add({
          severity: "success",
          summary: "✅ Sukses terkirim",
          detail: "Pesan berhasil terkirim ke WhatsApp Grup.",
          group: "tr",
          life: 3000,
        });
      } else {
        console.log("❌ Gagal mengirim pesan ke WhatsApp.");
        toast.add({
          severity: "error",
          summary: "❌ Gagal terkirim",
          detail: "Pesan tidak berhasil terkirim ke WhatsApp Grup.",
          group: "tr",
          life: 3000,
        });
      }
    }

    showModalEditor.value = false;
  } catch (error) {
    console.error("❌ Error updating order:", error);
  }
  index = null;
};

const cancelModal = () => {
  showModalFg.value = false;
  showModalEditor.value = false;
  showModalComments.value = false;
};

const playRandomMusic = (musicNumber) => {
  const musicFiles = import.meta.glob("../assets/music/*_*.mp3");
  const filteredMusicFiles = Object.keys(musicFiles).filter((filePath) =>
    filePath.startsWith(`../assets/music/${musicNumber}_`)
  );

  if (filteredMusicFiles.length > 0) {
    const randomMusicFile =
      filteredMusicFiles[Math.floor(Math.random() * filteredMusicFiles.length)];

    musicFiles[randomMusicFile]()
      .then((module) => {
        if (currentMusic) {
          currentMusic.pause();
          currentMusic.currentTime = 0; // Reset to the beginning
        }

        currentMusic = new Audio(module.default); // Store the music in currentMusic
        isPaused.value = false; // Ensure it's not paused
        currentMusic.play();
        console.log(`Playing music: ${randomMusicFile}`);
      })
      .catch((error) => {
        console.error("Error importing music file:", error);
      });
  } else {
    console.log("No music files found for this number");
  }
};

const toggleMusic = () => {
  if (currentMusic) {
    if (isPaused.value) {
      currentMusic.play();
      isPaused.value = false;
      console.log("Music resumed");
    } else {
      currentMusic.pause();
      isPaused.value = true;
      console.log("Music paused");
    }
  } else {
    console.log("No music is currently playing");
  }
};

const finishPhoto = (orderId) => {
  const orderRef = dbRef(db, `${lokasi}/orders/${orderId}`);
  update(orderRef, {
    status: "editting",
  })
    .then(() => {
      // Stop the music when the status is updated
      if (currentMusic) {
        currentMusic.pause(); // Pause the music
        currentMusic.currentTime = 0; // Optionally reset to the beginning
        console.log("Music stopped as the order status is 'editing'.");
      }

      console.log("Order status updated to 'editing'");
    })
    .catch((error) => {
      console.error("Error updating order status:", error);
    });
};
</script>

<style scoped>
.highlight-task {
  background-color: #fff3cd !important; /* kuning lembut */
}
</style>
