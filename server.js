const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());

// This tells the server: "If you see a file named /public/X, serve it"
app.use(express.static(__dirname));

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI).then(() => console.log("DB Connected"));

const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    securityAnswer: { type: String, required: true } 
}));

// LOGIN ROUTE
app.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username });
        if (!user || !await bcrypt.compare(req.body.password, user.password)) {
            return res.status(400).json({ error: "Invalid login" });
        }
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '2h' });
        res.json({ token, username: user.username });
    } catch (e) { res.status(500).json({ error: "Server Error" }); }
});

// FILE SERVING - We use your EXACT GitHub filenames here
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '/public/landing.html')));
app.get('/expense', (req, res) => res.sendFile(path.join(__dirname, '/public/expense.html')));
app.get('/invest', (req, res) => res.sendFile(path.join(__dirname, '/public/invest.html')));

module.exports = app;
