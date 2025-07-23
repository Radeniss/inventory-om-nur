import { useState, useEffect, useCallback } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import QrScanner from '../components/QrScanner'; 

// --- Komponen SalesReport ---
type SalesReportItem = { productName: string; totalSold: number; };
const SalesReport = () => {
    const [report, setReport] = useState<SalesReportItem[]>([]);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(false);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/sales-report?month=${month}&year=${year}`);
            if (response.ok) setReport(await response.json());
            else setReport([]);
        } catch (error) { console.error('Error:', error); } 
        finally { setLoading(false); }
    }, [month, year]);

    useEffect(() => { fetchReport(); }, [fetchReport]);

    return (
        <div className="mt-12 p-4 border rounded-lg bg-gray-50">
            <h2 className="text-xl font-bold mb-4">📊 Laporan Penjualan</h2>
            <div className="flex flex-wrap items-center gap-4 mb-4">
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="p-2 border rounded-md">
                    {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>)}
                </select>
                <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="p-2 border rounded-md w-28" />
                <button onClick={fetchReport} disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400">
                    {loading ? 'Memuat...' : 'Terapkan Filter'}
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="border p-2">Nama Produk</th>
                            <th className="border p-2 text-center">Total Terjual</th>
                        </tr>
                    </thead>
                    <tbody>
                        {report.length > 0 ? report.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-100">
                                <td className="border p-2">{item.productName}</td>
                                <td className="border p-2 text-center font-semibold">{item.totalSold}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan={2} className="border p-2 text-center">Tidak ada data penjualan.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Komponen Utama ---
type Product = { _id: string; name: string; qrCode: string; stock: number };
type MessageType = 'info' | 'success' | 'error';

export default function HomePage() {
    const { data: session, status } = useSession();

    // State untuk aplikasi inventaris
    const [mode, setMode] = useState<'sell' | 'stock-in'>('sell');
    const [scannedResult, setScannedResult] = useState('');
    const [message, setMessage] = useState<{ text: string; type: MessageType }>({ text: '', type: 'info' });
    const [products, setProducts] = useState<Product[]>([]);
    const [showScanner, setShowScanner] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemQuantity, setNewItemQuantity] = useState(1);

    // State untuk form login
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    
    const fetchProducts = useCallback(async () => {
        try {
            const res = await fetch('/api/stock');
            if (res.ok) {
                const data = await res.json();
                setProducts(Array.isArray(data) ? data : []);
            } else {
                setProducts([]);
            }
        } catch (error) {
            console.error("Gagal fetch produk:", error);
            setMessage({text: 'Gagal memuat daftar produk.', type: 'error'})
        }
    }, []);

    useEffect(() => {
        if (status === "authenticated") {
            fetchProducts();
        }
    }, [status, fetchProducts]);

    const showMessage = (text: string, type: MessageType = 'info') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: 'info' }), 4000);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        showMessage('Mencoba login...', 'info');
        const result = await signIn('credentials', {
            redirect: false,
            email: loginEmail,
            password: loginPassword,
        });

        if (result?.error) {
            showMessage(result.error, 'error');
        } else {
            showMessage('Login berhasil!', 'success');
        }
    };
    
    const handleScanResult = (result: string) => {
        setShowScanner(false); 
        if (result) {
            setScannedResult(result);
            if (mode === 'sell') handleSell(result);
        }
    };

    const handleSell = async (qrCode: string) => {
        showMessage('Memproses penjualan...', 'info');
        try {
            const response = await fetch('/api/sell', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ qrCode }) });
            const data = await response.json();
            showMessage(data.message, response.ok ? 'success' : 'error');
            if (response.ok) fetchProducts();
        } catch (error) { 
          console.error(error);
          showMessage('Error: Terjadi kesalahan pada server.', 'error'); 
}
        setScannedResult('');
    };

    const handleStockIn = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        showMessage('Menambah stok...', 'info');
        try {
            const response = await fetch('/api/stock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ qrCode: scannedResult, name: newItemName, quantity: newItemQuantity }) });
            const data = await response.json();
            showMessage(data.message, response.ok ? 'success' : 'error');
            if (response.ok) {
                fetchProducts();
                setScannedResult('');
                setNewItemName('');
                setNewItemQuantity(1);
            }
        } catch (error) {
          console.error(error);
          showMessage('Error: Terjadi kesalahan pada server.', 'error'); 
}
    };

    const messageStyles: { [key in MessageType]: string } = {
        info: 'bg-blue-100 border-blue-400 text-blue-700',
        success: 'bg-green-100 border-green-400 text-green-700',
        error: 'bg-red-100 border-red-400 text-red-700',
    };

    if (status === "loading") {
        return <p className="text-center mt-20 text-lg">Memuat...</p>;
    }

    if (status === "unauthenticated") {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                    <h1 className="text-2xl font-bold text-center">Login Inventaris</h1>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="email-login" className="block text-sm font-medium text-gray-700">Email</label>
                            <input id="email-login" type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full px-3 py-2 mt-1 border rounded-md"/>
                        </div>
                        <div>
                            <label htmlFor="password-login" className="block text-sm font-medium text-gray-700">Password</label>
                            <input id="password-login" type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full px-3 py-2 mt-1 border rounded-md"/>
                        </div>
                        <div>
                            <button type="submit" className="w-full px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                                Login
                            </button>
                        </div>
                    </form>
                    {message.text && (<p className={`text-center text-sm mt-4 p-2 rounded-md ${messageStyles[message.type]}`}>{message.text}</p>)}
                    <p className="text-sm text-center text-gray-600">
                        Belum punya akun?{' '}
                        <Link href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
                            Daftar di sini
                        </Link>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <main className="container mx-auto p-4 font-sans">
            <header className="flex justify-between items-center mb-6 pb-4 border-b">
                <p>Login sebagai: <strong>{session?.user?.email}</strong></p>
                <button onClick={() => signOut()} className="bg-gray-500 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-600 transition">
                    Logout
                </button>
            </header>
            <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">🏪 Sistem Inventaris Toko</h1>
            <div className="flex justify-center gap-4 mb-4">
                <button onClick={() => { setMode('sell'); setShowScanner(true); setScannedResult(''); }} className={`px-6 py-2 rounded-lg font-semibold shadow-sm transition-transform transform hover:scale-105 ${mode === 'sell' ? 'bg-red-500 text-white' : 'bg-white text-gray-700 border'}`}>
                    🛒 Jual Barang
                </button>
                <button onClick={() => { setMode('stock-in'); setShowScanner(true); setScannedResult(''); }} className={`px-6 py-2 rounded-lg font-semibold shadow-sm transition-transform transform hover:scale-105 ${mode === 'stock-in' ? 'bg-green-500 text-white' : 'bg-white text-gray-700 border'}`}>
                    📦 Tambah Stok
                </button>
            </div>
            {message.text && (<p className={`text-center my-4 p-3 border rounded-md ${messageStyles[message.type]}`}>{message.text}</p>)}
            {showScanner && (
                <div className="max-w-md mx-auto my-4 p-2 border-2 border-dashed rounded-lg">
                    <QrScanner onScanSuccess={handleScanResult} onClose={() => setShowScanner(false)} />
                </div>
            )}
            {mode === 'stock-in' && scannedResult && (
                <form onSubmit={handleStockIn} className="max-w-md mx-auto p-6 border rounded-lg shadow-md bg-white">
                    <h3 className="text-lg font-bold mb-2">Form Tambah Stok</h3>
                    <p className="mb-4 p-2 bg-gray-100 rounded break-words"><strong>QR Code:</strong> {scannedResult}</p>
                    <div className="mb-4">
                        <label htmlFor="name" className="block mb-1 font-medium text-gray-700">Nama Produk</label>
                        <input id="name" type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="w-full p-2 border rounded-md" placeholder="Contoh: Kopi Sachet ABC" required />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="quantity" className="block mb-1 font-medium text-gray-700">Jumlah</label>
                        <input id="quantity" type="number" min="1" value={newItemQuantity} onChange={(e) => setNewItemQuantity(Number(e.target.value))} className="w-full p-2 border rounded-md" required />
                    </div>
                    <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md">Simpan ke Inventaris</button>
                </form>
            )}
            <div className="mt-12">
                <h2 className="text-2xl font-bold mb-4">📦 Inventaris Saat Ini</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.length > 0 ? products.map(product => (
                        <div key={product._id} className="border p-4 rounded-lg shadow-sm bg-white">
                            <h3 className="font-bold text-lg text-gray-800">{product.name}</h3>
                            <p className="text-gray-500 break-words text-sm mt-1">QR: {product.qrCode}</p>
                            <p className="text-3xl font-bold mt-2 text-indigo-600">Stok: {product.stock}</p>
                        </div>
                    )) : (<p className='text-gray-500'>Inventaris Anda kosong.</p>)}
                </div>
            </div>
            {products.length > 0 && <SalesReport />}
        </main>
    );
}