const { escapeRegex } = require("../utils/security");
const ProductCatalog = require('../models/ProductCatalog');
const ProductDistributor = require('../models/ProductDistributor');
const ServiceUser = require('../models/ServiceUser');
const User = require('../models/User');
const catalogUploadService = require('../services/catalogUploadService');
const {
  sendListingSubmittedEmail,
  sendListingReviewedEmail,
  notifyAdminOfListingSubmission
} = require('../services/serviceNotificationService');

// Who to e-mail about a distributor entry: the member who submitted it, else the firm itself
const distributorContact = async (distributor) => {
  if (distributor.submittedByModel === 'ServiceUser' && distributor.submittedBy) {
    const member = await ServiceUser.findById(distributor.submittedBy).select('name email');
    if (member) return { to: member.email, name: member.name, userId: member._id };
  }
  return { to: distributor.email, name: distributor.contactPerson || distributor.firmName, userId: null };
};

const distributorRows = (d) => [
  ['Firm', d.firmName],
  ['Contact person', d.contactPerson],
  ['Location', [d.city, d.state].filter(Boolean).join(', ')],
  ['Catalog attached', d.catalogDocument?.url ? 'Yes' : 'No']
];

// Helper to sanitize text input
const sanitizeText = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>?/gm, '').trim();
};

/**
 * Upload and sanitize catalog document or drug license file
 * POST /api/catalogs/upload-document
 */
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided for upload.' });
    }

    const folder = req.query.folder === 'licenses' ? 'licenses' : 'catalogs';
    const uploadResult = await catalogUploadService.uploadSanitizedDocument(req.file, folder);

    res.status(201).json({
      success: true,
      message: 'Document successfully verified and uploaded.',
      document: {
        url: uploadResult.url,
        filename: uploadResult.filename,
        originalName: uploadResult.originalName,
        mimeType: uploadResult.mimeType,
        size: uploadResult.size,
        uploadedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Document upload sanitization error:', error);
    res.status(400).json({ message: error.message || 'File upload failed validation checks.' });
  }
};

/**
 * =========================================================================
 * USER / PUBLIC AUTHENTICATED ENDPOINTS
 * Requires user to be registered and signed in (serviceUser or admin)
 * =========================================================================
 */

/**
 * Search and browse approved product catalogs
 * GET /api/catalogs/products
 */
exports.getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      dosageForm,
      state,
      city,
      panIndiaOnly,
      prescriptionRequired,
      page = 1,
      limit = 20
    } = req.query;

    const query = { status: 'approved' };

    // Search by name, brand, salt composition, or manufacturer
    if (search && search.trim()) {
      const sanitized = sanitizeText(search);
      const searchRegex = new RegExp(escapeRegex(sanitized), 'i');
      query.$or = [
        { name: searchRegex },
        { brandName: searchRegex },
        { saltComposition: searchRegex },
        { manufacturer: searchRegex },
        { therapeuticClass: searchRegex }
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (dosageForm && dosageForm !== 'All') {
      query.dosageForm = dosageForm;
    }

    if (prescriptionRequired !== undefined && prescriptionRequired !== 'All') {
      query.prescriptionRequired = prescriptionRequired === 'true';
    }

    // Filter by distributor location/Pan-India if requested
    let matchingDistributorIds = null;
    if ((state && state !== 'All') || (city && city.trim()) || panIndiaOnly === 'true') {
      const distQuery = { status: 'approved' };

      if (panIndiaOnly === 'true') {
        distQuery['supplyCoverage.panIndia'] = true;
      } else {
        const conditions = [{ 'supplyCoverage.panIndia': true }];

        if (state && state !== 'All') {
          const stateRegex = new RegExp(`^${escapeRegex(sanitizeText(state))}$`, 'i');
          conditions.push({ state: stateRegex });
          conditions.push({ 'supplyCoverage.statesCovered': stateRegex });
        }

        if (city && city.trim()) {
          const cityRegex = new RegExp(escapeRegex(sanitizeText(city)), 'i');
          conditions.push({ city: cityRegex });
          conditions.push({ 'supplyCoverage.citiesCovered': cityRegex });
        }

        distQuery.$or = conditions;
      }

      const matchingDistributors = await ProductDistributor.find(distQuery).select('_id');
      matchingDistributorIds = matchingDistributors.map((d) => d._id);
      query.distributors = { $in: matchingDistributorIds };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      ProductCatalog.find(query)
        .populate({
          path: 'distributors',
          match: { status: 'approved' },
          select:
            'firmName contactPerson mobile alternateMobile whatsappNumber email officeAddress city state pincode supplyCoverage minimumOrderValue deliveryLeadTime paymentTerms'
        })
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum),
      ProductCatalog.countDocuments(query)
    ]);

    res.json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to retrieve product catalogs. Please try again.' });
  }
};

/**
 * Get single product by ID with full distributor details
 * GET /api/catalogs/products/:id
 */
