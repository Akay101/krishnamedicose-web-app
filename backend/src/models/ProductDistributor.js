const mongoose = require('mongoose');

const productDistributorSchema = new mongoose.Schema(
  {
    firmName: {
      type: String,
      required: [true, 'Distributor firm name is required'],
      trim: true,
      minlength: [2, 'Firm name must be at least 2 characters'],
      maxlength: [120, 'Firm name cannot exceed 120 characters'],
      index: true
    },
    contactPerson: {
      type: String,
      required: [true, 'Contact person name is required'],
      trim: true,
      minlength: [2, 'Contact person must be at least 2 characters'],
      maxlength: [80, 'Contact person cannot exceed 80 characters']
    },
    mobile: {
      type: String,
      required: [true, 'Primary mobile number is required'],
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number']
    },
    alternateMobile: {
      type: String,
      trim: true,
      default: ''
    },
    whatsappNumber: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [80, 'Email cannot exceed 80 characters'],
      default: ''
    },
    drugLicenseNumber: {
      type: String,
      trim: true,
      maxlength: [60, 'Drug license number cannot exceed 60 characters'],
      default: ''
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [15, 'GST number cannot exceed 15 characters'],
      default: ''
    },
    officeAddress: {
      type: String,
      required: [true, 'Office or warehouse address is required'],
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [60, 'City cannot exceed 60 characters'],
      index: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      maxlength: [60, 'State cannot exceed 60 characters'],
      index: true
    },
    pincode: {
      type: String,
      trim: true,
      maxlength: [6, 'Pincode must be a 6-digit number'],
      default: ''
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: [0, 0]
      }
    },
    supplyCoverage: {
      panIndia: {
        type: Boolean,
        default: false,
        index: true
      },
      statesCovered: [
        {
          type: String,
          trim: true
        }
      ],
      citiesCovered: [
        {
          type: String,
          trim: true
        }
      ]
    },
    minimumOrderValue: {
      type: Number,
      min: [0, 'Minimum order value cannot be negative'],
      max: [10000000, 'Minimum order value cannot exceed ₹1,00,00,000'],
      default: 0
    },
    deliveryLeadTime: {
      type: String,
      trim: true,
      maxlength: [60, 'Delivery lead time cannot exceed 60 characters'],
      default: '24-48 Hours'
    },
    paymentTerms: {
      type: String,
      trim: true,
      maxlength: [100, 'Payment terms cannot exceed 100 characters'],
      default: 'Cash on Delivery / Advance'
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: ''
    },
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'approved', 'rejected'],
      default: 'pending_approval',
      index: true
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'submittedByModel'
    },
    submittedByModel: {
      type: String,
      enum: ['ServiceUser', 'User'],
      default: 'ServiceUser'
    },
    submitterName: {
      type: String,
      trim: true,
      default: ''
    },
    submitterContact: {
      type: String,
      trim: true,
      default: ''
    },
    adminNotes: {
      type: String,
      trim: true,
      default: ''
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    },
    isDirectAdminEntry: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

productDistributorSchema.index({ firmName: 'text', city: 'text', state: 'text' });
productDistributorSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('ProductDistributor', productDistributorSchema);
