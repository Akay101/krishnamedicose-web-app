const mongoose = require('mongoose');

/**
 * A doctor announcing they are looking for a clinic / pharmacy chamber to practise from.
 * The mirror image of DoctorCollaborationPost (where a pharmacy offers a chamber).
 */
const doctorChamberRequestSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceUser', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    specialization: { type: String, required: true, trim: true, maxlength: 80 },
    qualification: { type: String, trim: true, maxlength: 60 },
    experienceYears: { type: Number, default: 0, min: 0, max: 60 },
    preferredTimings: { type: String, required: true, trim: true, maxlength: 80 },
    consultationDays: { type: String, trim: true, maxlength: 80, default: 'Monday to Saturday' },
    expectedTerms: { type: String, trim: true, maxlength: 120, default: 'Revenue share / Negotiable' },
    requirements: [{ type: String, trim: true, maxlength: 100 }], // e.g. "AC consultation room", "Receptionist"
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    location: {
      address: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [77.1025, 28.7041] } // [lng, lat]
    },
    searchRadiusKm: { type: Number, default: 15, min: 1, max: 100 },
    // Admin verification (no schema default - see JobPost for why)
    moderationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], index: true },
    moderationNote: { type: String, trim: true, default: '' },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['active', 'paused', 'closed'], default: 'active', index: true },
    responsesCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

doctorChamberRequestSchema.index({ 'location.coordinates': '2dsphere' });
doctorChamberRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('DoctorChamberRequest', doctorChamberRequestSchema);