exports.getProductById = async (req, res) => {
  try {
    const product = await ProductCatalog.findById(req.params.id).populate({
      path: 'distributors',
      match: { status: 'approved' }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product catalog entry not found.' });
    }

    // Only approved products can be viewed by normal users, unless user is the submitter or an admin
    if (product.status !== 'approved' && !req.isAdmin) {
      const isOwner =
        req.serviceUser &&
        product.submittedBy &&
        product.submittedBy.toString() === req.serviceUser._id.toString();

      if (!isOwner) {
        return res.status(403).json({ message: 'This catalog listing is pending review.' });
      }
    }

    res.json({ success: true, product });
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    res.status(500).json({ message: 'Failed to load product details.' });
  }
};

/**
 * Contribute / Add Product Catalog (Users go to pending approval; Admins go to approved)
 * POST /api/catalogs/products
 */
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      brandName,
      manufacturer,
      saltComposition,
      category,
      dosageForm,
      packaging,
      strength,
      mrp,
      prescriptionRequired,
      hsnCode,
      storageCondition,
      therapeuticClass,
      description,
      distributorIds,
      newDistributor
    } = req.body;

    // Validation
    const sanitizedName = sanitizeText(name);
    const sanitizedManufacturer = sanitizeText(manufacturer);
    const sanitizedSalt = sanitizeText(saltComposition);

    if (!sanitizedName) {
      return res.status(400).json({ message: 'Product name is required.' });
    }
    if (!sanitizedManufacturer) {
      return res.status(400).json({ message: 'Manufacturer or marketer name is required.' });
    }
    if (!sanitizedSalt) {
      return res.status(400).json({ message: 'Salt composition / active ingredients are required.' });
    }
    if (!category) {
      return res.status(400).json({ message: 'Product category is required.' });
    }
    if (!dosageForm) {
      return res.status(400).json({ message: 'Dosage form is required.' });
    }

    // Strict length limits
    if (sanitizedName.length > 120) {
      return res.status(400).json({ message: 'Product name cannot exceed 120 characters.' });
    }
    if (brandName && brandName.trim().length > 80) {
      return res.status(400).json({ message: 'Brand name cannot exceed 80 characters.' });
    }
    if (sanitizedManufacturer.length > 120) {
      return res.status(400).json({ message: 'Manufacturer name cannot exceed 120 characters.' });
    }
    if (sanitizedSalt.length > 300) {
      return res.status(400).json({ message: 'Salt composition cannot exceed 300 characters.' });
    }
    if (packaging && packaging.trim().length > 60) {
      return res.status(400).json({ message: 'Packaging description cannot exceed 60 characters.' });
    }
    if (strength && strength.trim().length > 50) {
      return res.status(400).json({ message: 'Strength cannot exceed 50 characters.' });
    }
    if (hsnCode && hsnCode.trim().length > 20) {
      return res.status(400).json({ message: 'HSN code cannot exceed 20 characters.' });
    }
    if (therapeuticClass && therapeuticClass.trim().length > 100) {
      return res.status(400).json({ message: 'Therapeutic class cannot exceed 100 characters.' });
    }
    if (description && description.trim().length > 1000) {
      return res.status(400).json({ message: 'Product description cannot exceed 1000 characters.' });
    }

    // Number validation for MRP (block negative, NaN, exponential gibberish, over 500k)
    let parsedMrp = 0;
    if (mrp !== undefined && mrp !== null && mrp !== '') {
      parsedMrp = Number(mrp);
      if (isNaN(parsedMrp) || parsedMrp < 0 || parsedMrp > 500000) {
        return res.status(400).json({ message: 'MRP must be a valid number between Rs. 0 and Rs. 5,00,000.' });
      }
    }

    const isAdmin = Boolean(req.isAdmin);
    const initialStatus = isAdmin ? 'approved' : 'pending_approval';

    // Submitter metadata
    let submittedBy = null;
    let submittedByModel = 'ServiceUser';
    let submitterName = '';
    let submitterContact = '';

    if (isAdmin && req.user) {
      submittedBy = req.user._id;
      submittedByModel = 'User';
      submitterName = req.user.name || 'Admin';
      submitterContact = req.user.email || '';
    } else if (req.serviceUser) {
      submittedBy = req.serviceUser._id;
      submittedByModel = 'ServiceUser';
      submitterName = req.serviceUser.name || '';
      submitterContact = req.serviceUser.mobile || req.serviceUser.email || '';
    }

    const linkedDistributorIds = Array.isArray(distributorIds) ? [...distributorIds] : [];

    // If user also submitted a new distributor together with this product
    if (newDistributor && newDistributor.firmName && newDistributor.firmName.trim()) {
      // Validate distributor
      const firmName = sanitizeText(newDistributor.firmName);
      const contactPerson = sanitizeText(newDistributor.contactPerson);
      const mobile = sanitizeText(newDistributor.mobile);
      const officeAddress = sanitizeText(newDistributor.officeAddress);
      const city = sanitizeText(newDistributor.city);
      const state = sanitizeText(newDistributor.state);
      const pincode = sanitizeText(newDistributor.pincode);
      const gstNumber = sanitizeText(newDistributor.gstNumber).toUpperCase();
      const drugLicenseNumber = sanitizeText(newDistributor.drugLicenseNumber);

      if (!firmName || !contactPerson || !mobile || !officeAddress || !city || !state) {
        return res.status(400).json({
          message:
            'Please fill all required distributor details: Firm Name, Contact Person, Mobile, Office Address, City, and State.'
        });
      }

      if (firmName.length > 120) {
        return res.status(400).json({ message: 'Distributor firm name cannot exceed 120 characters.' });
      }
      if (contactPerson.length > 80) {
        return res.status(400).json({ message: 'Contact person name cannot exceed 80 characters.' });
      }
      if (!/^[6-9]\d{9}$/.test(mobile)) {
        return res.status(400).json({
          message: 'Distributor mobile number must be a valid 10-digit Indian phone number.'
        });
      }
      if (newDistributor.whatsappNumber && !/^[6-9]\d{9}$/.test(sanitizeText(newDistributor.whatsappNumber))) {
        return res.status(400).json({
          message: 'Distributor WhatsApp number must be a valid 10-digit Indian mobile number.'
        });
      }
      if (pincode && !/^\d{6}$/.test(pincode)) {
        return res.status(400).json({ message: 'Pincode must be exactly 6 digits.' });
      }
      if (gstNumber && gstNumber.length > 15) {
        return res.status(400).json({ message: 'GST number cannot exceed 15 characters.' });
      }
      if (drugLicenseNumber && drugLicenseNumber.length > 60) {
        return res.status(400).json({ message: 'Drug License cannot exceed 60 characters.' });
      }
      if (officeAddress.length > 200) {
        return res.status(400).json({ message: 'Office address cannot exceed 200 characters.' });
      }
      if (city.length > 60) {
        return res.status(400).json({ message: 'City name cannot exceed 60 characters.' });
      }
      if (state.length > 60) {
        return res.status(400).json({ message: 'State name cannot exceed 60 characters.' });
      }

      let parsedMov = 0;
      if (newDistributor.minimumOrderValue !== undefined && newDistributor.minimumOrderValue !== null && newDistributor.minimumOrderValue !== '') {
        parsedMov = Number(newDistributor.minimumOrderValue);
        if (isNaN(parsedMov) || parsedMov < 0 || parsedMov > 10000000) {
          return res.status(400).json({ message: 'Minimum order value must be between Rs. 0 and Rs. 1,00,00,000.' });
        }
      }

      const createdDistributor = new ProductDistributor({
        firmName,
        contactPerson,
        mobile,
        alternateMobile: sanitizeText(newDistributor.alternateMobile),
        whatsappNumber: sanitizeText(newDistributor.whatsappNumber),
        email: sanitizeText(newDistributor.email),
        drugLicenseNumber,
        gstNumber,
        officeAddress,
        city,
        state,
        pincode,
        location: {
          type: 'Point',
          coordinates:
            Array.isArray(newDistributor.coordinates) && newDistributor.coordinates.length === 2
              ? [Number(newDistributor.coordinates[0]), Number(newDistributor.coordinates[1])]
              : [0, 0]
        },
        supplyCoverage: {
          panIndia: Boolean(newDistributor.panIndia),
          statesCovered: Array.isArray(newDistributor.statesCovered)
            ? newDistributor.statesCovered.map(sanitizeText).filter(Boolean)
            : [],
          citiesCovered: Array.isArray(newDistributor.citiesCovered)
            ? newDistributor.citiesCovered.map(sanitizeText).filter(Boolean)
            : []
        },
        minimumOrderValue: parsedMov,
        deliveryLeadTime: sanitizeText(newDistributor.deliveryLeadTime) || '24-48 Hours',
        paymentTerms: sanitizeText(newDistributor.paymentTerms) || 'Credit / COD / Advance',
        notes: sanitizeText(newDistributor.notes),
        status: initialStatus,
        submittedBy,
        submittedByModel,
        submitterName,
        submitterContact,
        approvedBy: isAdmin && req.user ? req.user._id : undefined,
        approvedAt: isAdmin ? new Date() : undefined,
        isDirectAdminEntry: isAdmin
      });

      await createdDistributor.save();
      linkedDistributorIds.push(createdDistributor._id);
    }

    const newProduct = new ProductCatalog({
      name: sanitizedName,
      brandName: sanitizeText(brandName),
      manufacturer: sanitizedManufacturer,
      saltComposition: sanitizedSalt,
      category,
      dosageForm,
      packaging: sanitizeText(packaging) || '1 Strip',
      strength: sanitizeText(strength),
      mrp: parsedMrp,
      prescriptionRequired: prescriptionRequired === undefined ? true : Boolean(prescriptionRequired),
      hsnCode: sanitizeText(hsnCode),
      storageCondition: sanitizeText(storageCondition) || 'Store in a cool, dry place away from sunlight',
      therapeuticClass: sanitizeText(therapeuticClass),
      description: sanitizeText(description),
      distributors: linkedDistributorIds,
      status: initialStatus,
      submittedBy,
      submittedByModel,
      submitterName,
      submitterContact,
      approvedBy: isAdmin && req.user ? req.user._id : undefined,
      approvedAt: isAdmin ? new Date() : undefined,
      isDirectAdminEntry: isAdmin
    });

    await newProduct.save();

    res.status(201).json({
      success: true,
      message: isAdmin
        ? 'Product catalog entry published successfully.'
        : 'Product submitted successfully. It will be visible in the catalog after administrative verification.',
      product: newProduct
    });
  } catch (error) {
    console.error('Error creating product catalog:', error);
    res.status(500).json({ message: error.message || 'Failed to submit product catalog entry.' });
  }
};

