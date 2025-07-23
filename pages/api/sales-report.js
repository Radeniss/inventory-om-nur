import { getServerSession } from "next-auth/next";
import clientPromise from '../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Akses ditolak." });
  }

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
      {
        $match: {
          userId: userId,
        }
      },
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
      {
        $group: {
          _id: '$productName',
          totalSold: { $sum: '$quantitySold' },
        },
      },
      {
        $project: {
          _id: 0,
          productName: '$_id',
          totalSold: '$totalSold',
        },
      },
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