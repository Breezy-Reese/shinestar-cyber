require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Service = require('./models/Service');
const Course = require('./models/Course');
const Newsletter = require('./models/Newsletter');
const Setting = require('./models/Setting');
const connectDB = require('./config/database');

async function seedDatabase() {
  console.log('Seeding MongoDB database...');

  try {
    // Connect to MongoDB
    await connectDB();

    // Create admin user with hashed password
    const hashedPassword = await bcrypt.hash('#Basil123', 10);

    // Delete existing admin user
    await User.findOneAndDelete({ email: 'basil59mutuku@gmail.com' });

    // Create new admin user
    await User.create({
      username: 'admin',
      email: 'basil59mutuku@gmail.com',
      password_hash: hashedPassword,
      role: 'admin',
      active: true
    });

    // Insert all required services
    const services = [
      // Government & Digital Services
      { title: 'NISA', slug: 'nisa', category: 'Government Services', description: 'National Intelligence and Security Agency services' },
      { title: 'KUCCPS', slug: 'kuccps', category: 'Education Services', description: 'Kenya Universities and Colleges Central Placement Service' },
      { title: 'ECitizen Services', slug: 'ecitizen-services', category: 'Government Services', description: 'Complete eCitizen portal assistance and application support' },
      { title: 'KRA Services', slug: 'kra-services', category: 'Government Services', description: 'Kenya Revenue Authority tax services and compliance' },
      { title: 'NTSA Services', slug: 'ntsa-services', category: 'Government Services', description: 'National Transport and Safety Authority services' },
      { title: 'SHA Services', slug: 'sha-services', category: 'Government Services', description: 'Social Health Authority services and registration' },
      { title: 'GHRIS Payslips', slug: 'ghris-payslips', category: 'Government Services', description: 'Government Human Resource Information System payslip access' },
      { title: 'Good Conduct', slug: 'good-conduct', category: 'Government Services', description: 'Certificate of Good Conduct application' },
      { title: 'Driving License', slug: 'driving-license', category: 'Government Services', description: 'Driving license application and renewal services' },
      { title: 'EACC Forms', slug: 'eacc-forms', category: 'Government Services', description: 'Ethics and Anti-Corruption Commission forms' },
      { title: 'Green Card Applications', slug: 'green-card-applications', category: 'Immigration Services', description: 'Permanent residency application assistance' },
      { title: 'Logbook Transfer', slug: 'logbook-transfer', category: 'Vehicle Services', description: 'Vehicle ownership transfer services' },
      { title: 'NHIF Services', slug: 'nhif-services', category: 'Health Insurance', description: 'National Hospital Insurance Fund registration and services' },
      { title: 'NSSF Services', slug: 'nssf-services', category: 'Social Security', description: 'National Social Security Fund registration and contributions' },
      { title: 'CR12 Application', slug: 'cr12-application', category: 'Business Services', description: 'Company registration and CR12 certificate application' },
      { title: 'TSC Number', slug: 'tsc-number', category: 'Education Services', description: 'Teachers Service Commission registration and number application' },
      { title: 'Passport Application', slug: 'passport-application', category: 'Immigration Services', description: 'Passport application and renewal assistance' },
      { title: 'Visa Application', slug: 'visa-application', category: 'Immigration Services', description: 'Visa application assistance for various countries' },
      { title: 'Work Permit Application', slug: 'work-permit-application', category: 'Immigration Services', description: 'Work permit application for foreign nationals' },
      { title: 'KRA Tax Returns Filing', slug: 'kra-tax-returns', category: 'Tax Services', description: 'Annual tax returns filing and compliance' },
      { title: 'GHRIS & TSC Payalipa', slug: 'ghris-tsc-payalipa', category: 'Government Services', description: 'GHRIS and TSC payslip access and management' },
      { title: 'Pay Land Rates', slug: 'pay-land-rates', category: 'Government Services', description: 'Land rates payment assistance and processing' },
      { title: 'HELB Application', slug: 'helb-application', category: 'Education Services', description: 'Higher Education Loans Board application services' },
      { title: 'Vehicle Search', slug: 'vehicle-search', category: 'Vehicle Services', description: 'Vehicle ownership verification and search services' },

      // Printing & Design Services
      { title: 'Printing', slug: 'printing', category: 'Printing Services', description: 'High-quality digital and offset printing services'},
      { title: 'Photocopy', slug: 'photocopy', category: 'Printing Services', description: 'Black and white and color photocopying services' },
      { title: 'Lamination', slug: 'lamination', category: 'Printing Services', description: 'Document lamination and protection services'},
      { title: 'Typesetting', slug: 'typesetting', category: 'Design Services', description: 'Professional typesetting and document formatting' },
      { title: 'Binding', slug: 'binding', category: 'Printing Services', description: 'Document binding and finishing services' },
      { title: 'Scanning', slug: 'scanning', category: 'Digital Services', description: 'Document scanning and digital conversion' },
      { title: 'Resume & CV', slug: 'resume-cv', category: 'Design Services', description: 'Professional resume and CV writing services' },
      { title: 'Letterheads & Receipt Books', slug: 'letterheads-receipt-books', category: 'Printing Services', description: 'Custom letterheads and receipt book printing' },
      { title: 'Wedding Design & Printing', slug: 'wedding-design-printing', category: 'Design Services', description: 'Wedding card design and printing services' },
      { title: 'Poster Design', slug: 'poster-design', category: 'Design Services', description: 'Professional poster design and printing' },
      { title: 'Online Printing', slug: 'online-printing', category: 'Printing Services', description: 'Online printing services with delivery' },
      { title: 'Tender Documents', slug: 'tender-documents', category: 'Business Services', description: 'Tender document preparation and printing' },
      { title: 'Student Project Help', slug: 'student-project-help', category: 'Education Services', description: 'Academic project assistance and printing'}
    ];

    for (const serviceData of services) {
      await Service.findOneAndUpdate(
        { slug: serviceData.slug },
        serviceData,
        { upsert: true, new: true }
      );
    }

    // Insert course packages
    const courses = [
      {
        title: 'Basic Computer Package',
        duration: '1 month + 2 weeks',
        fee_ksh: 2500,
        description: 'Introduction to computers, Microsoft Office basics, internet fundamentals, and email communication.',
        level: 'basic'
      },
      {
        title: 'Advanced Computer Package',
        duration: '3 months',
        fee_ksh: 3500,
        description: 'Advanced Microsoft Office, desktop publishing, basic graphic design, and computer maintenance.',
        level: 'advanced'
      },
      {
        title: 'Professional Computer Package',
        duration: '6 months',
        fee_ksh: 6000,
        description: 'Complete computer training including programming, web design, advanced graphics, and IT support.',
        level: 'professional'
      }
    ];

    for (const courseData of courses) {
      await Course.findOneAndUpdate(
        { title: courseData.title },
        courseData,
        { upsert: true, new: true }
      );
    }

    // Mark some services as featured
    const featuredServices = ['Printing', 'ECitizen Services', 'Passport Application'];
    await Service.updateMany(
      { title: { $in: featuredServices } },
      { featured: true }
    );

    // Insert default settings
    const defaultSettings = [
      { key: 'business_name', value: 'VICTOR AND SONS COMPUTERS AND TECH SOLUTIONS KENYA' },
      { key: 'business_address', value: 'California next to Oasis Korumba shop' },
      { key: 'business_email', value: 'victorcomputerservices254@gmail.com' },
      { key: 'business_phone', value: '0717379145,073292867' },
      { key: 'business_hours', value: 'Mon–Sat: 8:00–18:00, Sun: Closed' },
      { key: 'site_description', value: 'Reliable cyber & e-services for individuals and businesses' },
      { key: 'site_keywords', value: 'cyber services, printing, e-citizen, KRA, NTSA, passport, driving license' },
      { key: 'whatsapp_number', value: '254717379145' }
    ];

    for (const setting of defaultSettings) {
      await Setting.findOneAndUpdate(
        { key: setting.key },
        setting,
        { upsert: true, new: true }
      );
    }

    console.log('✅ Database seeded successfully!');
    console.log(`Services: ${services.length}`);
    console.log(`Courses: ${courses.length}`);
    console.log('Admin credentials:');
    console.log('  Email:    basil59mutuku@gmail.com');
    console.log('  Username: admin');
    console.log('  Password: #Basil123');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
  }
}

// Run the seeding
seedDatabase();