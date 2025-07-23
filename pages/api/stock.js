import fs from 'fs';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'data', 'db.json');

const readDb = () => {
  const fileContent = fs.readFileSync(dbPath, 'utf-8');
  return JSON.parse(fileContent);
};

const writeDb = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

export default function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const db = readDb();
      res.status(200).json(db.products);
    } catch (error) {
      res.status(500).json({ message: 'Gagal membaca data produk.' });
    }
  } else if (req.method === 'POST') {
    const { qrCode, name, quantity } = req.body;
    if (!qrCode || !name || !quantity) {
      return res.status(400).json({ message: 'Data tidak lengkap' });
    }

    try {
      const db = readDb();
      const existingProductIndex = db.products.findIndex(p => p.qrCode === qrCode);

      if (existingProductIndex > -1) {
        db.products[existingProductIndex].stock += parseInt(quantity, 10);
      } else {
        db.products.push({
          id: `PROD-${Date.now()}`,
          qrCode,
          name,
          stock: parseInt(quantity, 10),
        });
      }

      writeDb(db);
      res.status(201).json({ message: 'Stok berhasil diperbarui' });
    } catch (error) {
      res.status(500).json({ message: 'Gagal menulis data ke database.' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}