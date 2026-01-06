import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['streetlight', 'harassment', 'unsafe_area', 'other'],
        required: true
    },
    location: {
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        },
        address: String
    },
    status: {
        type: String,
        enum: ['PENDING', 'INVESTIGATING', 'RESOLVED'],
        default: 'PENDING'
    },
    media: [{
        type: String // URLs to images/videos
    }],
    policeComment: {
        type: String
    },
    resolvedAt: {
        type: Date
    },
    feedback: {
        rating: Number,
        comment: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Report = mongoose.model('Report', reportSchema);

export default Report;
