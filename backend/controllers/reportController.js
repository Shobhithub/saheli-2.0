import asyncHandler from 'express-async-handler';
import Report from '../models/Report.js';

// @desc    Get all reports for logged-in user
// @route   GET /api/reports
// @access  Private
const getReports = asyncHandler(async (req, res) => {
    const reports = await Report.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(reports);
});

// @desc    Get ALL reports (for police dashboard)
// @route   GET /api/reports/all
// @access  Private (Police only ideally, but allowing authenticated users for now)
const getAllReports = asyncHandler(async (req, res) => {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
});

// @desc    Create a new report
// @route   POST /api/reports
// @access  Private
const createReport = asyncHandler(async (req, res) => {
    const { title, description, category, location } = req.body;

    if (!title || !description || !category) {
        res.status(400);
        throw new Error('Please fill all required fields');
    }

    const report = await Report.create({
        userId: req.user._id,
        userName: req.user.fullName,
        title,
        description,
        category,
        location: location || {
            latitude: 17.4435,
            longitude: 78.3772,
            address: 'Location auto-detected'
        },
        status: 'PENDING'
    });

    res.status(201).json(report);
});

// @desc    Update report status (for police)
// @route   PUT /api/reports/:id/status
// @access  Private (Police)
const updateStatus = asyncHandler(async (req, res) => {
    const { status, policeComment } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
        res.status(404);
        throw new Error('Report not found');
    }

    report.status = status || report.status;
    if (policeComment) {
        report.policeComment = policeComment;
    }
    if (status === 'RESOLVED') {
        report.resolvedAt = new Date();
    }

    await report.save();
    res.json(report);
});

// @desc    Add feedback to a report
// @route   PUT /api/reports/:id/feedback
// @access  Private
const addFeedback = asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
        res.status(404);
        throw new Error('Report not found');
    }

    // Verify the user owns this report
    if (report.userId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to add feedback to this report');
    }

    report.feedback = { rating, comment };
    await report.save();

    res.json(report);
});

export {
    getReports,
    getAllReports,
    createReport,
    updateStatus,
    addFeedback,
};

