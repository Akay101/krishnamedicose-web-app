const mongoose = require('mongoose');

const productCatalogSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product / Medicine name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters'],
      maxlength: [120, 'Product name cannot exceed 120 characters'],
      index: true
    },
    brandName: {
      type: String,
      trim: true,
      maxlength: [80, 'Brand name cannot exceed 80 characters'],
      default: ''
    },
    manufacturer: {
      type: String,
      required: [true, 'Manufacturer / Marketer name is required'],
      trim: true,
      minlength: [2, 'Manufacturer name must be at least 2 characters'],
      maxlength: [120, 'Manufacturer cannot exceed 120 characters'],
      index: true
    },
    saltComposition: {
      type: String,
      required: [true, 'Salt composition / active ingredients are required'],
      trim: true,
      minlength: [2, 'Salt composition must be at least 2 characters'],
      maxlength: [300, 'Salt composition cannot exceed 300 characters'],
      index: true
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      enum: [
        'Allopathic',
        'Ayurvedic & Herbal',
        'Homeopathic',
        'OTC Healthcare',
        'Cosmetics & Derma',
        'Surgical & Medical Devices',
        'Generic Medicine',
        'Nutrition & Supplements',
        'Veterinary',
        'Other'
      ],
      index: true
    },
    dosageForm: {
      type: String,
      required: [true, 'Dosage form is required'],
      enum: [
        'Tablet',
        'Capsule',
        'Syrup / Suspension',
        'Injection',
        'Ointment / Gel / Cream',
        'Drops (Eye/Ear/Nasal)',
        'Inhaler / Respule',
        'Powder / Granules',
        'Lotion / Solution',
        'Device / Surgical Kit',
        'Other'
      ],
      default: 'Tablet'
    },
    packaging: {
      type: String,
      trim: true,
      maxlength: [60, 'Packaging description cannot exceed 60 characters'],
      default: '1 Strip'
    },
    strength: {
      type: String,
      trim: true,
      maxlength: [50, 'Strength cannot exceed 50 characters'],
      default: ''
    },
    mrp: {
      type: Number,
      min: [0, 'MRP cannot be negative'],
      max: [500000, 'MRP cannot exceed ₹5,00,000'],
      default: 0
    },
    prescriptionRequired: {
      type: Boolean,
      default: true
    },
    hsnCode: {
      type: String,
      trim: true,
      maxlength: [20, 'HSN code cannot exceed 20 characters'],
      default: ''
    },
    storageCondition: {
      type: String,
      trim: true,
      maxlength: [100, 'Storage condition cannot exceed 100 characters'],
      default: 'Store in a cool, dry place away from sunlight'
    },
    therapeuticClass: {
      type: String,
      trim: true,
      maxlength: [150, 'Therapeutic class cannot exceed 150 characters'],
      default: ''
    },
    description: {
      type: String,
      trim: true,
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
      default: ''
    },
    distributors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductDistributor'
      }
    ],
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

productCatalogSchema.index({
  name: 'text',
  brandName: 'text',
  manufacturer: 'text',
  saltComposition: 'text'
});

module.exports = mongoose.model('ProductCatalog', productCatalogSchema);
