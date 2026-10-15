const mongoose = require('mongoose');

const jobPostSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceUser',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: 120
    },
    pharmacyName: {
      type: String,
      required: [true, 'Pharmacy name is required'],
      trim: true
    },
    jobType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Locum / Relief', 'Night Shift', 'Weekend Shift'],
      default: 'Full-time'
    },
    requiredExperience: {
      type: String,
      enum: ['Fresher', '1 - 2 Years', '2 - 5 Years', '5+ Years', 'Any Experience'],
      default: '1 - 2 Years'
    },
    requiredQualification: {
      type: String,
      enum: ['D.Pharm', 'B.Pharm', 'M.Pharm', 'Pharm.D', 'Any Pharmacy Degree'],
      default: 'B.Pharm'
    },
    salaryRange: {
      type: String,
      trim: true,
      default: 'Negotiable'
    },
    workTimings: {
      type: String,
      trim: true
    },
    vacancies: {
      type: Number,
      default: 1,
      min: 1
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
      maxlength: 3000
    },
    requirements: [
      {
        type: String,
        trim: true
      }
    ],
    contactPhone: {
      type: String,
      trim: true
    },
    contactEmail: {
      type: String,
      trim: true
    },
    // Location & Visibility
    location: {
      address: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [77.1025, 28.7041]
      }
    },
    visibilityRadiusKm: {
      type: Number,
      default: 25,
      min: 1,
      max: 200
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'closed'],
      default: 'active',
      index: true
    },
    applicationsCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

jobPostSchema.index({ 'location.coordinates': '2dsphere' });
jobPostSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('JobPost', jobPostSchema);
