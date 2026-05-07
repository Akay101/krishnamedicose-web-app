const nodemailer = require("nodemailer");

/**
 * Transporter Configuration
 * Using Brevo SMTP with robust timeout settings
 */
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp-relay.brevo.com",
  port: parseInt(process.env.MAIL_PORT || 587),
  secure: process.env.MAIL_PORT == 465, 
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 20000, // 20 seconds
  greetingTimeout: 20000,
  socketTimeout: 20000,
});

/**
 * Reusable Email Layout
 */
const createEmailLayout = ({ title, subtitle, content }) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
    <div style="max-width:700px;margin:40px auto;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.08);">
      <div style="background:linear-gradient(135deg,#00D1FF,#2dd4bf);padding:50px 40px;text-align:center;">
        <h1 style="margin:0;color:#02131a;font-size:34px;font-weight:800;">Krishna Medicose</h1>
        <p style="margin-top:12px;color:#083344;font-size:16px;">AI Powered Pharmacy Solutions</p>
      </div>
      <div style="padding:50px 40px;">
        <h2 style="margin-top:0;color:#0f172a;font-size:30px;font-weight:700;">${title}</h2>
        <p style="color:#64748b;font-size:16px;line-height:1.8;margin-bottom:35px;">${subtitle}</p>
        ${content}
      </div>
      <div style="background:#0f172a;padding:35px 25px;text-align:center;">
        <div style="margin-bottom:20px;">
          <a href="https://www.instagram.com/krishna1211pandit/?hl=en" style="display:inline-block;margin:0 10px;color:#ffffff;text-decoration:none;font-size:14px;">Instagram</a>
          <a href="https://www.youtube.com/@krishnamedicos12" style="display:inline-block;margin:0 10px;color:#ffffff;text-decoration:none;font-size:14px;">YouTube</a>
        </div>
        <p style="color:#94a3b8;font-size:12px;line-height:1.7;margin:0;">
          © ${new Date().getFullYear()} Krishna Medicose. All rights reserved.
          <br/>
          This is an automated email from Krishna Medicose.
        </p>
      </div>
    </div>
  </body>
  </html>
  `;
};

/**
 * Generic Mail Sender
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM}>`,
      to,
      subject,
      html,
    });
    console.log("Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("Nodemailer Error:", error);
    throw error;
  }
};

/**
 * ENQUIRY CONFIRMATION
 */
const sendConfirmationEmail = async (userEmail, userName) => {
  const html = createEmailLayout({
    title: `Hello ${userName},`,
    subtitle: "Thank you for contacting Krishna Medicose. We have successfully received your enquiry.",
    content: `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:30px;">
        <p style="margin:0;color:#334155;font-size:15px;line-height:1.8;">
          Our team is currently reviewing your request and will get back to you shortly with the best possible assistance.
          <br/><br/>
          We appreciate your trust in Krishna Medicose.
        </p>
      </div>
    `,
  });

  return sendEmail({
    to: userEmail,
    subject: "Enquiry Successfully Registered - Krishna Medicose",
    html,
  });
};

/**
 * ADMIN LEAD MAIL
 */
const sendAdminNotification = async (enquiryData) => {
  const html = createEmailLayout({
    title: "New Business Lead Received",
    subtitle: "A new enquiry has been submitted through your website.",
    content: `
      <table style="width:100%;border-collapse:collapse;overflow:hidden;border-radius:16px;">
        <tr><td style="padding:16px;background:#f8fafc;font-weight:bold;">Name</td><td style="padding:16px;background:#ffffff;">${enquiryData.name}</td></tr>
        <tr><td style="padding:16px;background:#f8fafc;font-weight:bold;">Email</td><td style="padding:16px;background:#ffffff;">${enquiryData.email}</td></tr>
        <tr><td style="padding:16px;background:#f8fafc;font-weight:bold;">Type</td><td style="padding:16px;background:#ffffff;">${enquiryData.type}</td></tr>
        <tr><td style="padding:16px;background:#f8fafc;font-weight:bold;">Description</td><td style="padding:16px;background:#ffffff;">${enquiryData.description}</td></tr>
      </table>
    `,
  });

  return sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject: `New Lead: ${enquiryData.name}`,
    html,
  });
};

/**
 * OTP EMAIL
 */
const sendOTPEmail = async (email, otp) => {
  const html = createEmailLayout({
    title: "Password Recovery",
    subtitle: "Securely reset your admin account password.",
    content: `
      <div style="background:#ffffff;padding:40px;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.05);text-align:center;">
        <p style="color:#334155;font-size:16px;margin-bottom:32px;">Use the following 6-digit code to verify your identity. This code is valid for 10 minutes.</p>
        <div style="background-color:#f1f5f9;padding:24px;border-radius:12px;font-size:40px;font-weight:bold;letter-spacing:12px;color:#0f172a;margin-bottom:32px;">
          ${otp}
        </div>
      </div>
    `,
  });

  return sendEmail({
    to: email,
    subject: "Verification Code - Krishna Medicose",
    html,
  });
};

/**
 * OFFER CONFIRMATION
 */
const sendOfferConfirmation = async (to, data) => {
  const html = createEmailLayout({
    title: "Registration Successful",
    subtitle: "Your registration for the exclusive Krishna Medicose offer has been completed successfully.",
    content: `
      <div style="background:linear-gradient(135deg,#ecfeff,#f0fdfa);border:1px solid #a5f3fc;padding:35px;border-radius:22px;text-align:center;">
        <p style="color:#0f766e;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">Registration ID</p>
        <h1 style="margin:10px 0 0 0;color:#0f172a;font-size:34px;letter-spacing:2px;">${data.registrationId}</h1>
      </div>
      <div style="margin-top:30px;">
        <p style="color:#334155;line-height:1.8;font-size:15px;">
          <strong>Name:</strong> ${data.userName}<br/><br/>
          <strong>Offer:</strong> ${data.offerTitle}<br/><br/>
          Our team will contact you shortly with further details.
        </p>
      </div>
    `,
  });

  return sendEmail({
    to,
    subject: `Registration Confirmed - ${data.offerTitle}`,
    html,
  });
};

/**
 * OFFER ADMIN MAIL
 */
const sendOfferLeadToAdmin = async (data) => {
  const detailsHtml = Object.entries(data.details)
    .map(([key, value]) => `
      <tr>
        <td style="padding:14px;background:#f8fafc;font-weight:bold;text-transform:capitalize;">${key.replace(/_/g, " ")}</td>
        <td style="padding:14px;background:#ffffff;">${value}</td>
      </tr>
    `).join("");

  const html = createEmailLayout({
    title: "New Offer Registration",
    subtitle: "A new user has successfully registered for an offer.",
    content: `
      <div style="margin-bottom:25px;padding:20px;background:#fefce8;border-radius:14px;border:1px solid #fde68a;">
        <strong>Registration ID:</strong> ${data.registrationId}
      </div>
      <table style="width:100%;border-collapse:collapse;overflow:hidden;border-radius:18px;">
        ${detailsHtml}
      </table>
    `,
  });

  return sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject: `New Offer Registration - ${data.offerTitle}`,
    html,
  });
};

module.exports = {
  sendEmail,
  sendConfirmationEmail,
  sendAdminNotification,
  sendOTPEmail,
  sendOfferConfirmation,
  sendOfferLeadToAdmin,
};
