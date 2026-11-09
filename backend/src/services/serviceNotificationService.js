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
  const isForgot = purpose === 'forgot_password';

  let subject = `Your Sign In Verification Code: ${otp} - Krishna Medicose`;
  let title = 'Two-Step Sign In Verification';
  let actionText = 'sign in';

  if (isRegister) {
    subject = `Your Registration Verification Code: ${otp} - Krishna Medicose`;
    title = 'Verify Your Email Address';
    actionText = 'account registration';
  } else if (isForgot) {
    subject = `Your Password Reset Code: ${otp} - Krishna Medicose`;
    title = 'Reset Your Password';
    actionText = 'password reset';
  }

  const bodyContent = `
    <p>Hello${userName ? ' <strong>' + escapeHtml(userName) + '</strong>' : ''},</p>
    <p>Please use the following 6-digit verification code to complete your ${actionText}:</p>
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

/**
 * ===================== LISTING MODERATION =====================
 * Every member submission (job vacancy, doctor chamber, distributor entry)
 * is reviewed by the Krishna Medicose team before it goes public.
 */
const LISTING_LABELS = {
  job: 'pharmacist job vacancy',
  collab: 'doctor chamber / clinic collaboration',
  distributor: 'distributor directory entry',
  doctor_request: 'chamber requirement (doctor looking for a chamber)'
};

const detailsTable = (rows = []) =>
  `<div style="background:#f8fafc;padding:16px;border-radius:12px;border:1px solid #e2e8f0;margin:18px 0;font-size:13px;color:#334155;">${rows
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `<p style="margin:4px 0;"><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}</p>`)
    .join('')}</div>`;

const createInAppNotification = async (userId, title, message) => {
  if (!userId) return;
  try {
    await Notification.create({ userId, title, message, type: 'listing_review', link: '/services' });
  } catch (err) {
    console.error('In-app listing notification failed:', err.message);
  }
};

/** Submitter confirmation: received, pending verification */
const sendListingSubmittedEmail = async ({ kind, to, name, userId, heading, rows, isUpdate = false }) => {
  const label = LISTING_LABELS[kind] || 'listing';
  const subject = isUpdate
    ? `Changes received - ${heading} (verification pending)`
    : `Submission received - ${heading} (verification pending)`;
  const bodyContent = `
    <p>Hello <strong>${escapeHtml(name || 'there')}</strong>,</p>
    <p>Thank you! Your ${escapeHtml(label)} <strong>${escapeHtml(heading)}</strong> has been ${isUpdate ? 'updated' : 'submitted'} successfully.</p>
    ${detailsTable(rows)}
    <div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:12px 16px;margin:18px 0;border-radius:4px;">
      <p style="margin:0;font-size:13px;color:#92400e;font-weight:600;">
        Status: Verification pending. The Krishna Medicose team will review it shortly. It becomes visible to members only after approval, and we will email you as soon as it is verified.
      </p>
    </div>`;
  await createInAppNotification(
    userId,
    isUpdate ? 'Changes sent for verification' : 'Submission received',
    `Your ${label} "${heading}" is pending verification by Krishna Medicose.`
  );
  return sendEmailSafely({ to, subject, title: isUpdate ? 'Changes received - verification pending' : 'Submission received - verification pending', bodyContent });
};

/** Submitter result: approved (verified) or rejected with reason */
const sendListingReviewedEmail = async ({ kind, to, name, userId, heading, approved, note }) => {
  const label = LISTING_LABELS[kind] || 'listing';
  const subject = approved ? `Verified & live: ${heading}` : `Update on your submission: ${heading}`;
  const bodyContent = approved
    ? `
    <p>Hello <strong>${escapeHtml(name || 'there')}</strong>,</p>
    <p>Great news! Your ${escapeHtml(label)} <strong>${escapeHtml(heading)}</strong> has been reviewed and <strong>verified by Krishna Medicose</strong>.</p>
    <div style="background:#ecfdf5;border-left:4px solid #10b981;padding:12px 16px;margin:18px 0;border-radius:4px;">
      <p style="margin:0;font-size:13px;color:#065f46;font-weight:600;">It is now live with a "Verified by Krishna Medicose" badge and visible to members.</p>
    </div>
    ${note ? `<p style="font-size:13px;"><strong>Note from our team:</strong> ${escapeHtml(note)}</p>` : ''}`
    : `
    <p>Hello <strong>${escapeHtml(name || 'there')}</strong>,</p>
    <p>Your ${escapeHtml(label)} <strong>${escapeHtml(heading)}</strong> could not be approved in its current form.</p>
    <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:12px 16px;margin:18px 0;border-radius:4px;">
      <p style="margin:0;font-size:13px;color:#991b1b;font-weight:600;">Reason: ${escapeHtml(note || 'The submission did not meet our listing guidelines.')}</p>
    </div>
    <p style="font-size:13px;">You can edit the listing from your dashboard and it will be sent for review again.</p>`;
  await createInAppNotification(
    userId,
    approved ? 'Listing verified' : 'Listing not approved',
    approved
      ? `Your ${label} "${heading}" is verified and now live.`
      : `Your ${label} "${heading}" was not approved${note ? `: ${note}` : '.'}`
  );
  return sendEmailSafely({ to, subject, title: approved ? 'Your listing is verified and live' : 'Your listing needs changes', bodyContent });
};

/** Alert the Krishna Medicose admin inbox about a new submission awaiting review */
const notifyAdminOfListingSubmission = async ({ kind, heading, submitterName, submitterEmail, rows, isUpdate = false }) => {
  const to = process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL;
  if (!to) return;
  const label = LISTING_LABELS[kind] || 'listing';
  const bodyContent = `
    <p>A member ${isUpdate ? 'edited' : 'submitted'} a ${escapeHtml(label)} that needs verification.</p>
    ${detailsTable([['Listing', heading], ['Submitted by', submitterName], ['Email', submitterEmail], ...(rows || [])])}
    <p style="font-size:13px;"><strong>Action required:</strong> open the Admin Panel to approve or reject it.</p>`;
  return sendEmailSafely({ to, subject: `[Review needed] New ${label}: ${heading}`, title: 'New submission awaiting verification', bodyContent });
};

/** Doctor: a pharmacy / clinic offered a chamber for their requirement */
const notifyDoctorOfChamberOffer = async ({ doctor, request, response, chamber }) => {
  const bodyContent = `
    <p>Hello <strong>Dr. ${escapeHtml(doctor.name)}</strong>,</p>
    <p><strong>${escapeHtml(response.pharmacyName)}</strong> has offered a chamber for your requirement <strong>${escapeHtml(request.title)}</strong>.</p>
    ${detailsTable([
      ['Message', response.message],
      ['Chamber', chamber ? chamber.clinicOrChamberName || chamber.pharmacyName : ''],
      ['Timings offered', chamber?.preferredTimings],
      ['Terms', chamber?.collaborationTerms],
      ['Contact', `${response.responderName} - ${response.responderMobile}`],
      ['Email', response.responderEmail]
    ])}
    <p style="font-size:13px;">Sign in to your Krishna Medicose account to accept or decline the offer.</p>`;
  return sendEmailSafely({ to: doctor.email, subject: `New chamber offer from ${response.pharmacyName}`, title: 'A pharmacy offered you a chamber', bodyContent });
};

/** Pharmacies near a newly verified doctor requirement */
const notifyPharmaciesOfDoctorRequest = async (request, doctor) => {
  try {
    const [rLng, rLat] = request.location?.coordinates || [];
    const radius = Math.max(10, Math.min(50, request.searchRadiusKm || 15) * 1.5);
    const owners = await ServiceUser.find({ role: { $in: ['pharmacy_owner', 'general_user'] }, isBlocked: false }).select('name email location');
    const nearby = owners.filter((o) => {
      const [oLng, oLat] = o.location?.coordinates || [];
      return rLat !== undefined && oLat !== undefined && calculateDistanceKm(rLat, rLng, oLat, oLng) <= radius;
    }).slice(0, 200);
    for (const owner of nearby) {
      await Notification.create({
        userId: owner._id,
        title: 'Doctor looking for a chamber nearby',
        message: `Dr. ${doctor.name} (${request.specialization}) is looking for a chamber near ${request.location?.city || 'you'}.`,
        type: 'collab_posted',
        link: '/services'
      }).catch(() => {});
      await sendEmailSafely({
        to: owner.email,
        subject: `Doctor looking for a chamber near you: ${request.specialization}`,
        title: 'A verified doctor is looking for a chamber',
        bodyContent: `<p>Hello <strong>${escapeHtml(owner.name)}</strong>,</p>
          <p>Dr. ${escapeHtml(doctor.name)} (${escapeHtml(request.specialization)}) is looking for a chamber near <strong>${escapeHtml(request.location?.city || 'your area')}</strong>.</p>
          ${detailsTable([['Preferred timings', request.preferredTimings], ['Expected terms', request.expectedTerms]])}
          <p style="font-size:13px;">Sign in to Krishna Medicose Services to offer your chamber.</p>`
      });
    }
  } catch (err) {
    console.error('Notify pharmacies of doctor request error:', err.message);
  }
};

/** Member profile verification result (used for doctors, pharmacists and pharmacies) */
const sendProfileVerificationEmail = async (user, verified) => {
  if (!user?.email) return;
  const isDoctor = user.role === 'doctor';
  await createInAppNotification(
    user._id,
    verified ? 'Profile verified' : 'Profile verification removed',
    verified
      ? `Your profile is verified by Krishna Medicose.${isDoctor ? ' You can now send proposals to pharmacy chambers.' : ''}`
      : 'Your profile verification was removed. Please contact Krishna Medicose support.'
  );
  return sendEmailSafely({
    to: user.email,
    subject: verified ? 'Your Krishna Medicose profile is verified' : 'Update on your profile verification',
    title: verified ? 'Profile verified' : 'Profile verification update',
    bodyContent: verified
      ? `<p>Hello <strong>${escapeHtml(isDoctor ? `Dr. ${user.name}` : user.name)}</strong>,</p>
         <p>Your profile has been reviewed and <strong>verified by Krishna Medicose</strong>.</p>
         ${isDoctor ? '<p style="font-size:13px;">You can now apply to verified pharmacy / clinic chambers and your profile shows a verified badge.</p>' : ''}`
      : `<p>Hello <strong>${escapeHtml(user.name)}</strong>,</p><p>Your profile verification has been removed. Please contact us if you think this is a mistake.</p>`
  });
};

/** New doctor registered: doctor is told verification is pending, admin is asked to verify */
const announceDoctorRegistration = async (doctor) => {
  await createInAppNotification(doctor._id, 'Profile verification pending', 'The Krishna Medicose team will verify your medical registration shortly.');
  await sendEmailSafely({
    to: doctor.email,
    subject: 'Welcome to Krishna Medicose - profile verification pending',
    title: 'Your doctor profile is under verification',
    bodyContent: `<p>Hello <strong>Dr. ${escapeHtml(doctor.name)}</strong>,</p>
      <p>Thank you for joining. Our team will verify your medical registration details. You can post your chamber requirement right away; applying to pharmacy chambers unlocks once your profile is verified. We will email you as soon as it's done.</p>`
  });
  const to = process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL;
  if (to) {
    await sendEmailSafely({
      to,
      subject: `[Review needed] New doctor profile: Dr. ${doctor.name}`,
      title: 'New doctor profile awaiting verification',
      bodyContent: `${detailsTable([
        ['Name', `Dr. ${doctor.name}`],
        ['Email', doctor.email],
        ['Mobile', doctor.mobile],
        ['Specialization', doctor.doctorDetails?.specialization],
        ['Qualification', doctor.doctorDetails?.qualification],
        ['Medical registration no.', doctor.doctorDetails?.medicalRegistrationNumber]
      ])}<p style="font-size:13px;">Open Admin → Members & Listings → Users to verify the profile.</p>`
    });
  }
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
  sendListingSubmittedEmail,
  sendListingReviewedEmail,
  notifyAdminOfListingSubmission,
  notifyDoctorOfChamberOffer,
  notifyPharmaciesOfDoctorRequest,
  sendProfileVerificationEmail,
  announceDoctorRegistration,
  escapeHtml
};
