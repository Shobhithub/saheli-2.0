import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import sosRoutes from './routes/sosRoutes.js';

dotenv.config();

connectDB();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: [
            "http://localhost:8080", 
            "http://localhost:5173", 
            "http://127.0.0.1:8080", 
            "http://127.0.0.1:5173",
            "https://saheli.gouri.fun",
            "http://saheli.gouri.fun"
        ],
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS configuration - handle preflight requests
const allowedOrigins = [
    "http://localhost:8080",
    "http://localhost:5173",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:5173",
    "https://saheli.gouri.fun",
    "http://saheli.gouri.fun"
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));

// Handle preflight requests explicitly
app.options('*', cors());

app.use((req, res, next) => {
    req.io = io;
    next();
});

import postRoutes from './routes/postRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/posts', postRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', service: 'saheli-backend' });
});

// Socket.io connection implementation
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_SOS', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined SOS room`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});


// const PORT = process.env.PORT_SAHELI || 4000;
const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => console.log(`Server started on port ${PORT}`));