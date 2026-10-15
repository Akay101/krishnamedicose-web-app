const Notification = require('../models/Notification');
const ServiceUser = require('../models/ServiceUser');
const { calculateDistanceKm } = require('../utils/geoUtils');
const SibApiV3Sdk = require('sib-api-v3-sdk');

let apiInstance = null;
if (process.env.BREVO_API_KEY) {
  try {
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  } catch (err) {
    console.warn('Brevo Mail Client Init Warning:', err.message);
  }
}

const escapeHtml = (unsafe) => {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Send Transactional Email with clean HTML template
 */
const sendEmailSafely = async ({ to, subject, title, bodyContent }) => {
  if (!to || !process.env.BREVO_API_KEY || !apiInstance) {
    console.log(`[EMAIL SIMULATION] To: ${to} | Subject: ${subject}`);
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8" /></head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#1e293b;">
      <div style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 20px rgba(0,0,0,0.05);">
        <div style="background:linear-gradient(135deg,#0f766e,#0e7490);padding:32px 24px;text-align:center;color:#ffffff;">
          <h1 style="margin:0;font-size:24px;font-weight:bold;">Krishna Medicose Services</h1>
          <p style="margin:6px 0 0;font-size:14px;color:#ccfbf1;">Pharmacy & Doctor Network</p>
        </div>
        <div style="padding:28px 24px;">
          <h2 style="margin:0 0 16px;color:#0f172a;font-size:18px;">${title}</h2>
          <div style="font-size:14px;line-height:1.6;color:#334155;">
            ${bodyContent}
          </div>
          <div style="margin-top:28px;padding-top:20px;border-top:1px solid #f1f5f9;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              Krishna Medicose Healthcare Platform - Log in to view full details
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const sendSmtpEmail = {
      sender: {
        email: process.env.MAIL_FROM || 'support@krishnamedicose.in',
        name: process.env.MAIL_FROM_NAME || 'Krishna Medicose Services',
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    };
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`Email successfully sent to: ${to}`);
  } catch (err) {
    console.error('Failed to send email:', err.response?.body || err.message);
  }
};

/**
 * 1. Notify Pharmacists when a new Job is posted
 */
const notifyPharmacistsOfNewJob = async (job, owner) => {
  try {
    const jobLng = job.location?.coordinates?.[0];
    const jobLat = job.location?.coordinates?.[1];
    const radius = job.visibilityRadiusKm || 50;

    // Find active open-to-work pharmacists
    const pharmacists = await ServiceUser.find({
      role: 'job_seeker_pharmacist',
      isOpenToWork: true,
      isBlocked: false
    });

    const matchedPharmacists = pharmacists.filter((p) => {
      const pLng = p.location?.coordinates?.[0];
      const pLat = p.location?.coordinates?.[1];
      if (jobLat && jobLng && pLat && pLng) {
        const dist = calculateDistanceKm(jobLat, jobLng, pLat, pLng);
        return dist === null || dist <= radius * 1.5;
      }
      return true;
    });

    for (const pharmacist of matchedPharmacists) {
      // In-app notification
      await Notification.create({
        userId: pharmacist._id,
        title: 'New Pharmacy Job Nearby',
        message: `${job.pharmacyName} posted a new job vacancy: ${job.title} (${job.salaryRange || 'Good Salary'}).`,
        type: 'job_posted',
        link: '/services'
      });

      // Email notification
      if (pharmacist.email) {
        sendEmailSafely({
          to: pharmacist.email,
          subject: `New Job Opportunity: ${job.title} at ${job.pharmacyName}`,
          title: `New Job Opening in Your Area`,
          bodyContent: `
            <p>Hello <strong>${pharmacist.name}</strong>,</p>
            <p>A new pharmacy job has just been posted matching your profile:</p>
            <div style="background:#f1f5f9;padding:16px;border-radius:12px;margin:16px 0;">
              <p style="margin:4px 0;"><strong>Job Title:</strong> ${job.title}</p>
              <p style="margin:4px 0;"><strong>Pharmacy:</strong> ${job.pharmacyName}</p>
              <p style="margin:4px 0;"><strong>Location:</strong> ${job.location?.city || 'Local Area'}</p>
              <p style="margin:4px 0;"><strong>Salary:</strong> ${job.salaryRange || 'Competitive'}</p>
              <p style="margin:4px 0;"><strong>Shift:</strong> ${job.jobType}</p>
            </div>
            <p>Log in to your account to review the opening and submit your application with one click.</p>
          `
        });
      }
    }
  } catch (err) {
    console.error('Error in notifyPharmacistsOfNewJob:', err);
  }
};

/**
 * 2. Notify Pharmacy Owner when a Pharmacist applies
 */
const notifyOwnerOfJobApplication = async (application, job, applicant) => {
  try {
    // In-app notification
    await Notification.create({
      userId: job.ownerId,
      title: 'New Candidate Application',
      message: `${applicant.name} applied for "${job.title}". Mobile: ${applicant.mobile}.`,
      type: 'job_application',
      link: '/services'
    });

    // Email to owner
    const owner = await ServiceUser.findById(job.ownerId);
    if (owner && owner.email) {
      sendEmailSafely({
        to: owner.email,
        subject: `New Application for ${job.title}: ${applicant.name}`,
        title: `Candidate Application Received`,
        bodyContent: `
          <p>Hello <strong>${owner.name}</strong>,</p>
          <p>A certified pharmacist has applied for your vacancy <strong>"${job.title}"</strong>:</p>
          <div style="background:#f1f5f9;padding:16px;border-radius:12px;margin:16px 0;">
            <p style="margin:4px 0;"><strong>Candidate Name:</strong> ${applicant.name}</p>
            <p style="margin:4px 0;"><strong>Contact Phone:</strong> ${applicant.mobile}</p>
            <p style="margin:4px 0;"><strong>Email:</strong> ${applicant.email}</p>
            <p style="margin:4px 0;"><strong>Qualification:</strong> ${application.qualification || applicant.pharmacistDetails?.qualification || 'B.Pharm'}</p>
            <p style="margin:4px 0;"><strong>Experience:</strong> ${application.experienceYears || applicant.pharmacistDetails?.experienceYears || 0} Years</p>
          </div>
          ${application.coverNote ? `<p style="font-style:italic;">"${application.coverNote}"</p>` : ''}
          <p>You can view their full profile, license document, and shortlist them in your Services dashboard.</p>
        `
      });
    }
  } catch (err) {
    console.error('Error in notifyOwnerOfJobApplication:', err);
  }
};

/**
 * 3. Notify Applicant of status update
 */
const notifyApplicantOfStatusUpdate = async (application, job, newStatus) => {
  try {
    const statusLabels = {
      shortlisted: 'Shortlisted',
      reviewed: 'Reviewed',
      rejected: 'Declined'
    };

    const label = statusLabels[newStatus] || newStatus;

    await Notification.create({
      userId: application.applicantId,
      title: `Application ${label}`,
      message: `Your application for "${job.title}" at ${job.pharmacyName} was marked as ${label}.`,
      type: 'application_status',
      link: '/services'
    });

    const applicant = await ServiceUser.findById(application.applicantId);
    if (applicant && applicant.email) {
      sendEmailSafely({
        to: applicant.email,
        subject: `Application Update: ${job.title} at ${job.pharmacyName}`,
        title: `Application Status Changed to ${label}`,
        bodyContent: `
          <p>Hello <strong>${applicant.name}</strong>,</p>
          <p>The pharmacy owner has updated the status of your application for <strong>${job.title}</strong> at <strong>${job.pharmacyName}</strong>.</p>
          <p style="font-size:16px;color:#0f766e;font-weight:bold;">Status: ${label}</p>
          <p>Log in to your account for more information and next steps.</p>
        `
      });
    }
  } catch (err) {
    console.error('Error in notifyApplicantOfStatusUpdate:', err);
  }
};

/**
 * 4. Notify Doctors when a new Collaboration Post is published
 */
const notifyDoctorsOfNewCollab = async (collab, owner) => {
  try {
    const cLng = collab.location?.coordinates?.[0];
    const cLat = collab.location?.coordinates?.[1];
    const radius = collab.visibilityRadiusKm || 50;

    const doctors = await ServiceUser.find({
      role: 'doctor',
      isOpenToCollaborate: true,
      isBlocked: false
    });

    const matchedDoctors = doctors.filter((doc) => {
      const dLng = doc.location?.coordinates?.[0];
      const dLat = doc.location?.coordinates?.[1];
      if (cLat && cLng && dLat && dLng) {
        const dist = calculateDistanceKm(cLat, cLng, dLat, dLng);
        return dist === null || dist <= radius * 1.5;
      }
      return true;
    });

    for (const doc of matchedDoctors) {
      await Notification.create({
        userId: doc._id,
        title: 'New Clinic Chamber Opportunity',
        message: `${collab.pharmacyName} is seeking a ${collab.specializationNeeded} for their consultation chamber.`,
        type: 'collab_posted',
        link: '/services'
      });

      if (doc.email) {
        sendEmailSafely({
          to: doc.email,
          subject: `New Doctor Collaboration: ${collab.pharmacyName} (${collab.specializationNeeded})`,
          title: `Clinic Consultation Chamber Opportunity`,
          bodyContent: `
            <p>Hello <strong>Dr. ${doc.name}</strong>,</p>
            <p>A new consultation chamber collaboration listing has been created in your area:</p>
            <div style="background:#f1f5f9;padding:16px;border-radius:12px;margin:16px 0;">
              <p style="margin:4px 0;"><strong>Facility:</strong> ${collab.pharmacyName}</p>
              <p style="margin:4px 0;"><strong>Specialization Needed:</strong> ${collab.specializationNeeded}</p>
              <p style="margin:4px 0;"><strong>Timings:</strong> ${collab.preferredTimings}</p>
              <p style="margin:4px 0;"><strong>Terms:</strong> ${collab.collaborationTerms}</p>
              <p style="margin:4px 0;"><strong>Location:</strong> ${collab.location?.city || 'Local Area'}</p>
            </div>
            <p>Log in to your account to review the facilities and propose your consultation timings.</p>
          `
        });
      }
    }
  } catch (err) {
    console.error('Error in notifyDoctorsOfNewCollab:', err);
  }
};

/**
 * 5. Notify Owner when a Doctor submits an inquiry
 */
const notifyOwnerOfDoctorInquiry = async (inquiry, collab, doctor) => {
  try {
    await Notification.create({
      userId: collab.ownerId,
      title: 'New Doctor Proposal Received',
      message: `Dr. ${doctor.name} (${inquiry.specialization || 'Doctor'}) submitted a collaboration proposal. Phone: ${inquiry.doctorMobile}.`,
      type: 'collab_inquiry',
      link: '/services'
    });

    const owner = await ServiceUser.findById(collab.ownerId);
    if (owner && owner.email) {
      sendEmailSafely({
        to: owner.email,
        subject: `New Doctor Proposal: Dr. ${doctor.name} for ${collab.pharmacyName}`,
        title: `Doctor Collaboration Proposal`,
        bodyContent: `
          <p>Hello <strong>${owner.name}</strong>,</p>
          <p>A certified medical doctor has inquired about your consultation chamber listing:</p>
          <div style="background:#f1f5f9;padding:16px;border-radius:12px;margin:16px 0;">
            <p style="margin:4px 0;"><strong>Doctor Name:</strong> Dr. ${doctor.name}</p>
            <p style="margin:4px 0;"><strong>Specialization:</strong> ${inquiry.specialization}</p>
            <p style="margin:4px 0;"><strong>Phone:</strong> ${inquiry.doctorMobile}</p>
            <p style="margin:4px 0;"><strong>Proposed Timings:</strong> ${inquiry.proposedTimings}</p>
          </div>
          ${inquiry.message ? `<p style="font-style:italic;">"${inquiry.message}"</p>` : ''}
          <p>Log in to your dashboard to connect with the doctor and confirm chamber setup.</p>
        `
      });
    }
  } catch (err) {
    console.error('Error in notifyOwnerOfDoctorInquiry:', err);
  }
};

/**
 * 6. Notify Doctor of Inquiry Status Update
 */
const notifyDoctorOfInquiryStatusUpdate = async (inquiry, collab, newStatus) => {
  try {
    const statusLabels = {
      accepted: 'Accepted',
      contacted: 'Contacted',
      declined: 'Declined'
    };
    const label = statusLabels[newStatus] || newStatus;

    await Notification.create({
      userId: inquiry.doctorId,
      title: `Collaboration ${label}`,
      message: `${collab.pharmacyName} marked your proposal as ${label}.`,
      type: 'inquiry_status',
      link: '/services'
    });

    const doctor = await ServiceUser.findById(inquiry.doctorId);
    if (doctor && doctor.email) {
      sendEmailSafely({
        to: doctor.email,
        subject: `Collaboration Update from ${collab.pharmacyName}`,
        title: `Proposal Status: ${label}`,
        bodyContent: `
          <p>Hello <strong>Dr. ${doctor.name}</strong>,</p>
          <p>Your collaboration proposal for <strong>${collab.pharmacyName}</strong> has been marked as <strong>${label}</strong>.</p>
          <p>Log in to your account for contact details and updates.</p>
        `
      });
    }
  } catch (err) {
    console.error('Error in notifyDoctorOfInquiryStatusUpdate:', err);
  }
};

/**
 * 7. Send Security OTP Email for Sign In / Registration
 */
const sendOtpEmail = async ({ to, otp, purpose, userName }) => {
  const isRegister = purpose === 'register';
  const subject = isRegister
    ? `Your Registration Verification Code: ${otp} - Krishna Medicose`
    : `Your Sign In Verification Code: ${otp} - Krishna Medicose`;

  const title = isRegister
    ? 'Verify Your Email Address'
    : 'Two-Step Sign In Verification';

  const bodyContent = `
    <p>Hello${userName ? ' <strong>' + escapeHtml(userName) + '</strong>' : ''},</p>
    <p>Please use the following 6-digit verification code to complete your ${isRegister ? 'account registration' : 'sign in'}:</p>
    <div style="margin:24px 0;padding:20px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;text-align:center;">
      <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#0f766e;font-family:monospace;">${escapeHtml(otp)}</span>
    </div>
    <p style="font-size:13px;color:#64748b;margin:12px 0;">This security code is valid for <strong>10 minutes</strong> and can only be used once.</p>
    <p style="font-size:13px;color:#64748b;margin:0;">If you did not request this verification code, please ignore this email or secure your account.</p>
  `;

  return sendEmailSafely({ to, subject, title, bodyContent });
};

/**
 * 8. Send Job Post Confirmation Email to Owner
 */
const sendJobPostConfirmationEmail = async (job, owner) => {
  if (!owner || !owner.email) return;

  const subject = `Job Vacancy Published Successfully: ${job.title}`;
  const title = 'Your Pharmacist Vacancy is Now Live';

  const bodyContent = `
    <p>Hello <strong>${escapeHtml(owner.name)}</strong>,</p>
    <p>Your job vacancy post for <strong>${escapeHtml(job.pharmacyName)}</strong> has been published successfully on Krishna Medicose.</p>
    
    <div style="background:#f8fafc;padding:16px;border-radius:12px;border:1px solid #e2e8f0;margin:18px 0;font-size:13px;color:#334155;">
      <p style="margin:4px 0;"><strong>Job Role:</strong> ${escapeHtml(job.title)}</p>
      <p style="margin:4px 0;"><strong>Job Type:</strong> ${escapeHtml(job.jobType)}</p>
      <p style="margin:4px 0;"><strong>Salary:</strong> ${escapeHtml(job.salaryRange)}</p>
      <p style="margin:4px 0;"><strong>Work Timings:</strong> ${escapeHtml(job.workTimings)}</p>
      <p style="margin:4px 0;"><strong>Required Qualification:</strong> ${escapeHtml(job.requiredQualification)}</p>
      <p style="margin:4px 0;"><strong>Location:</strong> ${escapeHtml(job.location?.city)}, ${escapeHtml(job.location?.state)}</p>
      <p style="margin:4px 0;"><strong>Operational Radius:</strong> Within ${escapeHtml(job.visibilityRadiusKm)} km</p>
    </div>

    <div style="background:#ecfdf5;border-left:4px solid #10b981;padding:12px 16px;margin:18px 0;border-radius:4px;">
      <p style="margin:0;font-size:13px;color:#065f46;font-weight:600;">
        We will notify you via email and in-app alert as soon as any candidate applies to your job post.
      </p>
    </div>

    <p style="margin-top:16px;font-size:13px;color:#475569;">
      <strong>Explore Nearby Talent:</strong> You can also browse open-to-work pharmacists in your nearby area from your dashboard to connect with them directly.
    </p>
  `;

  return sendEmailSafely({ to: owner.email, subject, title, bodyContent });
};

/**
 * 9. Send Doctor Collaboration Confirmation Email to Owner
 */
const sendCollabPostConfirmationEmail = async (collab, owner) => {
  if (!owner || !owner.email) return;

  const subject = `Doctor Collaboration Listing Published: ${collab.specializationNeeded}`;
  const title = 'Your Doctor Collaboration Listing is Now Live';

  const bodyContent = `
    <p>Hello <strong>${escapeHtml(owner.name)}</strong>,</p>
    <p>Your doctor collaboration request has been published successfully on Krishna Medicose.</p>

    <div style="background:#f8fafc;padding:16px;border-radius:12px;border:1px solid #e2e8f0;margin:18px 0;font-size:13px;color:#334155;">
      <p style="margin:4px 0;"><strong>Specialization Needed:</strong> ${escapeHtml(collab.specializationNeeded)}</p>
      <p style="margin:4px 0;"><strong>Pharmacy / Clinic:</strong> ${escapeHtml(collab.pharmacyName)}</p>
      <p style="margin:4px 0;"><strong>Preferred Timings:</strong> ${escapeHtml(collab.preferredTimings)}</p>
      <p style="margin:4px 0;"><strong>Consultation Days:</strong> ${escapeHtml(collab.consultationDays)}</p>
      <p style="margin:4px 0;"><strong>Collaboration Terms:</strong> ${escapeHtml(collab.collaborationTerms)}</p>
      <p style="margin:4px 0;"><strong>Location:</strong> ${escapeHtml(collab.location?.city)}, ${escapeHtml(collab.location?.state)}</p>
      <p style="margin:4px 0;"><strong>Operational Radius:</strong> Within ${escapeHtml(collab.visibilityRadiusKm)} km</p>
    </div>

    <div style="background:#ecfdf5;border-left:4px solid #10b981;padding:12px 16px;margin:18px 0;border-radius:4px;">
      <p style="margin:0;font-size:13px;color:#065f46;font-weight:600;">
        We will notify you via email and in-app alert as soon as any doctor responds or connects with your post.
      </p>
    </div>

    <p style="margin-top:16px;font-size:13px;color:#475569;">
      <strong>Explore Nearby Talent:</strong> You can also explore doctors available for collaboration in your area directly from your dashboard.
    </p>
  `;

  return sendEmailSafely({ to: owner.email, subject, title, bodyContent });
};

module.exports = {
  notifyPharmacistsOfNewJob,
  notifyOwnerOfJobApplication,
  notifyApplicantOfStatusUpdate,
  notifyDoctorsOfNewCollab,
  notifyOwnerOfDoctorInquiry,
  notifyDoctorOfInquiryStatusUpdate,
  sendOtpEmail,
  sendJobPostConfirmationEmail,
  sendCollabPostConfirmationEmail,
  escapeHtml
};