/**
 * Search and browse approved distributors
 * GET /api/catalogs/distributors
 */
exports.getDistributors = async (req, res) => {
  try {
    const { search, category, state, city, panIndiaOnly, page = 1, limit = 20 } = req.query;

    const query = { status: 'approved' };
    const andConditions = [];

    // Keyword search across firm name, contact person, drug license, categories, address, city, and state
    if (search && search.trim()) {
      const sanitized = sanitizeText(search);
      const searchRegex = new RegExp(escapeRegex(sanitized), 'i');
      andConditions.push({
        $or: [
          { firmName: searchRegex },
          { contactPerson: searchRegex },
          { categories: searchRegex },
          { otherCategory: searchRegex },
          { officeAddress: searchRegex },
          { drugLicenseNumber: searchRegex },
          { city: searchRegex },
          { state: searchRegex }
        ]
      });
    }

    // Category filter
    if (category && category !== 'All') {
      const sanitizedCat = sanitizeText(category);
      andConditions.push({
        $or: [
          { categories: sanitizedCat },
          { otherCategory: new RegExp(escapeRegex(sanitizedCat), 'i') }
        ]
      });
    }

    if (panIndiaOnly === 'true') {
      query['supplyCoverage.panIndia'] = true;
    } else if ((state && state !== 'All') || (city && city.trim())) {
      const locConditions = [{ 'supplyCoverage.panIndia': true }];

      if (state && state !== 'All') {
        const stateRegex = new RegExp(`^${escapeRegex(sanitizeText(state))}$`, 'i');
        locConditions.push({ state: stateRegex });
        locConditions.push({ 'supplyCoverage.statesCovered': stateRegex });
        locConditions.push({ officeAddress: stateRegex });
      }

      if (city && city.trim()) {
        const cityRegex = new RegExp(escapeRegex(sanitizeText(city)), 'i');
        locConditions.push({ city: cityRegex });
        locConditions.push({ 'supplyCoverage.citiesCovered': cityRegex });
        locConditions.push({ officeAddress: cityRegex });
      }

      andConditions.push({ $or: locConditions });
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [distributors, total] = await Promise.all([
      ProductDistributor.find(query)
        .sort({ firmName: 1 })
        .skip(skip)
        .limit(limitNum),
      ProductDistributor.countDocuments(query)
    ]);

    res.json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      distributors
    });
  } catch (error) {
    console.error('Error fetching distributors:', error);
    res.status(500).json({ message: 'Failed to retrieve distributors directory.' });
  }
};

/**
 * Get single distributor by ID
 * GET /api/catalogs/distributors/:id
 */
exports.getDistributorById = async (req, res) => {
  try {
    const distributor = await ProductDistributor.findById(req.params.id);

    if (!distributor) {
      return res.status(404).json({ message: 'Distributor not found.' });
    }

    if (distributor.status !== 'approved' && !req.isAdmin) {
      const isOwner =
        req.serviceUser &&
        distributor.submittedBy &&
        distributor.submittedBy.toString() === req.serviceUser._id.toString();

      if (!isOwner) {
        return res.status(403).json({ message: 'Distributor profile is pending review.' });
      }
    }

    // Find products supplied by this distributor (if any)
    const productsSupplied = await ProductCatalog.find({
      distributors: distributor._id,
      status: 'approved'
    }).select('name manufacturer saltComposition category dosageForm mrp packaging');

    res.json({ success: true, distributor, productsSupplied });
  } catch (error) {
    console.error('Error fetching distributor by ID:', error);
    res.status(500).json({ message: 'Failed to load distributor details.' });
  }
};

