const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
    name: { type: String, required: true },
    brand: { type: String, required: true },
    pharmacyName: { type: String, required: true },
    price: { type: Number, required: true },
    location: { type: String, required: true }, // e.g. "Johar Town"
    stockStatus: { type: String, default: "Available" }
});

module.exports = mongoose.model('Medicine', MedicineSchema);