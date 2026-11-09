/**
 * Translation Dictionary for Healthcare Services (English & Hindi)
 * Uses simple, everyday words with clear meaning and no confusing jargon.
 */

export const translations = {
  en: {
    lang: 'en',
    // Top Bar & Branding
    siteTitle: 'Find Jobs & Doctors',
    siteSubtitle: 'Pharmacy Hiring, Job Search & Clinic Doctor Collaborations',
    backToMain: 'Back to Main Site',
    langToggle: 'हिन्दी',
    notifications: 'Notifications',
    markAllRead: 'Mark all as read',
    noNotifications: 'No notifications yet',
    
    // User Roles
    pharmacyOwner: 'Pharmacy Owner',
    pharmacist: 'Pharmacist',
    doctor: 'Doctor',

    // Main Page Tabs
    tabPharmacists: 'Pharmacists',
    tabDoctors: 'Doctors',
    pharmacistsTabSubtitle: 'Pharmacy hiring, job vacancies, and pharmacists looking for work',
    doctorsTabSubtitle: 'Doctor consultation chambers, clinic tie-ups, and specialist doctors',
    heroPharmacistsTitle: 'Hire verified pharmacists or find your next pharmacy job',
    heroPharmacistsDesc: 'Pharmacies post vacancies and discover pharmacists near them. Pharmacists apply to listings verified by Krishna Medicose.',
    heroDoctorsTitle: 'Bring doctors and pharmacy chambers together',
    heroDoctorsDesc: 'Pharmacies and clinics list their consultation chambers. Doctors find a chamber nearby or post what they need. Every listing is verified first.',
    optDoctorConnectOwner: 'I own a pharmacy or clinic with a chamber',
    optDoctorConnectOwnerDesc: 'List your chamber with photos and timings, and get proposals from verified doctors.',
    hirePharmacistBtn: 'Hire a Pharmacist',
    findJobsBtn: 'Find Pharmacy Jobs',
    connectDoctorBtn: 'Find a Chamber',
    listChamberBtn: 'List My Chamber',
    availablePharmacyJobs: 'Available Pharmacy Jobs',
    availableClinicChambers: 'Available Clinic Chambers',
    doctorsLookingForClinic: 'Doctors Available for Consultation',
    pharmacistsLookingForWork: 'Pharmacists Looking for Work',
    
    // Availability
    openToWork: 'Open to Work',
    notSeekingWork: 'Not Looking for Work',
    openToCollab: 'Open to Connect',
    unavailable: 'Unavailable',
    
    // Auth Modal
    whoAreYou: 'Who are you?',
    chooseGoal: 'Please select what describes you best to continue:',
    opt1Title: 'I own a pharmacy and want to hire',
    opt1Desc: 'Post vacancies for your store and discover pharmacists open to work near you.',
    opt2Title: 'I\'m a pharmacist looking for a job',
    opt2Desc: 'Find verified pharmacy jobs near your home, compare salaries and apply directly.',
    opt3Title: 'I\'m a doctor looking for a chamber',
    opt3Desc: 'Find verified pharmacy and clinic chambers near you, or post what you need so pharmacies can reach out.',
    opt4Title: "I'm here for catalogs, medicine data & links",
    opt4Desc: 'Browse verified distributors, the medicine data bundle and useful pharmacy links. You can still post jobs or chambers any time.',
    select: 'Select',
    alreadyRegistered: 'Already have an account? Sign In',
    newHere: 'New here? Register Account',
    
    // Sub-intent
    ownerGoalQuestion: 'What would you like to do?',
    ownerSub1: 'Hire a pharmacist for my pharmacy',
    ownerSub1Desc: 'Post job vacancies with salary and timings. See pharmacists available in your area.',
    ownerSub2: 'Offer my chamber to a doctor',
    ownerSub2Desc: 'List your chamber setup, preferred doctor specialization, and timings.',
    back: 'Back',
    
    // Registration Form
    registerTitle: 'Create Your Free Account',
    personalDetails: 'Personal Details',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Enter your name',
    mobileNumber: 'Mobile Phone Number',
    mobilePlaceholder: '10-digit mobile number',
    emailAddress: 'Email Address',
    emailPlaceholder: 'name@example.com',
    password: 'Password',
    passwordPlaceholder: 'At least 6 characters',
    
    // Pharmacy Owner fields
    pharmacyDetails: 'Pharmacy Details',
    pharmacyName: 'Pharmacy Name',
    pharmacyNamePlaceholder: 'e.g. Krishna Medicose',
    drugLicenseNumber: 'Drug License Number',
    drugLicensePlaceholder: 'e.g. DL-12345',
    uploadLicense: 'Upload Drug License (Photo or PDF)',
    
    // Pharmacist fields
    pharmacistDetails: 'Pharmacist Details',
    degreeQualification: 'Degree / Qualification',
    experienceYears: 'Experience (Years)',
    councilRegNumber: 'Pharmacy Council Registration Number',
    uploadCertificate: 'Upload Degree or Registration Certificate',
    
    // Doctor fields
    doctorDetails: 'Doctor Details',
    specialization: 'Specialization (Field of Medicine)',
    specializationPlaceholder: 'e.g. General Physician, Child Specialist, Skin Specialist',
    medicalDegree: 'Medical Degree',
    medicalRegNumber: 'Medical Council Reg. Number',
    clinicalExperience: 'Experience in Practice (Years)',
    
    // Location
    locationSection: 'Your Location',
    searchLocation: 'Type your area or city name...',
    useGps: 'Detect my location',
    streetAddress: 'Shop / House No. & Street',
    city: 'City',
    state: 'State',
    pincode: 'PIN Code (6 digits)',
    changeLocation: 'Change Location',
    
    // Buttons & Actions
    completeRegister: 'Complete Registration',
    signInBtn: 'Sign In to Account',
    signingIn: 'Signing In...',
    registering: 'Creating Account...',
    signOut: 'Sign Out',
    
    // Dashboard - Owner
    myJobs: 'My Job Posts',
    postNewJob: 'Post a Job',
    openPharmacists: 'Pharmacists Looking for Work',
    doctorCollabs: 'Doctor Chambers',
    newChamberListing: 'Add Chamber Listing',
    viewApplicants: 'View Applicants',
    edit: 'Edit',
    delete: 'Delete',
    
    // Dashboard - Pharmacist
    availableJobs: 'Available Jobs',
    myApplications: 'My Applications',
    applyNow: 'Apply Now',
    applied: 'Applied',
    distanceAway: 'km away',
    salary: 'Salary',
    shift: 'Shift',
    
    // Dashboard - Doctor
    availableChambers: 'Available Clinic Chambers',
    myProposals: 'My Inquiries',
    sendProposal: 'Send Proposal',
    proposalSent: 'Proposal Sent',
    facilities: 'Facilities',
    timings: 'Timings',
    
    // Radius & Filters
    filterRadius: 'Distance:',
    allDistance: 'Any Distance',
    searchPlaceholder: 'Search by title, name, or area...',
    
    // Validation Messages
    errMobile10Digits: 'Mobile number must be exactly 10 digits.',
    errEmailInvalid: 'Please enter a valid email address.',
    errRequired: 'Please fill out all required fields.',
    errPasswordShort: 'Password must be at least 6 characters.',

    // OTP Verification
    enterOtp: 'Enter Verification Code',
    otpSentTo: 'A 6-digit code has been sent to',
    enter6DigitOtp: 'Enter 6-digit code',
    verifyAndSignIn: 'Verify & Sign In',
    verifyAndRegister: 'Verify & Complete Registration',
    verifying: 'Verifying...',
    resendOtp: 'Resend Code',
    resendIn: 'Resend in',
    seconds: 's',
    backToEdit: 'Back to Edit Details',
    backToLogin: 'Back to Sign In',
    sendOtp: 'Send Verification Code',
    sendingOtp: 'Sending Code...',
    otpNotice: 'For your security, a 6-digit verification code is required.',

    // Infinite Feed & Details
    seeDetails: 'See Details',
    loginToUnlockDetails: 'Sign in to see full details and contact information',
    showingCount: 'Showing',
    of: 'of',
    loadMore: 'Load More',
    allLoaded: 'All listings loaded',
    scrollDownToLoadMore: 'Scroll down to load more',
    loginToContact: 'Sign in to contact',
    loginToApply: 'Sign in to apply',
    loginToCollaborate: 'Sign in to collaborate',
    protectedActionPrompt: 'Please sign in or create an account to view full contact numbers, details, and apply.',
    contactPharmacist: 'Contact Pharmacist',
    inviteDoctor: 'Invite Doctor'
  },

  hi: {
    lang: 'hi',
    // Top Bar & Branding
    siteTitle: 'नौकरी और डॉक्टर खोजें',
    siteSubtitle: 'फार्मेसी स्टाफ भर्ती, नौकरी खोज एवं क्लिनिक-डॉक्टर साझेदारी',
    backToMain: 'मुख्य वेबसाइट पर जाएं',
    langToggle: 'English',
    notifications: 'सूचनाएं',
    markAllRead: 'सभी को पढ़ा हुआ मार्क करें',
    noNotifications: 'अभी कोई नई सूचना नहीं है',
    
    // User Roles
    pharmacyOwner: 'फार्मेसी मालिक',
    pharmacist: 'फार्मासिस्ट',
    doctor: 'डॉक्टर',

    // Main Page Tabs
    tabPharmacists: 'फार्मासिस्ट',
    tabDoctors: 'डॉक्टर',
    pharmacistsTabSubtitle: 'फार्मेसी भर्ती, नौकरी के अवसर एवं उपलब्ध फार्मासिस्ट',
    doctorsTabSubtitle: 'डॉक्टर क्लिनिक चैंबर, अस्पताल साझेदारी एवं विशेषज्ञ डॉक्टर',
    heroPharmacistsTitle: 'वेरिफाइड फार्मासिस्ट रखें या अपनी अगली फार्मेसी नौकरी पाएं',
    heroPharmacistsDesc: 'फार्मेसी नौकरियां पोस्ट करती हैं और पास के फार्मासिस्ट खोजती हैं। फार्मासिस्ट कृष्णा मेडिकोज़ द्वारा वेरिफाइड नौकरियों पर आवेदन करते हैं।',
    heroDoctorsTitle: 'डॉक्टरों और फार्मेसी चैंबर को जोड़ें',
    heroDoctorsDesc: 'फार्मेसी और क्लिनिक अपने चैंबर लिस्ट करते हैं। डॉक्टर पास का चैंबर खोजते हैं या अपनी ज़रूरत पोस्ट करते हैं। हर लिस्टिंग पहले वेरिफाई होती है।',
    optDoctorConnectOwner: 'मेरी फार्मेसी/क्लिनिक में डॉक्टर के लिए चैंबर है',
    optDoctorConnectOwnerDesc: 'फोटो और समय के साथ अपना चैंबर लिस्ट करें और वेरिफाइड डॉक्टरों से प्रस्ताव पाएं।',
    hirePharmacistBtn: 'फार्मासिस्ट रखें',
    findJobsBtn: 'फार्मेसी नौकरी खोजें',
    connectDoctorBtn: 'चैंबर खोजें',
    listChamberBtn: 'मेरा चैंबर लिस्ट करें',
    availablePharmacyJobs: 'उपलब्ध फार्मेसी नौकरियां',
    availableClinicChambers: 'उपलब्ध क्लिनिक चैंबर',
    doctorsLookingForClinic: 'परामर्श के लिए उपलब्ध डॉक्टर',
    pharmacistsLookingForWork: 'नौकरी ढूंढ रहे फार्मासिस्ट',
    
    // Availability
    openToWork: 'नौकरी के लिए उपलब्ध',
    notSeekingWork: 'अभी नौकरी नहीं चाहिए',
    openToCollab: 'मरीज़ देखने के लिए उपलब्ध',
    unavailable: 'अनुपलब्ध',
    
    // Auth Modal
    whoAreYou: 'आप कौन हैं?',
    chooseGoal: 'आगे बढ़ने के लिए अपनी प्रोफाइल चुनें:',
    opt1Title: 'मेरी फार्मेसी है और मुझे स्टाफ चाहिए',
    opt1Desc: 'अपने स्टोर के लिए नौकरी पोस्ट करें और पास के फार्मासिस्ट खोजें।',
    opt2Title: 'मैं फार्मासिस्ट हूँ और नौकरी ढूंढ रहा/रही हूँ',
    opt2Desc: 'घर के पास वेरिफाइड फार्मेसी नौकरियां खोजें, वेतन देखें और सीधे आवेदन करें।',
    opt3Title: 'मैं डॉक्टर हूँ और चैंबर ढूंढ रहा/रही हूँ',
    opt3Desc: 'पास के वेरिफाइड फार्मेसी/क्लिनिक चैंबर खोजें, या अपनी ज़रूरत पोस्ट करें ताकि फार्मेसी आपसे संपर्क करें।',
    opt4Title: 'मुझे कैटलॉग, मेडिसिन डेटा और लिंक चाहिए',
    opt4Desc: 'वेरिफाइड डिस्ट्रीब्यूटर, मेडिसिन डेटा बंडल और उपयोगी फार्मेसी लिंक देखें। आप कभी भी नौकरी या चैंबर पोस्ट कर सकते हैं।',
    select: 'चुनें',
    alreadyRegistered: 'पहले से खाता है? लॉग इन करें',
    newHere: 'नया खाता बनाएं (रजिस्टर)',
    
    // Sub-intent
    ownerGoalQuestion: 'आप क्या करना चाहते हैं?',
    ownerSub1: 'अपनी फार्मेसी के लिए फार्मासिस्ट रखें',
    ownerSub1Desc: 'वेतन और समय के साथ नौकरी पोस्ट करें। अपने इलाके के उपलब्ध फार्मासिस्ट देखें।',
    ownerSub2: 'डॉक्टर को अपना चैंबर दें',
    ownerSub2Desc: 'अपने क्लिनिक का कमरा, डॉक्टर की विशेषज्ञता और समय साझा करें।',
    back: 'पीछे जाएं',
    
    // Registration Form
    registerTitle: 'नया खाता बनाएं',
    personalDetails: 'व्यक्तिगत जानकारी',
    fullName: 'पूरा नाम',
    fullNamePlaceholder: 'अपना नाम लिखें',
    mobileNumber: 'मोबाइल नंबर',
    mobilePlaceholder: '10 अंकों का मोबाइल नंबर',
    emailAddress: 'ईमेल पता',
    emailPlaceholder: 'name@example.com',
    password: 'पासवर्ड',
    passwordPlaceholder: 'कम से कम 6 अक्षर',
    
    // Pharmacy Owner fields
    pharmacyDetails: 'फार्मेसी की जानकारी',
    pharmacyName: 'फार्मेसी / मेडिकल स्टोर का नाम',
    pharmacyNamePlaceholder: 'उदा. कृष्णा मेडिकोज',
    drugLicenseNumber: 'ड्रग लाइसेंस नंबर',
    drugLicensePlaceholder: 'उदा. DL-12345',
    uploadLicense: 'ड्रग लाइसेंस की फोटो या पीडीएफ अपलोड करें',
    
    // Pharmacist fields
    pharmacistDetails: 'फार्मासिस्ट की जानकारी',
    degreeQualification: 'डिग्री / योग्यता',
    experienceYears: 'अनुभव (वर्षों में)',
    councilRegNumber: 'फार्मेसी काउंसिल रजिस्ट्रेशन नंबर',
    uploadCertificate: 'डिग्री या रजिस्ट्रेशन सर्टिफिकेट अपलोड करें',
    
    // Doctor fields
    doctorDetails: 'डॉक्टर की जानकारी',
    specialization: 'विशेषज्ञता (स्पेशलाइजेशन)',
    specializationPlaceholder: 'उदा. जनरल फिजिशियन, बाल रोग विशेषज्ञ, चर्म रोग विशेषज्ञ',
    medicalDegree: 'मेडिकल डिग्री',
    medicalRegNumber: 'मेडिकल काउंसिल रजिस्ट्रेशन नंबर',
    clinicalExperience: 'अनुभव (वर्षों में)',
    
    // Location
    locationSection: 'आपका स्थान (लोकेशन)',
    searchLocation: 'अपना इलाका या शहर लिखें...',
    useGps: 'मेरी वर्तमान जीपीएस लोकेशन लें',
    streetAddress: 'दुकान / मकान नंबर और पता',
    city: 'शहर',
    state: 'राज्य',
    pincode: 'पिन कोड (6 अंक)',
    changeLocation: 'स्थान बदलें',
    
    // Buttons & Actions
    completeRegister: 'पंजीकरण पूरा करें',
    signInBtn: 'खाते में लॉग इन करें',
    signingIn: 'लॉग इन हो रहा है...',
    registering: 'खाता बन रहा है...',
    signOut: 'लॉग आउट',
    
    // Dashboard - Owner
    myJobs: 'मेरी नौकरी पोस्ट',
    postNewJob: 'नई नौकरी पोस्ट करें',
    openPharmacists: 'नौकरी ढूंढ रहे फार्मासिस्ट',
    doctorCollabs: 'डॉक्टर क्लिनिक पार्टनरशिप',
    newChamberListing: 'नया क्लिनिक कमरा लिस्ट करें',
    viewApplicants: 'उम्मीदवार देखें',
    edit: 'बदलें',
    delete: 'हटाएं',
    
    // Dashboard - Pharmacist
    availableJobs: 'उपलब्ध नौकरियां',
    myApplications: 'मेरे आवेदन',
    applyNow: 'आवेदन करें',
    applied: 'आवेदन किया गया',
    distanceAway: 'किमी दूर',
    salary: 'वेतन',
    shift: 'समय / शिफ्ट',
    
    // Dashboard - Doctor
    availableChambers: 'उपलब्ध क्लिनिक चैंबर',
    myProposals: 'मेरे भेजे गए प्रस्ताव',
    sendProposal: 'प्रस्ताव भेजें',
    proposalSent: 'प्रस्ताव भेजा गया',
    facilities: 'सुविधाएं',
    timings: 'समय',
    
    // Radius & Filters
    filterRadius: 'दूरी:',
    allDistance: 'सभी दूरी',
    searchPlaceholder: 'नाम, पद या इलाके से खोजें...',
    
    // Validation Messages
    errMobile10Digits: 'मोबाइल नंबर ठीक 10 अंकों का होना चाहिए।',
    errEmailInvalid: 'कृपया सही ईमेल पता दर्ज करें।',
    errRequired: 'कृपया सभी जरूरी बॉक्स भरें।',
    errPasswordShort: 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।',

    // OTP Verification
    enterOtp: 'सत्यापन कोड दर्ज करें',
    otpSentTo: '6 अंकों का कोड भेजा गया है:',
    enter6DigitOtp: '6 अंकों का कोड दर्ज करें',
    verifyAndSignIn: 'सत्यापित करें और लॉग इन करें',
    verifyAndRegister: 'सत्यापित करें और खाता बनाएं',
    verifying: 'सत्यापन हो रहा है...',
    resendOtp: 'कोड दोबारा भेजें',
    resendIn: 'दोबारा भेजें',
    seconds: 'सेकंड',
    backToEdit: 'विवरण बदलने के लिए पीछे जाएं',
    backToLogin: 'लॉग इन पर वापस जाएं',
    sendOtp: 'सत्यापन कोड भेजें',
    sendingOtp: 'कोड भेजा जा रहा है...',
    otpNotice: 'आपकी सुरक्षा के लिए 6 अंकों का सत्यापन कोड आवश्यक है।',

    // Infinite Feed & Details
    seeDetails: 'विवरण देखें',
    loginToUnlockDetails: 'पूरा विवरण और संपर्क देखने के लिए लॉग इन करें',
    showingCount: 'दिखा रहे हैं',
    of: 'कुल में से',
    loadMore: 'और देखें',
    allLoaded: 'सभी लिस्टिंग लोड हो चुकी हैं',
    scrollDownToLoadMore: 'और देखने के लिए नीचे स्क्रॉल करें',
    loginToContact: 'संपर्क के लिए लॉग इन करें',
    loginToApply: 'आवेदन के लिए लॉग इन करें',
    loginToCollaborate: 'साझेदारी के लिए लॉग इन करें',
    protectedActionPrompt: 'पूरे संपर्क नंबर, विवरण देखने और आवेदन करने के लिए कृपया साइन इन करें।',
    contactPharmacist: 'फार्मासिस्ट से संपर्क करें',
    inviteDoctor: 'डॉक्टर को आमंत्रित करें'
  }
};