/**
 * Add standalone distributor (Distributor Self-Registration OR Pharmacist Recommendation OR Direct Admin Entry)
 * POST /api/catalogs/distributors
 */
exports.createDistributor = async (req, res) => {
  try {
    const {
      entryType = 'distributor_self',
      firmName,
      contactPerson,
      mobile,
      alternateMobile,
      whatsappNumber,
      email,
      categories,
      otherCategory,
      drugLicenseNumber,
      gstNumber,
      officeAddress,
      city,
      state,
      pincode,
      panIndia,
      statesCovered,
      citiesCovered,
      catalogDocument,
      drugLicenseDocument,
      minimumOrderValue,
      deliveryLeadTime,
      paymentTerms,
      notes
    } = req.body;

    const isAdmin = Boolean(req.isAdmin);
    const validEntryType = ['distributor_self', 'pharmacist_entry', 'admin_entry'].includes(entryType)
      ? (isAdmin && entryType === 'admin_entry' ? 'admin_entry' : entryType)
      : 'distributor_self';

    const sanitizedFirm = sanitizeText(firmName);
    const sanitizedContact = sanitizeText(contactPerson);
    const sanitizedMobile = sanitizeText(mobile);
    const sanitizedAddress = sanitizeText(officeAddress);
    const sanitizedCity = sanitizeText(city);
    const sanitizedState = sanitizeText(state);
    const sanitizedPincode = sanitizeText(pincode);
    const sanitizedGst = sanitizeText(gstNumber).toUpperCase();
    const sanitizedDl = sanitizeText(drugLicenseNumber);
    const sanitizedAltMobile = sanitizeText(alternateMobile);
    const sanitizedWhatsapp = sanitizeText(whatsappNumber);
    const sanitizedEmail = sanitizeText(email);
    const sanitizedOtherCat = sanitizeText(otherCategory);

    // Process categories array
    let processedCategories = [];
    if (Array.isArray(categories)) {
      processedCategories = categories.map(sanitizeText).filter(Boolean);
    } else if (typeof categories === 'string' && categories.trim()) {
      processedCategories = [sanitizeText(categories)];
    }

    // Common validations
    if (!sanitizedFirm) {
      return res.status(400).json({ message: 'Distributor firm name is required.' });
    }
    if (sanitizedFirm.length > 120) {
      return res.status(400).json({ message: 'Firm name cannot exceed 120 characters.' });
    }

    if (!sanitizedAddress) {
      return res.status(400).json({ message: 'Consolidated address / location is required.' });
    }
    if (sanitizedAddress.length > 300) {
      return res.status(400).json({ message: 'Address cannot exceed 300 characters.' });
    }

    if (!sanitizedMobile) {
      return res.status(400).json({ message: 'Primary mobile number is required.' });
    }
    if (!/^[6-9]\d{9}$/.test(sanitizedMobile)) {
      return res.status(400).json({
        message: 'Primary mobile number must be a valid 10-digit Indian phone number.'
      });
    }

    if (processedCategories.length === 0 && !sanitizedOtherCat) {
      return res.status(400).json({
        message: 'Please select at least one product category (e.g., Allopathic, OTC, Ayurvedic, etc.).'
      });
    }

    // Persona-specific validation
    if (validEntryType === 'distributor_self' || validEntryType === 'admin_entry') {
      if (!sanitizedContact) {
        return res.status(400).json({ message: 'Contact person name is required for distributor registration.' });
      }
      if (sanitizedContact.length > 80) {
        return res.status(400).json({ message: 'Contact person cannot exceed 80 characters.' });
      }
    }

    if (sanitizedAltMobile && !/^[6-9]\d{9}$/.test(sanitizedAltMobile)) {
      return res.status(400).json({
        message: 'Alternate mobile number must be a valid 10-digit Indian number.'
      });
    }
    if (sanitizedWhatsapp && !/^[6-9]\d{9}$/.test(sanitizedWhatsapp)) {
      return res.status(400).json({
        message: 'WhatsApp number must be a valid 10-digit Indian number.'
      });
    }
    if (sanitizedEmail && sanitizedEmail.length > 100) {
      return res.status(400).json({ message: 'Email address cannot exceed 100 characters.' });
    }
    if (sanitizedDl && sanitizedDl.length > 60) {
      return res.status(400).json({ message: 'Drug License number cannot exceed 60 characters.' });
    }
    if (sanitizedGst && sanitizedGst.length > 15) {
      return res.status(400).json({ message: 'GST number cannot exceed 15 characters.' });
    }
    if (sanitizedPincode && !/^\d{6}$/.test(sanitizedPincode)) {
      return res.status(400).json({ message: 'Pincode must be exactly 6 digits.' });
    }

    let parsedMov = 0;
    if (minimumOrderValue !== undefined && minimumOrderValue !== null && minimumOrderValue !== '') {
      parsedMov = Number(minimumOrderValue);
      if (isNaN(parsedMov) || parsedMov < 0 || parsedMov > 10000000) {
        return res.status(400).json({ message: 'Minimum order value must be between Rs. 0 and Rs. 1,00,00,000.' });
      }
    }

    const initialStatus = isAdmin ? 'approved' : 'pending_approval';

    let submittedBy = null;
    let submittedByModel = 'ServiceUser';
    let submitterName = '';
    let submitterContact = '';
    let submitterRole = 'distributor';

    if (isAdmin && req.user) {
      submittedBy = req.user._id;
      submittedByModel = 'User';
      submitterName = req.user.name || 'Admin';
      submitterContact = req.user.email || '';
      submitterRole = 'admin';
    } else if (req.serviceUser) {
      submittedBy = req.serviceUser._id;
      submittedByModel = 'ServiceUser';
      submitterName = req.serviceUser.name || '';
      submitterContact = req.serviceUser.mobile || req.serviceUser.email || '';
      submitterRole = validEntryType === 'pharmacist_entry' ? 'pharmacist' : 'distributor';
    }

    // Safe document structure builders
    const safeCatalogDoc = catalogDocument && typeof catalogDocument === 'object' && catalogDocument.url
      ? {
          url: sanitizeText(catalogDocument.url),
          filename: sanitizeText(catalogDocument.filename),
          originalName: sanitizeText(catalogDocument.originalName),
          mimeType: sanitizeText(catalogDocument.mimeType),
          size: Number(catalogDocument.size) || 0,
          uploadedAt: new Date()
        }
      : {};

    const safeLicenseDoc = drugLicenseDocument && typeof drugLicenseDocument === 'object' && drugLicenseDocument.url
      ? {
          url: sanitizeText(drugLicenseDocument.url),
          filename: sanitizeText(drugLicenseDocument.filename),
          originalName: sanitizeText(drugLicenseDocument.originalName),
          mimeType: sanitizeText(drugLicenseDocument.mimeType),
          size: Number(drugLicenseDocument.size) || 0,
          uploadedAt: new Date()
        }
      : {};

    const newDistributor = new ProductDistributor({
      firmName: sanitizedFirm,
      entryType: validEntryType,
      contactPerson: sanitizedContact || (validEntryType === 'pharmacist_entry' ? submitterName : ''),
      mobile: sanitizedMobile,
      alternateMobile: sanitizedAltMobile,
      whatsappNumber: sanitizedWhatsapp,
      email: sanitizedEmail,
      categories: processedCategories,
      otherCategory: sanitizedOtherCat,
      drugLicenseNumber: sanitizedDl,
      gstNumber: sanitizedGst,
      officeAddress: sanitizedAddress,
      city: sanitizedCity,
      state: sanitizedState,
      pincode: sanitizedPincode,
      location: {
        type: 'Point',
        coordinates:
          Array.isArray(req.body.coordinates) && req.body.coordinates.length === 2
            ? [Number(req.body.coordinates[0]), Number(req.body.coordinates[1])]
            : [0, 0]
      },
      supplyCoverage: {
        panIndia: Boolean(panIndia),
        statesCovered: Array.isArray(statesCovered) ? statesCovered.map(sanitizeText).filter(Boolean) : [],
        citiesCovered: Array.isArray(citiesCovered) ? citiesCovered.map(sanitizeText).filter(Boolean) : []
      },
      catalogDocument: safeCatalogDoc,
      drugLicenseDocument: safeLicenseDoc,
      minimumOrderValue: parsedMov,
      deliveryLeadTime: sanitizeText(deliveryLeadTime) || '24-48 Hours',
      paymentTerms: sanitizeText(paymentTerms) || 'Credit / COD / Advance',
      notes: sanitizeText(notes),
      status: initialStatus,
      submittedBy,
      submittedByModel,
      submitterName,
      submitterContact,
      submitterRole,
      approvedBy: isAdmin && req.user ? req.user._id : undefined,
      approvedAt: isAdmin ? new Date() : undefined,
      isDirectAdminEntry: isAdmin
    });

    await newDistributor.save();

    if (!isAdmin) {
      (async () => {
        const contact = await distributorContact(newDistributor);
        await sendListingSubmittedEmail({
          kind: 'distributor',
          ...contact,
          heading: newDistributor.firmName,
          rows: distributorRows(newDistributor)
        });
        await notifyAdminOfListingSubmission({
          kind: 'distributor',
          heading: newDistributor.firmName,
          submitterName: newDistributor.submitterName || contact.name,
          submitterEmail: contact.to,
          rows: distributorRows(newDistributor).slice(1)
        });
      })().catch((err) => console.error('Distributor submission email error:', err));
    }

    res.status(201).json({
      success: true,
      message: isAdmin
        ? 'Distributor directory entry added and approved.'
        : 'Distributor entry submitted successfully. It will be visible in the directory after administrative verification.',
      distributor: newDistributor
    });
  } catch (error) {
    console.error('Error creating distributor:', error);
    res.status(500).json({ message: error.message || 'Failed to submit distributor details.' });
  }
};

