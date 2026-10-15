const mongoose = require('mongoose');

const doctorCollaborationInquirySchema = new mongoose.Schema(
  {
    collabPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorCollaborationPost',
      required: true,
      index: true
    },
    doctorId: {
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
    doctorName: {
      type: String,
      required: true,
      trim: true
    },
    doctorMobile: {
      type: String,
      required: true,
      trim: true
    },
    doctorEmail: {
      type: String,
      required: true,
      trim: true
    },
    specialization: {
      type: String,
      trim: true
    },
    qualification: {
      type: String,
      trim: true
    },
    medicalRegistrationNumber: {
      type: String,
      trim: true
    },
    experienceYears: {
      type: Number,
      default: 0
    },
    message: {
      type: String,
      trim: true,
      maxlength: 2000
    },
    proposedTimings: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'accepted', 'declined'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

doctorCollaborationInquirySchema.index({ collabPostId: 1, doctorId: 1 }, { unique: true });

module.exports = mongoose.model('DoctorCollaborationInquiry', doctorCollaborationInquirySchema);
