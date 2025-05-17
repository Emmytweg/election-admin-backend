const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

dotenv.config(); // Make sure to load env variables

const app = express();
const port = process.env.PORT || 5000; // Declare const properly

// Middleware
app.use(cors());
app.use(express.json());

// === MongoDB Connection ===
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// === Admin Schema ===
const Admin = mongoose.model('Admin', new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  password: { type: String, required: true },
}));

// === Routes ===
app.get('/', (req, res) => {
    res.json({message: 'Welcome to the Election API'});
    })
// Admin Signup

app.post('/admin/signup', async (req, res) => {
  try {
    const { username, fullName, password } = req.body;

    if (!username || !fullName || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existing = await Admin.findOne({ username });
    if (existing) {
      return res.status(400).json({ message: 'Username already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ username, fullName, password: hashedPassword });

    await newAdmin.save();
    const { password: _, ...adminWithoutPassword } = newAdmin.toObject();
    res.status(201).json({ message: 'Admin registered successfully', admin: adminWithoutPassword });

  } catch (err) {
    console.error('❌ Admin Signup Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Admin Login
app.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Missing username or password' });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const { password: _, ...adminData } = admin.toObject();
    res.status(200).json({ admin: adminData });

  } catch (err) {
    console.error('❌ Admin Login Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// === Start Server ===
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
