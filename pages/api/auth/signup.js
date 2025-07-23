import { hash } from 'bcrypt';
import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !email.includes('@') || !password || password.trim().length < 6) {
    return res.status(422).json({ message: 'Input tidak valid. Password minimal 6 karakter.' });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    
    const existingUser = await db.collection('users').findOne({ email: email });
    if (existingUser) {
      return res.status(422).json({ message: 'Email ini sudah terdaftar!' });
    }

    const hashedPassword = await hash(password, 12);

    await db.collection('users').insertOne({
      email: email,
      password: hashedPassword,
    });

    res.status(201).json({ message: 'Pengguna berhasil dibuat!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal membuat pengguna.' });
  }
}