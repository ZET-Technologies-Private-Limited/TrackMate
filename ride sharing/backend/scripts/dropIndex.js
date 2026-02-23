const mongoose = require('mongoose');
require('dotenv').config();

const dropPhoneIndex = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const db = mongoose.connection.db;
        const result = await db.collection('users').dropIndex('phone_1');
        console.log('Index dropped:', result);

        process.exit(0);
    } catch (error) {
        console.error('Error dropping index:', error.message);
        process.exit(1);
    }
};

dropPhoneIndex();
