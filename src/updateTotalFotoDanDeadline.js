import admin from "firebase-admin";
import moment from "moment-timezone";
import path from "path";
import { fileURLToPath } from "url";

// Menentukan path ke file serviceAccountKey.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceAccount = path.join(__dirname, "../serviceAccountKey.json");

// Inisialisasi Firebase Admin SDK dengan menggunakan kredensial dari file JSON
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://order-edit-default-rtdb.asia-southeast1.firebasedatabase.app", // Ganti dengan URL Realtime Database Anda
  storageBucket: "order-edit.firebasestorage.app", // Ganti dengan nama bucket Firebase Anda
});

// Mendapatkan referensi ke Firebase Realtime Database dan Storage
const db = admin.database();
const storage = admin.storage();

// Fungsi untuk menghitung jumlah file gambar
async function countImageFiles(orderId) {
  const bucket = storage.bucket();

  console.log(`Mulai menghitung file gambar untuk orderId: ${orderId}`);

  try {
    const [files] = await bucket.getFiles({ prefix: `SUHAT/${orderId}/` });
    const imageFiles = files.filter((file) => {
      const filePath = file.name; // Jalur lengkap file
      const isDirectFile = filePath.split("/").length === 3; // Pastikan tidak ada subfolder
      const isImage =
        filePath.toLowerCase().endsWith(".jpg") ||
        filePath.toLowerCase().endsWith(".jpeg") ||
        filePath.toLowerCase().endsWith(".png");

      return isDirectFile && isImage;
    });
    console.log(`Jumlah gambar untuk orderId ${orderId}: ${imageFiles.length}`);
    return imageFiles.length; // Mengembalikan jumlah gambar
  } catch (error) {
    console.error(
      `Error saat mengambil file gambar untuk orderId ${orderId}:`,
      error
    );
    return 0;
  }
}

// Fungsi untuk mengubah string timestamp menjadi objek Moment dengan zona waktu Asia/Jakarta
const parseTimestamp = (timestamp) => {
  return moment.tz(timestamp, "DD/MM/YYYY, HH.mm.ss", "Asia/Jakarta");
};

// Fungsi untuk mendapatkan URL file di folder hasil edit
async function getEditedFilesUrls(orderId) {
  const bucket = storage.bucket();

  console.log(`Mengambil URL file hasil edit untuk orderId: ${orderId}`);

  try {
    const [files] = await bucket.getFiles({
      prefix: `SUHAT/${orderId}_edit/THUMB`,
    });

    const fileDetails = await Promise.all(
      files.map(async (file) => {
        // Buat URL akses publik untuk setiap file
        const [url] = await file.getSignedUrl({
          action: "read",
          expires: "03-01-2500", // Sesuaikan tanggal kedaluwarsa sesuai kebutuhan
        });

        // Ambil metadata file, termasuk tanggal
        const metadata = await file.getMetadata();
        const date = metadata[0].updated; // Tanggal terakhir diperbarui

        return { url, date };
      })
    );

    console.log(`Detail hasil edit untuk orderId ${orderId}:`, fileDetails);
    return fileDetails; // Kembalikan array objek dengan URL dan tanggal
  } catch (error) {
    console.error(
      `Error saat mengambil URL hasil edit untuk orderId ${orderId}:`,
      error
    );
    return [];
  }
}