/**
 * Get current user's submitted contributions
 * GET /api/catalogs/my-contributions
 */
exports.getUserContributions = async (req, res) => {
  try {
    const userId = req.serviceUser ? req.serviceUser._id : req.user ? req.user._id : null;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const [products, distributors] = await Promise.all([
      ProductCatalog.find({ submittedBy: userId })
        .populate('distributors', 'firmName city state mobile')
        .sort({ createdAt: -1 }),
      ProductDistributor.find({ submittedBy: userId }).sort({ createdAt: -1 })
    ]);

    res.json({
      success: true,
      products,
      distributors
    });
  } catch (error) {
    console.error('Error fetching user contributions:', error);
    res.status(500).json({ message: 'Failed to retrieve contributions.' });
  }
};

/**
 * =========================================================================
 * ADMIN MANAGEMENT CONTROLLER ENDPOINTS
 * Requires root platform administrator
 * =========================================================================
 */

/**
 * Get catalog admin overview stats
 * GET /api/catalogs/admin/stats
 */
exports.getAdminStats = async (req, res) => {
  try {
    const [
      totalDistributors,
      pendingDistributors,
      approvedDistributors,
      rejectedDistributors,
      panIndiaDistributors,
      distributorSelfCount,
      pharmacistEntryCount,
      adminEntryCount,
      withCatalogCount
    ] = await Promise.all([
      ProductDistributor.countDocuments(),
      ProductDistributor.countDocuments({ status: 'pending_approval' }),
      ProductDistributor.countDocuments({ status: 'approved' }),
      ProductDistributor.countDocuments({ status: 'rejected' }),
      ProductDistributor.countDocuments({ 'supplyCoverage.panIndia': true, status: 'approved' }),
      ProductDistributor.countDocuments({ entryType: 'distributor_self' }),
      ProductDistributor.countDocuments({ entryType: 'pharmacist_entry' }),
      ProductDistributor.countDocuments({ entryType: 'admin_entry' }),
      ProductDistributor.countDocuments({ 'catalogDocument.url': { $exists: true, $ne: '' } })
    ]);

    res.json({
      success: true,
      stats: {
        totalDistributors,
        pendingDistributors,
        approvedDistributors,
        rejectedDistributors,
        panIndiaDistributors,
        distributorSelfCount,
        pharmacistEntryCount,
        adminEntryCount,
        withCatalogCount
      }
    });
  } catch (error) {
    console.error('Error fetching catalog admin stats:', error);
    res.status(500).json({ message: 'Failed to load catalog dashboard statistics.' });
  }
};

