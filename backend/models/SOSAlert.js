import mongoose from 'mongoose';

const sosAlertSchema = new mongoose.Schema({
    victimId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    victimName: {
        type: String,
        required: true
    },
    victimPhone: {
        type: String,
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
        enum: ['ACTIVE', 'RESOLVED'],
        default: 'ACTIVE'
    },
    resolvedAt: {
        type: Date
    },
    responders: [{
        responderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String, // e.g., 'ACCEPTED', 'ARRIVED'
            default: 'ACCEPTED'
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    }],
    audioRecording: {
        type: String // URL to audio file
    },
    videoRecording: {
        type: String // URL to video file
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const SOSAlert = mongoose.model('SOSAlert', sosAlertSchema);

export default SOSAlert;