// Fungsi utama untuk memperbarui data di Firebase
async function updateOrdersData() {
  const ordersRef = db.ref("SUHAT/orders"); // Mengambil referensi dari SUHAT/orders
  const snapshot = await ordersRef.once("value");
  const ordersData = snapshot.val();

  if (!ordersData) {
    console.log("Tidak ada data order.");
    return;
  }

  console.log("Memulai pembaruan data untuk setiap order...");

  for (const orderId in ordersData) {
    console.log(`Memproses data untuk orderId: ${orderId}`);
    const orderData = ordersData[orderId];

    const currentStatus = orderData.status || "unknown";
    const hasilEdit = orderData.hasilEdit || [];
    console.log("Status : ", currentStatus);
    const timestampEditting = orderData.timestamp_editting;

    // Hitung jumlah foto
    const imageCount = await countImageFiles(orderId);

    // Fungsi untuk menghitung deadline berdasarkan timestamp_editting dan hasilEdit
    const calculateDeadline = (timestampEditting, hasilEdit) => {
      if (!timestampEditting) {
        return { deadlineMessage: "Belum Pilih Editor", daysLeft: 0 };
      }

      const editingTimestamp = parseTimestamp(timestampEditting).startOf("day");
      const deadlineDate = editingTimestamp.add(7, "days");

      if (hasilEdit.length === 0) {
        const currentMoment = moment.tz("Asia/Jakarta").startOf("day");

        const daysLeft = deadlineDate.diff(currentMoment, "days");

        let deadlineMessage;
        if (daysLeft > 0) {
          deadlineMessage = `${timestampEditting}`;
        } else if (daysLeft === 0) {
          deadlineMessage = "Hari ini";
        } else {
          deadlineMessage = `Telat ${Math.abs(daysLeft)} hari`;
        }

        return { deadlineMessage, daysLeft };
      }

      const earliestEditDate = hasilEdit
        .map((edit) => moment(edit.date))
        .sort((a, b) => a - b)[0];

      if (!earliestEditDate) {
        return { deadlineMessage: "Belum Diedit", daysLeft: 0 };
      }

      console.log("Hasil : ", earliestEditDate);
      console.log("Deadline : ", deadlineDate);

      const daysDifference = deadlineDate.diff(earliestEditDate, "days");

      console.log("Result", daysDifference);

      let deadlineMessage;
      if (daysDifference > 0) {
        deadlineMessage = "Awal Waktu";
      } else if (daysDifference === 0) {
        deadlineMessage = "Tepat Waktu";
      } else {
        deadlineMessage = `Telat ${Math.abs(daysDifference)} hari`;
      }

      return { deadlineMessage, daysLeft: daysDifference };
    };

    const { deadlineMessage, daysLeft } = calculateDeadline(
      timestampEditting,
      hasilEdit
    );

    // Logika untuk hasilEdit yang sudah ada
    if (hasilEdit.length > 0 && daysLeft < 0) {
      console.log(
        `OrderId ${orderId} memiliki hasil edit dan sudah telat. Tidak ada pembaruan.`
      );
      continue;
    }

    console.log(currentStatus, daysLeft);

    const updatedDeadline = deadlineMessage || "Belum Dihitung";

    // Tetap menyimpan URL dan date hasil edit jika ada
    const hasilEditData = hasilEdit.map((edit) => ({
      url: edit.url,
      date: edit.date,
    }));

    // Update data order dengan hanya menambahkan totalFoto, deadline, dan hasilEdit
    const updatedOrder = {
      totalFoto: imageCount,
      deadline: updatedDeadline,
      hasilEdit: hasilEditData,
    };

    console.log(`Menyimpan pembaruan untuk orderId: ${orderId}`);

    // Simpan kembali data yang telah diperbarui ke Firebase tanpa mengubah data lain
    await ordersRef.child(orderId).update(updatedOrder);
    console.log(`Data untuk orderId ${orderId} telah diperbarui.`);
  }

  console.log("Data orders telah diperbarui.");
}

// Fungsi untuk menjalankan update setiap menit setelah proses sebelumnya selesai
async function startPeriodicUpdates() {
  while (true) {
    console.log("Memulai pembaruan data setiap menit...");
    await updateOrdersData().catch(console.error); // Menunggu sampai pembaruan selesai
    console.log(
      "Pembaruan selesai. Menunggu 1 menit sebelum pembaruan berikutnya."
    );
    await new Promise((resolve) => setTimeout(resolve, 60000)); // Tunggu 1 menit
  }
}

// Mulai proses pembaruan yang berjalan terus-menerus
startPeriodicUpdates();
