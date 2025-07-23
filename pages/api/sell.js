import { getServerSession } from "next-auth/next";
import clientPromise from '../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Akses ditolak." });
  }

  const userId = new ObjectId(session.user.id);
  const { qrCode } = req.body;

  if (!qrCode) {
    return res.status(400).json({ message: 'QR Code tidak ditemukan' });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const productsCollection = db.collection('products');
    const salesCollection = db.collection('sales');

    const product = await productsCollection.findOne({ qrCode: qrCode, userId: userId });

    if (!product) {
      return res.status(404).json({ message: 'Produk tidak ditemukan di inventaris Anda' });
    }
    if (product.stock <= 0) {
      return res.status(400).json({ message: 'Stok produk habis!' });
    }

    await productsCollection.updateOne(
      { _id: product._id, userId: userId },
      { $inc: { stock: -1 } }
    );

    await salesCollection.insertOne({
      userId: userId,
      productId: product._id,
      productName: product.name,
      qrCode: product.qrCode,
      quantitySold: 1,
      saleTimestamp: new Date(),
    });

    res.status(200).json({ message: `Penjualan ${product.name} berhasil` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
}