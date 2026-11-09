const mongoose = require('mongoose');

/** A pharmacy / clinic offering its chamber to a doctor's chamber request. */
const doctorRequestResponseSchema = new mongoose.Schema(
  {
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'DoctorChamberRequest', required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceUser', required: true, index: true },
    responderId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceUser', required: true, index: true },
    chamberPostId: { type: mongoose.Schema.Types.ObjectId, ref: 'DoctorCollaborationPost' },
    pharmacyName: { type: String, trim: true, maxlength: 120 },
    responderName: { type: String, trim: true, maxlength: 100 },
    responderMobile: { type: String, trim: true, maxlength: 15 },
    responderEmail: { type: String, trim: true, maxlength: 120 },
    message: { type: String, trim: true, maxlength: 800 },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' }
  },
  { timestamps: true }
);

doctorRequestResponseSchema.index({ requestId: 1, responderId: 1 }, { unique: true });

module.exports = mongoose.model('DoctorRequestResponse', doctorRequestResponseSchema);
