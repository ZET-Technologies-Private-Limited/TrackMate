const mongoose = require('mongoose');
require('dotenv').config();

const checkIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const db = mongoose.connection.db;
        const indexes = await db.collection('trips').indexes();
        console.log('Trips Indexes:', JSON.stringify(indexes, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Error checking indexes:', error.message);
        process.exit(1);
    }
};

checkIndexes();
