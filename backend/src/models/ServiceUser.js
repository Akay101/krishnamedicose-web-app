const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const serviceUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      index: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Mobile number must be exactly 10 digits (starting with 6-9)']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    // Primary Role
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: ['pharmacy_owner', 'job_seeker_pharmacist', 'doctor']
    },
    // Sub-intent:
    // - pharmacy_owner: 'hire_pharmacist' or 'collab_doctor'
    // - job_seeker_pharmacist: 'work_in_pharmacy'
    // - doctor: 'doctor_collab'
    subRole: {
      type: String,
      required: true,
      enum: ['hire_pharmacist', 'collab_doctor', 'work_in_pharmacy', 'doctor_collab']
    },

    // Pharmacy Details (if pharmacy owner)
    pharmacyDetails: {
      pharmacyName: { type: String, trim: true },
      licenseNumber: { type: String, trim: true },
      licenseImage: { type: String }, // Document URL or key
      establishedYear: { type: Number },
      contactPerson: { type: String, trim: true },
      openingHours: { type: String, trim: true }
    },

    // Pharmacist Qualifications (if pharmacist looking for job or owner)
    pharmacistDetails: {
      qualification: {
        type: String,
        enum: ['D.Pharm', 'B.Pharm', 'M.Pharm', 'Pharm.D', 'Other'],
        default: 'B.Pharm'
      },
      licenseNumber: { type: String, trim: true },
      licenseImage: { type: String },
      experienceYears: { type: Number, default: 0 },
      expectedSalary: { type: String, trim: true },
      skills: [{ type: String, trim: true }],
      bio: { type: String, trim: true, maxlength: 1000 },
      resumeUrl: { type: String }
    },

    // Doctor Details (if doctor)
    doctorDetails: {
      specialization: { type: String, trim: true },
      medicalRegistrationNumber: { type: String, trim: true },
      qualification: { type: String, trim: true },
      experienceYears: { type: Number, default: 0 },
      currentAffiliation: { type: String, trim: true },
      consultationFee: { type: Number },
      about: { type: String, trim: true, maxlength: 1000 }
    },

    // Geographic Location
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
        default: [77.1025, 28.7041] // Default New Delhi coordinates
      }
    },

    // Availability Toggles
    isOpenToWork: {
      type: Boolean,
      default: true
    },
    isOpenToCollaborate: {
      type: Boolean,
      default: true
    },

    // Administrative Status
    isVerified: {
      type: Boolean,
      default: false
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    blockReason: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Geo-spatial index for location queries
serviceUserSchema.index({ 'location.coordinates': '2dsphere' });

// Hash password before saving
serviceUserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
serviceUserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('ServiceUser', serviceUserSchema);
