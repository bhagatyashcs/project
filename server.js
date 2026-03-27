const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());

// Priority: Use Environment Variables for Security
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_123';
const MONGODB_URI = process.env.MONGODB_URI; 

// Connect to MongoDB Atlas
mongoose.connect(MONGODB_URI)
  .then(() => console.log("✅ Cloud Database Connected"))
  .catch(err => console.error("❌ DB Connection Error:", err));

// User Schema
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    securityAnswer: { type: String, required: true } 
}));

// AUTH ROUTES (Using Relative Paths for Vercel)
app.post('/signup', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = new User({ 
            username: req.body.username, 
            password: hashedPassword, 
            securityAnswer: req.body.securityAnswer 
        });
        await user.save();
        res.json({ message: "User created" });
    } catch (err) { res.status(400).json({ error: "User already exists" }); }
});

app.post('/login', async (req, res) => {
    const user = await User.findOne({ username: req.body.username });
    if (!user || !await bcrypt.compare(req.body.password, user.password)) {
        return res.status(400).json({ error: "Invalid username or password" });
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token, username: user.username });
});

// FILE SERVING (Mapping to your specific GitHub structure)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/landing.html')));
app.get('/expense', (req, res) => res.sendFile(path.join(__dirname, 'public/expense.html')));
app.get('/invest', (req, res) => res.sendFile(path.join(__dirname, 'public/invest.html')));

// Fallback for static assets
app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;
