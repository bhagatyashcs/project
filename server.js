const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());
// This line handles the weird filename issue you have in GitHub
app.use(express.static(path.join(__dirname, 'public')));

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => console.log("✅ Cloud DB Connected"))
  .catch(err => console.error("❌ DB Error:", err));

// SCHEMAS (Keep your existing schemas here)
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    securityAnswer: { type: String, required: true } 
});
const User = mongoose.model('User', UserSchema);

// AUTH ROUTES (Using relative paths)
app.post('/signup', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = new User({ username: req.body.username, password: hashedPassword, securityAnswer: req.body.securityAnswer });
        await user.save();
        res.json({ message: "Success" });
    } catch (err) { res.status(400).json({ error: "User exists" }); }
});

app.post('/login', async (req, res) => {
    const user = await User.findOne({ username: req.body.username });
    if (!user || !await bcrypt.compare(req.body.password, user.password)) {
        return res.status(400).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token, username: user.username });
});

// FILE ROUTES (Point directly to your filenames)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/landing.html')));
app.get('/expense.html', (req, res) => res.sendFile(path.join(__dirname, 'public/expense.html')));
app.get('/invest.html', (req, res) => res.sendFile(path.join(__dirname, 'public/invest.html')));

module.exports = app;
