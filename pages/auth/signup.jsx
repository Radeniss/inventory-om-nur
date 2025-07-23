import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const SignupPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('Mendaftarkan...');

        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        setLoading(false);

        if (!response.ok) {
            setMessage(data.message || 'Terjadi kesalahan.');
        } else {
            setMessage('Pendaftaran berhasil! Anda akan dialihkan...');
            setTimeout(() => {
                router.push('/'); // Arahkan ke halaman utama untuk login
            }, 2000);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center">Buat Akun Baru</h1>
                <form onSubmit={handleSignup} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Alamat Email</label>
                        <input id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input id="password" name="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <button type="submit" disabled={loading} className="w-full px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400">
                            {loading ? 'Memproses...' : 'Daftar'}
                        </button>
                    </div>
                </form>
                {message && <p className="text-center text-sm text-gray-600 mt-4">{message}</p>}
                <p className="text-sm text-center text-gray-600">
                    Sudah punya akun?{' '}
                    <Link href="/" className="font-medium text-blue-600 hover:text-blue-500">
                        Login di sini
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default SignupPage;