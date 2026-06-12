const mongoose = require('mongoose');
require('dotenv').config();
const Medicine = require('./models/Medicine');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("Connected for seeding...");
        
        // Optional: Clears old data so you don't have 10 copies of Panadol
        await Medicine.deleteMany({});

        // Adds your new list
        await Medicine.insertMany([
            { name: "Panadol", brand: "GSK", pharmacyName: "Servaid", price: 40, location: "Johar Town", stockStatus: "Available" },
            { name: "Arinac", brand: "Abbott", pharmacyName: "Clinix", price: 60, location: "Model Town", stockStatus: "Available" },
            { name: "Brufen", brand: "Abbott", pharmacyName: "Fazal Din", price: 35, location: "DHA Phase 5", stockStatus: "Low Stock" },
            { name: "Augmentin", brand: "GSK", pharmacyName: "Servaid", price: 150, location: "Johar Town", stockStatus: "Out of Stock" }
        ]);

        console.log("✅ All medicines successfully added!");
        process.exit(); 
    })
    .catch(err => {
        console.error("❌ Seeding error:", err);
        process.exit(1);
    });