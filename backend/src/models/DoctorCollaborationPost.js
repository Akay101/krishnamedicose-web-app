const mongoose = require('mongoose');

const doctorCollaborationPostSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceUser',
      required: true,
      index: true
    },
    pharmacyName: {
      type: String,
      required: [true, 'Pharmacy or Clinic name is required'],
      trim: true
    },
    clinicOrChamberName: {
      type: String,
      trim: true
    },
    specializationNeeded: {
      type: String,
      required: [true, 'Doctor specialization needed is required'],
      trim: true
    },
    chamberFacilities: [
      {
        type: String,
        trim: true
      }
    ], // e.g. ["AC Consultation Room", "Patient Waiting Area", "Examination Couch", "Pharmacy Attached", "Receptionist Available"]
    preferredTimings: {
      type: String,
      trim: true,
      required: [true, 'Preferred consultation timings are required']
    },
    consultationDays: {
      type: String,
      trim: true,
      default: 'Monday to Saturday'
    },
    collaborationTerms: {
      type: String,
      trim: true,
      default: 'Revenue Sharing / Negotiable'
    },
    description: {
      type: String,
      required: [true, 'Details about the clinic/chamber are required'],
      trim: true,
      maxlength: 3000
    },
    contactPhone: {
      type: String,
      trim: true
    },
    contactEmail: {
      type: String,
      trim: true
    },
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
      default: 30,
      min: 1,
      max: 200
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'closed'],
      default: 'active',
      index: true
    },
    inquiriesCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

doctorCollaborationPostSchema.index({ 'location.coordinates': '2dsphere' });
doctorCollaborationPostSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('DoctorCollaborationPost', doctorCollaborationPostSchema);
