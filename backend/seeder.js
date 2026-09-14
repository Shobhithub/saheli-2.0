import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import connectDB from './config/db.js';

dotenv.config();

const users = [
    {
        fullName: 'Shreya Sharma',
        email: 'shreya@example.com',
        password: 'password123', // Hashed by the User pre-save hook
        phone: '+91 98765 43210',
        role: 'user'
    },
    {
        fullName: 'Officer Priya',
        email: 'police1@gmail.com',
        password: 'police123',
        phone: '+91 98765 43220',
        role: 'police'
    },
    {
        fullName: 'Officer Meera',
        email: 'police@example.com',
        password: 'police123',
        phone: '+91 98765 43221',
        role: 'police'
    }
];

const importData = async () => {
    try {
        await connectDB({ retry: false });

        // Upsert instead of deleteMany() so re-running the seeder to repair a
        // demo account never wipes real registered users. Passwords are set
        // through save() so the pre-save hook hashes them exactly once.
        for (const seed of users) {
            const existing = await User.findOne({ email: seed.email });

            if (existing) {
                existing.fullName = seed.fullName;
                existing.phone = seed.phone;
                existing.role = seed.role;
                existing.password = seed.password; // marked modified -> re-hashed
                await existing.save();
                console.log(`Updated ${seed.email} (${seed.role})`);
            } else {
                await User.create(seed);
                console.log(`Created ${seed.email} (${seed.role})`);
            }
        }

        console.log('\nData Imported! You can now log in with:');
        for (const seed of users) {
            console.log(`  ${seed.role.padEnd(6)}  ${seed.email} / ${seed.password}`);
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

importData();
