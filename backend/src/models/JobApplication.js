const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobPost',
      required: true,
      index: true
    },
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceUser',
      required: true,
      index: true
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceUser',
      required: true,
      index: true
    },
    applicantName: {
      type: String,
      required: true,
      trim: true
    },
    applicantMobile: {
      type: String,
      required: true,
      trim: true
    },
    applicantEmail: {
      type: String,
      required: true,
      trim: true
    },
    qualification: {
      type: String,
      trim: true
    },
    experienceYears: {
      type: Number,
      default: 0
    },
    licenseNumber: {
      type: String,
      trim: true
    },
    coverNote: {
      type: String,
      trim: true,
      maxlength: 1500
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'shortlisted', 'rejected'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate applications by the same applicant to the same job
jobApplicationSchema.index({ jobId: 1, applicantId: 1 }, { unique: true });

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
