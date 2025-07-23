import fs from 'fs';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'data', 'db.json');
const readDb = () => JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
const writeDb = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const { qrCode } = req.body;
  if (!qrCode) {
    return res.status(400).json({ message: 'QR Code tidak ditemukan' });
  }

  try {
    const db = readDb();
    const productIndex = db.products.findIndex(p => p.qrCode === qrCode);

    if (productIndex === -1) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }
    if (db.products[productIndex].stock <= 0) {
      return res.status(400).json({ message: 'Stok produk habis!' });
    }

    db.products[productIndex].stock -= 1;
    db.sales.push({
      id: `SALE-${Date.now()}`,
      productId: db.products[productIndex].id,
      qrCode: qrCode,
      productName: db.products[productIndex].name,
      quantitySold: 1,
      saleTimestamp: new Date().toISOString(),
    });

    writeDb(db);
    res.status(200).json({ message: `Penjualan ${db.products[productIndex].name} berhasil` });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memproses penjualan.' });
  }
}