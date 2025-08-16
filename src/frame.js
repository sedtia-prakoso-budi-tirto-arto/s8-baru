import Papa from "papaparse";

// Fungsi untuk membaca CSV dan mengonversinya menjadi array objek
function loadImageMapsData(csvFilePath) {
  return new Promise((resolve, reject) => {
    Papa.parse(csvFilePath, {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: function (result) {
        const data = result.data;
        const groupedData = {};

        // Kelompokkan data berdasarkan imageSrc dan mapName
        data.forEach((item) => {
          // Periksa apakah coords ada dan valid sebelum melakukan split
          if (item.coords && item.coords.includes(",")) {
            // Memastikan coords dipisah menjadi array 4 angka
            const coordsArray = item.coords
              .split(",")
              .map((coord) => parseInt(coord.trim(), 10));

            if (!groupedData[item.imageSrc]) {
              groupedData[item.imageSrc] = {
                imageSrc: item.imageSrc,
                mapName: item.mapName,
                areas: [],
              };
            }

            groupedData[item.imageSrc].areas.push({
              shape: item.shape,
              coords: coordsArray, // Menyimpan coords sebagai array
              alt: item.alt,
              title: item.title,
            });
          } else {
            console.warn(
              `Koordinat tidak valid untuk ${item.imageSrc}, ${item.mapName}`
            );
          }
        });

        // Konversi groupedData menjadi array
        const imageMapsData = Object.values(groupedData);
        resolve(imageMapsData);
      },
      error: function (error) {
        reject(error);
      },
    });
  });
}

// Fungsi untuk mengubah koordinat berdasarkan skala
function scaleCoords(
  coords,
  originalWidth,
  originalHeight,
  newWidth,
  newHeight
) {
  const scaleX = newWidth / originalWidth;
  const scaleY = newHeight / originalHeight;

  // Pastikan koordinat dalam bentuk string
  if (typeof coords !== "string") {
    console.warn("Koordinat tidak dalam format string. Mengubah ke string.");
    coords = coords.toString();
  }

  // Pisahkan string menjadi array angka, ubah skalanya, lalu gabungkan kembali
  return coords
    .split(",")
    .map((coord, index) => {
      const numericCoord = parseFloat(coord); // Konversi ke angka
      if (isNaN(numericCoord)) {
        console.error(`Koordinat '${coord}' bukan angka yang valid.`);
        return 0; // Mengembalikan nilai default jika koordinat tidak valid
      }
      return index % 2 === 0
        ? Math.round(numericCoord * scaleX) // Skala untuk X
        : Math.round(numericCoord * scaleY); // Skala untuk Y
    })
    .join(","); // Gabungkan kembali menjadi string
}

// Fungsi untuk mengakses data koordinat yang sudah di-scale
function getCoords(
  mapName,
  originalWidth,
  originalHeight,
  newWidth,
  newHeight
) {
  const mapData = imageMapsData.find((map) => map.mapName === mapName);
  if (!mapData) {
    console.warn(`Frame dengan nama '${mapName}' tidak ditemukan.`);
    return [];
  }

  return mapData.areas.map((area) =>
    scaleCoords(area.coords, originalWidth, originalHeight, newWidth, newHeight)
  );
}

// --- Memuat data dari CSV saat aplikasi dimulai ---
let imageMapsData = [];
loadImageMapsData("../src/frame.csv") // Sesuaikan dengan path CSV kamu
  .then((data) => {
    imageMapsData = data;
    console.log("Data gambar berhasil dimuat:", imageMapsData);
  })
  .catch((error) => {
    console.error("Terjadi kesalahan saat memuat data gambar:", error);
  });

// Ekspor data dan fungsi agar dapat diakses oleh script luar
export { imageMapsData, getCoords };
