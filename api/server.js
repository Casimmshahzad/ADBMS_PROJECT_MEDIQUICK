const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. MODELS ---
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['customer', 'shopkeeper'], required: true },
    pharmacyName: String,
    location: String,
    savedMeds: [{
        medName: String,
        qty: Number,
        daily: Number,
        lastUpdated: { type: Date, default: Date.now }
    }]
}));

const Medicine = mongoose.model('Medicine', new mongoose.Schema({
    name: { type: String, required: true },
    price: Number,
    pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pharmacyName: String,
    location: String
}));

const Reservation = mongoose.model('Reservation', new mongoose.Schema({
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pharmacyId: String,
    createdAt: { type: Date, default: Date.now, expires: 3600 } 
}));

// --- 2. DB CONNECTION ---
mongoose.connect(process.env.MONGO_URI).then(() => console.log("✅ DB Connected"));

// --- 3. AUTH ---
app.post('/register', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.json({ message: "Success" });
    } catch (err) { res.status(400).json({ message: "User exists" }); }
});

app.post('/login', async (req, res) => {
    const user = await User.findOne({ username: req.body.username, password: req.body.password });
    user ? res.json({ user }) : res.status(401).json({ message: "Invalid credentials" });
});

// --- 4. SHOPKEEPER LOGIC ---
app.post('/add-medicine', async (req, res) => {
    const { name, price, pharmacyId, pharmacyName, location } = req.body;
    const newMed = new Medicine({ name, price, pharmacyId, pharmacyName, location });
    await newMed.save();
    res.json({ message: "Added!" });
});

app.get('/search', async (req, res) => {
    const { name, pharmacyId } = req.query;
    let query = {};
    if (name) query.name = { $regex: name, $options: 'i' };
    if (pharmacyId) query.pharmacyId = pharmacyId;
    const results = await Medicine.find(query);
    res.json(results);
});

// --- 5. RESERVATION LOGIC ---
app.post('/reserve', async (req, res) => {
    try {
        const { userId, medicineId } = req.body;
        const med = await Medicine.findById(medicineId);
        const newRes = new Reservation({ 
            userId, 
            medicineId, 
            pharmacyId: med.pharmacyId.toString() // Ensure it's a string
        });
        await newRes.save();
        res.json({ message: "Reserved!" });
    } catch (err) { res.status(500).json({ message: "Error" }); }
});

app.get('/reservations/pharmacy/:pharmacyId', async (req, res) => {
    const list = await Reservation.find({ pharmacyId: req.params.pharmacyId })
        .populate('userId', 'username')
        .populate('medicineId', 'name price');
    res.json(list);
});

app.get('/reservations/customer/:userId', async (req, res) => {
    const list = await Reservation.find({ userId: req.params.userId }).populate('medicineId');
    res.json(list);
});

app.delete('/reserve/:id', async (req, res) => {
    await Reservation.findByIdAndDelete(req.params.id);
    res.json({ message: "Cleared" });
});

// --- 6. TRACKER ---
app.post('/save-track', async (req, res) => {
    const user = await User.findByIdAndUpdate(req.body.userId, { $push: { savedMeds: req.body } }, { new: true });
    res.json(user.savedMeds);
});

// --- 7. SERVER PORT BINDING ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
