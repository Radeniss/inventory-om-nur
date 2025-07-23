import { getServerSession } from "next-auth/next";
import clientPromise from '../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Akses ditolak. Silakan login." });
  }

  const userId = new ObjectId(session.user.id);
  
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const productsCollection = db.collection('products');

    if (req.method === 'GET') {
      const products = await productsCollection.find({ userId: userId }).sort({ name: 1 }).toArray();
      res.status(200).json(products);
    } else if (req.method === 'POST') {
      const { qrCode, name, quantity } = req.body;
      if (!qrCode || !name || !quantity) {
        return res.status(400).json({ message: 'Data tidak lengkap' });
      }

      const filter = { qrCode: qrCode, userId: userId };
      const existingProduct = await productsCollection.findOne(filter);

      if (existingProduct) {
        await productsCollection.updateOne(filter, { $inc: { stock: parseInt(quantity, 10) } });
        res.status(200).json({ message: `Stok untuk ${name} berhasil diperbarui` });
      } else {
        await productsCollection.insertOne({
          userId: userId,
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