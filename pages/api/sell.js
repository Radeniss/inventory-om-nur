import clientPromise from '../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const { qrCode } = req.body;
  if (!qrCode) {
    return res.status(400).json({ message: 'QR Code tidak ditemukan' });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const productsCollection = db.collection('products');
    const salesCollection = db.collection('sales');

    const product = await productsCollection.findOne({ qrCode: qrCode });

    if (!product) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }
    if (product.stock <= 0) {
      return res.status(400).json({ message: 'Stok produk habis!' });
    }

    // Kurangi stok produk
    await productsCollection.updateOne(
      { _id: product._id },
      { $inc: { stock: -1 } }
    );

    // Catat penjualan baru
    await salesCollection.insertOne({
      productId: product._id,
      productName: product.name,
      qrCode: product.qrCode,
      quantitySold: 1,
      saleTimestamp: new Date(), // Simpan sebagai BSON date untuk query yang lebih baik
    });

    res.status(200).json({ message: `Penjualan ${product.name} berhasil` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
}