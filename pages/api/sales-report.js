import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).end('Method Not Allowed');
  }

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
      // Tahap 1: Filter dokumen berdasarkan bulan dan tahun
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
      // Tahap 2: Kelompokkan berdasarkan nama produk dan jumlahkan penjualannya
      {
        $group: {
          _id: '$productName',
          totalSold: { $sum: '$quantitySold' },
        },
      },
      // Tahap 3: Ubah format output agar lebih mudah dibaca
      {
        $project: {
          _id: 0,
          productName: '$_id',
          totalSold: '$totalSold',
        },
      },
      // Tahap 4: Urutkan dari yang paling banyak terjual
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