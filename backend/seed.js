const mongoose = require('mongoose');
const User = require('./src/models/User');
const Content = require('./src/models/Content');
require('dotenv').config({ path: '.env' });

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Seed Admin
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      const admin = new User({ 
        email, 
        password, 
        role: 'admin',
        permissions: { website: true, leads: true }
      });
      await admin.save();
      console.log('Admin user seeded: ' + email);
    } else {
      console.log('Admin user already exists.');
    }

    // Seed Initial Content
    const initialData = {
      hero: {
        title: "Krishna Medicose",
        subtitle: "Redefining Pharmaceutical Excellence",
        description: "Experience world-class healthcare solutions where ultra-modern technology meets professional compassion. Your health, our vision.",
        location: "Brij Vihar Road, Bharatpur Raj. 321001",
        images: [
          "/assets/hero-pharmacy-1.png",
          "/assets/hero-pharmacy-2.png",
          "/assets/hero-pharmacy-3.png"
        ]
      },
      about: {
        vision_title: "Our Vision & Commitment",
        vision_description: "At Krishna Medicose, our vision stretches beyond providing pharmaceuticals. We strive to create a holistic wellness ecosystem where every customer feels valued and every medical need is met with precision and care.",
        stats: [
          { label: "Happy Customers", value: "10K+" },
          { label: "Medicines Available", value: "15K+" },
          { label: "Years of Trust", value: "25+" }
        ],
        satisfaction_rate: "99%"
      },
      owner: {
        name: "Krishna Pandit",
        title: "Pharmacist | Content Creator",
        bio: "With a passion for health education, Krishna Pandit has built a digital family of 75,000+ members. At Krishna Medicose, he ensures that every patient receives not just medicines, but the right knowledge for their wellbeing.",
        socials: [
          { name: "YouTube", handle: "@krishnamedicos12", url: "https://www.youtube.com/@krishnamedicos12" },
          { name: "Instagram", handle: "@krishna1211pandit", url: "https://www.instagram.com/krishna1211pandit/?hl=en" }
        ],
        social_family: "75K+"
      },
      footer: {
        description: "Your trusted partner in healthcare. Providing premium pharmaceutical services with a modern touch."
      }
    };

    let content = await Content.findOne({ key: 'landing_page' });
    if (!content) {
      await new Content({ key: 'landing_page', data: initialData }).save();
      console.log('Initial website content seeded.');
    } else {
      console.log('Website content already exists.');
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
