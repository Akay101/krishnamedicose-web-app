const mongoose = require('mongoose');

const documentAttachmentSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      trim: true,
      default: ''
    },
    filename: {
      type: String,
      trim: true,
      default: ''
    },
    originalName: {
      type: String,
      trim: true,
      default: ''
    },
    mimeType: {
      type: String,
      trim: true,
      default: ''
    },
    size: {
      type: Number,
      default: 0
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

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
    entryType: {
      type: String,
      enum: ['distributor_self', 'pharmacist_entry', 'admin_entry'],
      default: 'distributor_self',
      index: true
    },
    contactPerson: {
      type: String,
      trim: true,
      maxlength: [80, 'Contact person cannot exceed 80 characters'],
      default: ''
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
    categories: [
      {
        type: String,
        trim: true
      }
    ],
    otherCategory: {
      type: String,
      trim: true,
      maxlength: [100, 'Other category cannot exceed 100 characters'],
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
    // Single consolidated address string
    officeAddress: {
      type: String,
      required: [true, 'Address or location is required'],
      trim: true,
      maxlength: [300, 'Address cannot exceed 300 characters']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [60, 'City cannot exceed 60 characters'],
      default: '',
      index: true
    },
    state: {
      type: String,
      trim: true,
      maxlength: [60, 'State cannot exceed 60 characters'],
      default: '',
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
    // Documents attached
    catalogDocument: {
      type: documentAttachmentSchema,
      default: () => ({})
    },
    drugLicenseDocument: {
      type: documentAttachmentSchema,
      default: () => ({})
    },
    minimumOrderValue: {
      type: Number,
      min: [0, 'Minimum order value cannot be negative'],
      max: [10000000, 'Minimum order value cannot exceed 1,00,00,000'],
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
    submitterRole: {
      type: String,
      enum: ['distributor', 'pharmacist', 'admin'],
      default: 'distributor'
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

productDistributorSchema.index({
  firmName: 'text',
  city: 'text',
  state: 'text',
  officeAddress: 'text',
  categories: 'text'
});
productDistributorSchema.index({ location: '2dsphere' });
productDistributorSchema.index({ categories: 1 });

module.exports = mongoose.model('ProductDistributor', productDistributorSchema);
