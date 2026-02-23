const mongoose = require('mongoose');
require('dotenv').config();

const fixIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const db = mongoose.connection.db;
        const collection = db.collection('trips');

        // 1. Drop existing problematic indexes
        try {
            await collection.dropIndex('startPoint_2dsphere');
            console.log('Dropped startPoint_2dsphere');
        } catch (e) {
            console.log('startPoint_2dsphere not found or already dropped');
        }

        try {
            await collection.dropIndex('endPoint_2dsphere');
            console.log('Dropped endPoint_2dsphere');
        } catch (e) {
            console.log('endPoint_2dsphere not found or already dropped');
        }

        // 2. Create correct indexes on coordinates
        await collection.createIndex({ "startPoint.coordinates": "2dsphere" });
        await collection.createIndex({ "endPoint.coordinates": "2dsphere" });
        console.log('Created new 2dsphere indexes on coordinates sub-fields');

        process.exit(0);
    } catch (error) {
        console.error('Error fixing indexes:', error.message);
        process.exit(1);
    }
};

fixIndexes();
