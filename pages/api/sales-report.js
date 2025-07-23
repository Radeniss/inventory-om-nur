import fs from 'fs';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'data', 'db.json');
const readDb = () => JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).end('Method Not Allowed');
    }

    const { month, year } = req.query;
    if (!month || !year) {
        return res.status(400).json({ message: 'Mohon tentukan bulan dan tahun' });
    }

    try {
        const db = readDb();
        const filteredSales = db.sales.filter(sale => {
            const saleDate = new Date(sale.saleTimestamp);
            return (saleDate.getMonth() + 1) == month && saleDate.getFullYear() == year;
        });

        const report = filteredSales.reduce((acc, sale) => {
            if (!acc[sale.productId]) {
                acc[sale.productId] = {
                    productName: sale.productName,
                    totalSold: 0
                };
            }
            acc[sale.productId].totalSold += sale.quantitySold;
            return acc;
        }, {});

        const finalReport = Object.values(report).sort((a, b) => b.totalSold - a.totalSold);
        res.status(200).json(finalReport);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil laporan penjualan.' });
    }
}