/**
 * Get all products (Admin view with status filter)
 * GET /api/catalogs/admin/products
 */
exports.getAdminProducts = async (req, res) => {
  try {
    const { status, search, category, page = 1, limit = 30 } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search && search.trim()) {
      const sanitized = sanitizeText(search);
      const searchRegex = new RegExp(escapeRegex(sanitized), 'i');
      query.$or = [
        { name: searchRegex },
        { brandName: searchRegex },
        { saltComposition: searchRegex },
        { manufacturer: searchRegex },
        { submitterName: searchRegex }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      ProductCatalog.find(query)
        .populate('distributors', 'firmName city state mobile')
        .populate('approvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      ProductCatalog.countDocuments(query)
    ]);

    res.json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      products
    });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    res.status(500).json({ message: 'Failed to load products for administrator.' });
  }
};

/**
 * Approve or Reject a Product Catalog
 * PATCH /api/catalogs/admin/products/:id/status
 */
exports.updateProductStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    if (!['approved', 'rejected', 'pending_approval', 'draft'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status specified.' });
    }

    const product = await ProductCatalog.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product catalog entry not found.' });
    }

    product.status = status;
    if (adminNotes !== undefined) {
      product.adminNotes = sanitizeText(adminNotes);
    }

    if (status === 'approved') {
      product.approvedBy = req.adminUser ? req.adminUser._id : req.user ? req.user._id : undefined;
      product.approvedAt = new Date();
    }

    await product.save();

    res.json({
      success: true,
      message: `Product status successfully updated to ${status}.`,
      product
    });
  } catch (error) {
    console.error('Error updating product status:', error);
    res.status(500).json({ message: 'Failed to update product status.' });
  }
};

/**
 * Edit Product Catalog Details (Admin)
 * PUT /api/catalogs/admin/products/:id
 */
exports.updateProduct = async (req, res) => {
  try {
    const product = await ProductCatalog.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const updates = req.body;
    if (updates.name !== undefined) {
      const sanitizedName = sanitizeText(updates.name);
      if (!sanitizedName) return res.status(400).json({ message: 'Product name cannot be empty.' });
      if (sanitizedName.length > 120) return res.status(400).json({ message: 'Product name cannot exceed 120 characters.' });
      product.name = sanitizedName;
    }
    if (updates.brandName !== undefined) {
      const b = sanitizeText(updates.brandName);
      if (b.length > 80) return res.status(400).json({ message: 'Brand name cannot exceed 80 characters.' });
      product.brandName = b;
    }
    if (updates.manufacturer !== undefined) {
      const m = sanitizeText(updates.manufacturer);
      if (!m) return res.status(400).json({ message: 'Manufacturer name cannot be empty.' });
      if (m.length > 120) return res.status(400).json({ message: 'Manufacturer cannot exceed 120 characters.' });
      product.manufacturer = m;
    }
    if (updates.saltComposition !== undefined) {
      const s = sanitizeText(updates.saltComposition);
      if (!s) return res.status(400).json({ message: 'Salt composition cannot be empty.' });
      if (s.length > 300) return res.status(400).json({ message: 'Salt composition cannot exceed 300 characters.' });
      product.saltComposition = s;
    }
    if (updates.category !== undefined) product.category = updates.category;
    if (updates.dosageForm !== undefined) product.dosageForm = updates.dosageForm;
    if (updates.packaging !== undefined) {
      const p = sanitizeText(updates.packaging);
      if (p.length > 60) return res.status(400).json({ message: 'Packaging cannot exceed 60 characters.' });
      product.packaging = p;
    }
    if (updates.strength !== undefined) {
      const st = sanitizeText(updates.strength);
      if (st.length > 50) return res.status(400).json({ message: 'Strength cannot exceed 50 characters.' });
      product.strength = st;
    }
    if (updates.mrp !== undefined) {
      const numMrp = Number(updates.mrp);
      if (isNaN(numMrp) || numMrp < 0 || numMrp > 500000) {
        return res.status(400).json({ message: 'MRP must be a valid number between Rs. 0 and Rs. 5,00,000.' });
      }
      product.mrp = numMrp;
    }
    if (updates.prescriptionRequired !== undefined) product.prescriptionRequired = Boolean(updates.prescriptionRequired);
    if (updates.hsnCode !== undefined) {
      const hsn = sanitizeText(updates.hsnCode);
      if (hsn.length > 20) return res.status(400).json({ message: 'HSN code cannot exceed 20 characters.' });
      product.hsnCode = hsn;
    }
    if (updates.storageCondition !== undefined) {
      const sc = sanitizeText(updates.storageCondition);
      if (sc.length > 120) return res.status(400).json({ message: 'Storage condition cannot exceed 120 characters.' });
      product.storageCondition = sc;
    }
    if (updates.therapeuticClass !== undefined) {
      const tc = sanitizeText(updates.therapeuticClass);
      if (tc.length > 100) return res.status(400).json({ message: 'Therapeutic class cannot exceed 100 characters.' });
      product.therapeuticClass = tc;
    }
    if (updates.description !== undefined) {
      const desc = sanitizeText(updates.description);
      if (desc.length > 1000) return res.status(400).json({ message: 'Description cannot exceed 1000 characters.' });
      product.description = desc;
    }
    if (updates.distributors !== undefined && Array.isArray(updates.distributors)) {
      product.distributors = updates.distributors;
    }
    if (updates.status !== undefined) {
      product.status = updates.status;
      if (updates.status === 'approved' && !product.approvedAt) {
        product.approvedBy = req.adminUser ? req.adminUser._id : req.user ? req.user._id : undefined;
        product.approvedAt = new Date();
      }
    }
    if (updates.adminNotes !== undefined) {
      const an = sanitizeText(updates.adminNotes);
      if (an.length > 500) return res.status(400).json({ message: 'Admin notes cannot exceed 500 characters.' });
      product.adminNotes = an;
    }

    await product.save();
    res.json({ success: true, message: 'Product catalog updated successfully.', product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: error.message || 'Failed to update product.' });
  }
};

/**
 * Delete Product Catalog Entry (Admin)
 * DELETE /api/catalogs/admin/products/:id
 */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await ProductCatalog.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    await ProductCatalog.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product catalog entry permanently deleted.' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Failed to delete product.' });
  }
};

/**
 * Get all distributors (Admin view)
 * GET /api/catalogs/admin/distributors
 */
