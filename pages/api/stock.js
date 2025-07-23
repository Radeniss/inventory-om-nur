import { getServerSession } from "next-auth/next";
import clientPromise from '../../lib/mongodb';
import { ObjectId } from 'mongodb';
// Impor authOptions dari file [...nextauth].js Anda
import { authOptions } from "./auth/[...nextauth]"; 

export default async function handler(req, res) {
  // Cek sesi login pengguna
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Akses ditolak. Silakan login." });
  }

  // Dapatkan ID pengguna dari sesi
  const userId = new ObjectId(session.user.id);
  
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const productsCollection = db.collection('products');

    if (req.method === 'GET') {
      // Ambil produk HANYA untuk userId yang sedang login
      const products = await productsCollection.find({ userId: userId }).sort({ name: 1 }).toArray();
      res.status(200).json(products);

    } else if (req.method === 'POST') {
      const { qrCode, name, quantity } = req.body;
      if (!qrCode || !name || !quantity) {
        return res.status(400).json({ message: 'Data tidak lengkap' });
      }

      // Filter berdasarkan userId dan qrCode
      const filter = { qrCode: qrCode, userId: userId };
      const existingProduct = await productsCollection.findOne(filter);

      if (existingProduct) {
        await productsCollection.updateOne(
          filter,
          { $inc: { stock: parseInt(quantity, 10) } }
        );
        res.status(200).json({ message: `Stok untuk ${name} berhasil diperbarui` });
      } else {
        await productsCollection.insertOne({
          userId: userId, // Pastikan userId disimpan saat membuat produk baru
          qrCode,
          name,
          stock: parseInt(quantity, 10),
        });
        res.status(201).json({ message: `Produk ${name} berhasil ditambahkan` });
      }
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
}