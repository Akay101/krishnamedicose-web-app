const mongoose = require('mongoose');
const Offer = require('./src/models/Offer');
require('dotenv').config();

const seedOffers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for Offer seeding...');

    // Clear existing offers if needed (optional)
    // await Offer.deleteMany({});

    const defaultOffer = {
      title: "50-50 Launch Offer",
      description: "First 50 pharmacy owners get full access to our upcoming Pharmacy Management & Billing Software for 50 days completely FREE. Register now for early access!",
      isActive: true,
      formEnabled: true,
      emailConfirmation: true,
      formFields: [
        { name: "name", label: "Full Name", type: "text", required: true, placeholder: "John Doe" },
        { name: "mobile", label: "Mobile Number", type: "number", required: true, placeholder: "+91 9876543210" },
        { name: "email", label: "Email Address", type: "email", required: true, placeholder: "john@example.com" },
        { name: "pharmacy_name", label: "Pharmacy Name", type: "text", required: true, placeholder: "Krishna Pharmacy" },
        { name: "location", label: "Location", type: "text", required: true, placeholder: "Bharatpur, Rajasthan" },
        { 
          name: "drug_license", 
          label: "Drug License Number", 
          type: "text", 
          required: true, 
          placeholder: "DL-12345/XX",
          validation: "^[a-zA-Z0-9/-]{5,25}$" 
        },
        { name: "current_software", label: "Current Software (If any)", type: "text", required: false, placeholder: "e.g. Marg, Tally" },
        { name: "problems", label: "Problems in Current Software", type: "textarea", required: false, placeholder: "What issues do you face?" }
      ]
    };

    const existing = await Offer.findOne({ title: defaultOffer.title });
    if (!existing) {
      await Offer.create(defaultOffer);
      console.log('50-50 Offer seeded successfully!');
    } else {
      console.log('50-50 Offer already exists.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedOffers();
