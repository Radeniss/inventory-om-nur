import { getServerSession } from "next-auth/next";
import clientPromise from '../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  // 1. Cek sesi login
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Akses ditolak." });
  }

  // 2. Dapatkan ID pengguna
  const userId = new ObjectId(session.user.id);
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ message: 'Mohon tentukan bulan dan tahun' });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const salesCollection = db.collection('sales');

    const monthInt = parseInt(month);
    const yearInt = parseInt(year);

    const report = await salesCollection.aggregate([
      // Tahap 1: Filter penjualan HANYA milik pengguna yang login
      {
        $match: {
          userId: userId,
        }
      },
      // Tahap 2: Filter berdasarkan bulan dan tahun
      {
        $match: {
          $expr: {
            $and: [
              { $eq: [{ $year: '$saleTimestamp' }, yearInt] },
              { $eq: [{ $month: '$saleTimestamp' }, monthInt] },
            ],
          },
        },
      },
      // Tahap 3: Kelompokkan berdasarkan nama produk dan jumlahkan penjualannya
      {
        $group: {
          _id: '$productName',
          totalSold: { $sum: '$quantitySold' },
        },
      },
      // Tahap 4: Ubah format output
      {
        $project: {
          _id: 0,
          productName: '$_id',
          totalSold: '$totalSold',
        },
      },
      // Tahap 5: Urutkan
      {
        $sort: {
          totalSold: -1,
        },
      },
    ]).toArray();

    res.status(200).json(report);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
}