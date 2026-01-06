import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import connectDB from './config/db.js';

dotenv.config();

connectDB();

const importData = async () => {
    try {
        await User.deleteMany();

        const users = [
            {
                fullName: 'Shreya Sharma',
                email: 'shreya@example.com',
                password: 'password123', // Will be hashed by pre-save hook
                phone: '+91 98765 43210',
                role: 'user'
            },
            {
                fullName: 'Officer Priya',
                email: 'police@example.com',
                password: 'police123',
                phone: '+91 98765 43220',
                role: 'police'
            }
        ];

        // We use create instead of insertMany to trigger the pre-save hook for password hashing
        for (const user of users) {
            await User.create(user);
        }

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

importData();
