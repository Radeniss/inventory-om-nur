import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const productsCollection = db.collection('products');

    if (req.method === 'GET') {
      const products = await productsCollection.find({}).sort({ name: 1 }).toArray();
      res.status(200).json(products);

    } else if (req.method === 'POST') {
      const { qrCode, name, quantity } = req.body;

      if (!qrCode || !name || !quantity) {
        return res.status(400).json({ message: 'Data tidak lengkap' });
      }

      const existingProduct = await productsCollection.findOne({ qrCode: qrCode });

      if (existingProduct) {
        await productsCollection.updateOne(
          { qrCode: qrCode },
          { $inc: { stock: parseInt(quantity, 10) } }
        );
        res.status(200).json({ message: `Stok untuk ${name} berhasil diperbarui` });
      } else {
        await productsCollection.insertOne({
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