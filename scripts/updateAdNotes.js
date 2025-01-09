const mongoose = require('mongoose');
const Ad = require('../models/Ad');

async function updateAdNotes() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://bagasi:bagasi123!@cluster0.clcx5.mongodb.net/mule-marketplace?retryWrites=true&w=majority');

    const adId = '67795a33a05a63b65fe2e05c';

    const notes = `Detail Rute:
Jadwal:
📍 Medan - Perth: 14 Januari 2025
📍 Drop off: 13 Januari 2025

Lokasi:
🔄 Drop off: Warkop Agam (Gaperta), Medan
📍 Pick up: Balga, Perth

Layanan:
✅ Bersedia di-unpack, diperiksa, dan dikemas ulang
✅ Barang akan dicek dan dikemas ulang
✅ Pembulatan ke atas untuk berat dan volume barang
❗ Pick up ke lokasi dikenakan biaya tambahan

Catatan Penting:
❗ Barang yang tidak memenuhi persyaratan bea cukai menjadi tanggung jawab penitip (disita, denda dll)
❗ Barang yang rusak/cacat karena penanganan yang tidak baik oleh petugas bandara menjadi tanggungan penitip
❗ Termasuk makanan, minuman dan sejenisnya (tidak fresh, basi dll)
❗ Mohon infonya jika barang titipan tersebut harus dideclare
❗ Nama penerima barang beserta nomor telepon di bandara tujuan wajib dicantumkan`;

    // Update the ad notes
    const result = await Ad.findByIdAndUpdate(
      adId,
      { 
        additionalNotes: notes,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (result) {
      console.log('Ad notes updated successfully');
    } else {
      console.log('Ad not found');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateAdNotes();
