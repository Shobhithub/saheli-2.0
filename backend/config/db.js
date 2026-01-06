import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saheli', {
            serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        console.log('Retrying MongoDB connection in 5 seconds...');
        // Don't exit, retry after 5 seconds
        setTimeout(connectDB, 5000);
    }
};

export default connectDB;