exports.getAdminDistributors = async (req, res) => {
  try {
    const { status, entryType, category, search, state, page = 1, limit = 30 } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (entryType && entryType !== 'All') {
      query.entryType = entryType;
    }

    if (category && category !== 'All') {
      const sanitizedCat = sanitizeText(category);
      query.$or = [
        { categories: sanitizedCat },
        { otherCategory: new RegExp(escapeRegex(sanitizedCat), 'i') }
      ];
    }

    if (state && state !== 'All') {
      const stateConds = [
        { 'supplyCoverage.panIndia': true },
        { state: new RegExp(`^${escapeRegex(sanitizeText(state))}$`, 'i') },
        { 'supplyCoverage.statesCovered': new RegExp(`^${escapeRegex(sanitizeText(state))}$`, 'i') },
        { officeAddress: new RegExp(escapeRegex(sanitizeText(state)), 'i') }
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: stateConds }];
        delete query.$or;
      } else {
        query.$or = stateConds;
      }
    }

    if (search && search.trim()) {
      const sanitized = sanitizeText(search);
      const searchRegex = new RegExp(escapeRegex(sanitized), 'i');
      const searchConds = [
        { firmName: searchRegex },
        { contactPerson: searchRegex },
        { mobile: searchRegex },
        { categories: searchRegex },
        { otherCategory: searchRegex },
        { officeAddress: searchRegex },
        { drugLicenseNumber: searchRegex },
        { gstNumber: searchRegex },
        { city: searchRegex },
        { state: searchRegex }
      ];

      if (query.$and) {
        query.$and.push({ $or: searchConds });
      } else if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConds }];
        delete query.$or;
      } else {
        query.$or = searchConds;
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));
    const skip = (pageNum - 1) * limitNum;

    const [distributors, total] = await Promise.all([
      ProductDistributor.find(query)
        .populate('approvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      ProductDistributor.countDocuments(query)
    ]);

    res.json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      distributors
    });
  } catch (error) {
    console.error('Error fetching admin distributors:', error);
    res.status(500).json({ message: 'Failed to load distributors directory.' });
  }
};

/**
 * Approve or Reject Distributor
 * PATCH /api/catalogs/admin/distributors/:id/status
 */
exports.updateDistributorStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    if (!['approved', 'rejected', 'pending_approval', 'draft'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status specified.' });
    }

    const distributor = await ProductDistributor.findById(req.params.id);
    if (!distributor) {
      return res.status(404).json({ message: 'Distributor not found.' });
    }

    const previousStatus = distributor.status;
    distributor.status = status;
    if (adminNotes !== undefined) {
      distributor.adminNotes = sanitizeText(adminNotes);
    }

    if (status === 'rejected' && !distributor.adminNotes) {
      return res.status(400).json({ message: 'Please add a note explaining why the entry is rejected.' });
    }

    if (status === 'approved') {
      distributor.approvedBy = req.adminUser ? req.adminUser._id : req.user ? req.user._id : undefined;
      distributor.approvedAt = new Date();
    }

    await distributor.save();

    // Tell the submitter about the verification result (only when it changes)
    if ((status === 'approved' || status === 'rejected') && previousStatus !== status && !distributor.isDirectAdminEntry) {
      distributorContact(distributor)
        .then((contact) =>
          sendListingReviewedEmail({
            kind: 'distributor',
            ...contact,
            heading: distributor.firmName,
            approved: status === 'approved',
            note: distributor.adminNotes
          })
        )
        .catch((err) => console.error('Distributor review email error:', err));
    }

    res.json({
      success: true,
      message: `Distributor status updated to ${status}.`,
      distributor
    });
  } catch (error) {
    console.error('Error updating distributor status:', error);
    res.status(500).json({ message: 'Failed to update distributor status.' });
  }
};

/**
 * Edit Distributor (Admin)
 * PUT /api/catalogs/admin/distributors/:id
 */
exports.updateDistributor = async (req, res) => {
  try {
    const distributor = await ProductDistributor.findById(req.params.id);
    if (!distributor) {
      return res.status(404).json({ message: 'Distributor not found.' });
    }

    const updates = req.body;
    if (updates.firmName !== undefined) {
      const fn = sanitizeText(updates.firmName);
      if (!fn) return res.status(400).json({ message: 'Firm name cannot be empty.' });
      if (fn.length > 120) return res.status(400).json({ message: 'Firm name cannot exceed 120 characters.' });
      distributor.firmName = fn;
    }
    if (updates.contactPerson !== undefined) {
      const cp = sanitizeText(updates.contactPerson);
      if (cp.length > 80) return res.status(400).json({ message: 'Contact person cannot exceed 80 characters.' });
      distributor.contactPerson = cp;
    }
    if (updates.mobile !== undefined) {
      const m = sanitizeText(updates.mobile);
      if (!/^[6-9]\d{9}$/.test(m)) {
        return res.status(400).json({ message: 'Mobile number must be a valid 10-digit Indian number.' });
      }
      distributor.mobile = m;
    }
    if (updates.alternateMobile !== undefined) {
      const am = sanitizeText(updates.alternateMobile);
      if (am && !/^[6-9]\d{9}$/.test(am)) {
        return res.status(400).json({ message: 'Alternate mobile must be a valid 10-digit Indian number.' });
      }
      distributor.alternateMobile = am;
    }
    if (updates.whatsappNumber !== undefined) {
      const wa = sanitizeText(updates.whatsappNumber);
      if (wa && !/^[6-9]\d{9}$/.test(wa)) {
        return res.status(400).json({ message: 'WhatsApp number must be a valid 10-digit Indian number.' });
      }
      distributor.whatsappNumber = wa;
    }
    if (updates.email !== undefined) {
      const em = sanitizeText(updates.email);
      if (em.length > 100) return res.status(400).json({ message: 'Email cannot exceed 100 characters.' });
      distributor.email = em;
    }
    if (updates.categories !== undefined) {
      if (Array.isArray(updates.categories)) {
        distributor.categories = updates.categories.map(sanitizeText).filter(Boolean);
      } else if (typeof updates.categories === 'string' && updates.categories.trim()) {
        distributor.categories = [sanitizeText(updates.categories)];
      }
    }
    if (updates.otherCategory !== undefined) {
      distributor.otherCategory = sanitizeText(updates.otherCategory).substring(0, 100);
    }
    if (updates.drugLicenseNumber !== undefined) {
      const dl = sanitizeText(updates.drugLicenseNumber);
      if (dl.length > 60) return res.status(400).json({ message: 'Drug License cannot exceed 60 characters.' });
      distributor.drugLicenseNumber = dl;
    }
    if (updates.gstNumber !== undefined) {
      const gst = sanitizeText(updates.gstNumber).toUpperCase();
      if (gst.length > 15) return res.status(400).json({ message: 'GST number cannot exceed 15 characters.' });
      distributor.gstNumber = gst;
    }
    if (updates.officeAddress !== undefined) {
      const addr = sanitizeText(updates.officeAddress);
      if (!addr) return res.status(400).json({ message: 'Office address cannot be empty.' });
      if (addr.length > 300) return res.status(400).json({ message: 'Office address cannot exceed 300 characters.' });
      distributor.officeAddress = addr;
    }
    if (updates.city !== undefined) {
      distributor.city = sanitizeText(updates.city).substring(0, 60);
    }
    if (updates.state !== undefined) {
      distributor.state = sanitizeText(updates.state).substring(0, 60);
    }
    if (updates.pincode !== undefined) {
      const pin = sanitizeText(updates.pincode);
      if (pin && !/^\d{6}$/.test(pin)) {
        return res.status(400).json({ message: 'Pincode must be exactly 6 digits.' });
      }
      distributor.pincode = pin;
    }
    if (Array.isArray(updates.coordinates) && updates.coordinates.length === 2) {
      distributor.location = {
        type: 'Point',
        coordinates: [Number(updates.coordinates[0]), Number(updates.coordinates[1])]
      };
    }
    if (updates.catalogDocument !== undefined) {
      if (updates.catalogDocument && typeof updates.catalogDocument === 'object' && updates.catalogDocument.url) {
        distributor.catalogDocument = {
          url: sanitizeText(updates.catalogDocument.url),
          filename: sanitizeText(updates.catalogDocument.filename),
          originalName: sanitizeText(updates.catalogDocument.originalName),
          mimeType: sanitizeText(updates.catalogDocument.mimeType),
          size: Number(updates.catalogDocument.size) || 0,
          uploadedAt: updates.catalogDocument.uploadedAt || new Date()
        };
      } else {
        distributor.catalogDocument = {};
      }
    }
    if (updates.drugLicenseDocument !== undefined) {
      if (updates.drugLicenseDocument && typeof updates.drugLicenseDocument === 'object' && updates.drugLicenseDocument.url) {
        distributor.drugLicenseDocument = {
          url: sanitizeText(updates.drugLicenseDocument.url),
          filename: sanitizeText(updates.drugLicenseDocument.filename),
          originalName: sanitizeText(updates.drugLicenseDocument.originalName),
          mimeType: sanitizeText(updates.drugLicenseDocument.mimeType),
          size: Number(updates.drugLicenseDocument.size) || 0,
          uploadedAt: updates.drugLicenseDocument.uploadedAt || new Date()
        };
      } else {
        distributor.drugLicenseDocument = {};
      }
    }

    if (updates.supplyCoverage !== undefined) {
      distributor.supplyCoverage = {
        panIndia: Boolean(updates.supplyCoverage.panIndia),
        statesCovered: Array.isArray(updates.supplyCoverage.statesCovered)
          ? updates.supplyCoverage.statesCovered.map(sanitizeText).filter(Boolean)
          : [],
        citiesCovered: Array.isArray(updates.supplyCoverage.citiesCovered)
          ? updates.supplyCoverage.citiesCovered.map(sanitizeText).filter(Boolean)
          : []
      };
    }

    if (updates.minimumOrderValue !== undefined) {
      const mov = Number(updates.minimumOrderValue);
      if (isNaN(mov) || mov < 0 || mov > 10000000) {
        return res.status(400).json({ message: 'Minimum order value must be between Rs. 0 and Rs. 1,00,00,000.' });
      }
      distributor.minimumOrderValue = mov;
    }
    if (updates.deliveryLeadTime !== undefined) {
      const dlt = sanitizeText(updates.deliveryLeadTime);
      if (dlt.length > 60) return res.status(400).json({ message: 'Delivery lead time cannot exceed 60 characters.' });
      distributor.deliveryLeadTime = dlt;
    }
    if (updates.paymentTerms !== undefined) {
      const pt = sanitizeText(updates.paymentTerms);
      if (pt.length > 100) return res.status(400).json({ message: 'Payment terms cannot exceed 100 characters.' });
      distributor.paymentTerms = pt;
    }
    if (updates.notes !== undefined) {
      const nt = sanitizeText(updates.notes);
      if (nt.length > 1000) return res.status(400).json({ message: 'Notes cannot exceed 1000 characters.' });
      distributor.notes = nt;
    }

    if (updates.status !== undefined) {
      distributor.status = updates.status;
      if (updates.status === 'approved' && !distributor.approvedAt) {
        distributor.approvedBy = req.adminUser ? req.adminUser._id : req.user ? req.user._id : undefined;
        distributor.approvedAt = new Date();
      }
    }
    if (updates.adminNotes !== undefined) {
      const an = sanitizeText(updates.adminNotes);
      if (an.length > 500) return res.status(400).json({ message: 'Admin notes cannot exceed 500 characters.' });
      distributor.adminNotes = an;
    }

    await distributor.save();
    res.json({ success: true, message: 'Distributor details updated successfully.', distributor });
  } catch (error) {
    console.error('Error updating distributor:', error);
    res.status(500).json({ message: error.message || 'Failed to update distributor.' });
  }
};

/**
 * Delete Distributor (Admin)
 * DELETE /api/catalogs/admin/distributors/:id
 */
exports.deleteDistributor = async (req, res) => {
  try {
    const distributor = await ProductDistributor.findById(req.params.id);
    if (!distributor) {
      return res.status(404).json({ message: 'Distributor not found.' });
    }

    // Unlink this distributor from all products
    await ProductCatalog.updateMany(
      { distributors: req.params.id },
      { $pull: { distributors: req.params.id } }
    );

    await ProductDistributor.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Distributor permanently removed.' });
  } catch (error) {
    console.error('Error deleting distributor:', error);
    res.status(500).json({ message: 'Failed to delete distributor.' });
  }
};
