const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM}>`,
      to,
      subject,
      html,
    });
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

const sendOTPEmail = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM}>`,
      to: email,
      subject: 'Password Recovery OTP - Krishna Medicose',
      html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #f9fbfd; border-radius: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #00D1FF; margin: 0; font-size: 28px;">Password Recovery</h1>
              <p style="color: #64748b; font-size: 16px;">Securely reset your admin account password</p>
            </div>
            
            <div style="background-color: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: center;">
              <p style="color: #334155; font-size: 16px; margin-bottom: 32px;">Use the following 6-digit code to verify your identity. This code is valid for 10 minutes.</p>
              
              <div style="background-color: #f1f5f9; padding: 24px; border-radius: 12px; font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #0f172a; margin-bottom: 32px;">
                ${otp}
              </div>
              
              <p style="color: #94a3b8; font-size: 14px;">If you did not request this code, please ignore this email or contact the root admin.</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 12px;">
              &copy; 2024 Krishna Medicose. All rights reserved.
            </div>
          </div>
        `,
    });
  } catch (error) {
    console.error('OTP Email error:', error);
  }
};

const sendConfirmationEmail = async (userEmail, userName) => {
  const html = `
    <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #f8fafc;">
      <div style="background-color: #2dd4bf; padding: 20px; border-radius: 15px; text-align: center;">
        <h1 style="color: #020617; margin: 0;">Krishna Medicose</h1>
      </div>
      <div style="padding: 20px; color: #1e293b;">
        <h2 style="color: #0d9488;">Hello ${userName},</h2>
        <p>Thank you for reaching out to Krishna Medicose! We have successfully registered your enquiry.</p>
        <p>Our team is reviewing your request and will get back to you shortly.</p>
        <div style="margin: 30px 0; padding: 20px; background-color: #ffffff; border-radius: 10px; border-left: 4px solid #2dd4bf;">
          <strong>Your enquiry is safe with us.</strong>
        </div>
        <p>Best regards,<br><strong>Team Krishna Medicose</strong></p>
      </div>
      <footer style="text-align: center; color: #64748b; font-size: 12px; margin-top: 20px;">
        © 2024 Krishna Medicose. All rights reserved.
      </footer>
    </div>
  `;
  return await sendEmail({ to: userEmail, subject: 'Enquiry Successfully Registered - Krishna Medicose', html });
};

const sendAdminNotification = async (enquiryData) => {
  const html = `
    <div style="font-family: sans-serif; padding: 20px; background-color: #f1f5f9;">
      <h2>New Business Lead!</h2>
      <p>A new enquiry has been submitted on the website.</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; border: 1px solid #cbd5e1;"><strong>Name</strong></td><td style="padding: 8px; border: 1px solid #cbd5e1;">${enquiryData.name}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #cbd5e1;"><strong>Email</strong></td><td style="padding: 8px; border: 1px solid #cbd5e1;">${enquiryData.email}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #cbd5e1;"><strong>Type</strong></td><td style="padding: 8px; border: 1px solid #cbd5e1;">${enquiryData.type}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #cbd5e1;"><strong>Description</strong></td><td style="padding: 8px; border: 1px solid #cbd5e1;">${enquiryData.description}</td></tr>
      </table>
      <p><a href="http://localhost:5173/admin" style="display: inline-block; padding: 10px 20px; background-color: #2dd4bf; color: #020617; text-decoration: none; border-radius: 5px;">View in Admin Panel</a></p>
    </div>
  `;
  return await sendEmail({ to: process.env.ADMIN_EMAIL, subject: 'New Lead: ' + enquiryData.name, html });
};

const sendOfferConfirmation = async (userEmail, { userName, offerTitle, registrationId, details }) => {
  const html = `
    <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: auto; padding: 30px; border-radius: 24px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-block; padding: 12px 24px; background-color: #2dd4bf; border-radius: 12px; color: #020617; font-weight: bold; font-size: 20px;">
          Registration Successful
        </div>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
        <h2 style="color: #0d9488; margin-top: 0;">Hi ${userName},</h2>
        <p style="color: #475569; line-height: 1.6;">You have successfully registered for the exclusive offer: <strong style="color: #0f172a;">${offerTitle}</strong>.</p>
        
        <div style="margin: 25px 0; padding: 25px; background-color: #f0fdfa; border-radius: 16px; border: 1px dashed #2dd4bf; text-align: center;">
          <p style="color: #0d9488; font-size: 14px; margin: 0 0 10px 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Your Registration ID</p>
          <h1 style="color: #0f172a; margin: 0; font-size: 28px; letter-spacing: 2px;">${registrationId}</h1>
        </div>

        <div style="color: #475569; font-size: 14px;">
          <p>Our team will reach out to you shortly with the next steps.</p>
        </div>
      </div>

      <footer style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
        <p>&copy; 2024 Krishna Medicose. All rights reserved.</p>
        <p style="font-size: 10px;">This is an automated confirmation. Please do not reply to this email.</p>
      </footer>
    </div>
  `;
  return await sendEmail({ to: userEmail, subject: `Registration Confirmed: ${offerTitle} [${registrationId}]`, html });
};

const sendOfferLeadToAdmin = async ({ offerTitle, registrationId, details }) => {
  const detailsHtml = Object.entries(details)
    .map(([key, value]) => {
      const isUrl = typeof value === 'string' && value.startsWith('http');
      const displayValue = isUrl 
        ? `<a href="${value}" style="display: inline-block; padding: 4px 12px; background-color: #f1f5f9; color: #0d9488; text-decoration: none; border-radius: 4px; font-weight: bold; border: 1px solid #e2e8f0;">View Document</a>`
        : value;
        
      return `<tr><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; text-transform: capitalize; color: #64748b;">${key.replace('_', ' ')}</td><td style="padding: 10px; border: 1px solid #e2e8f0; color: #0f172a;">${displayValue}</td></tr>`;
    })
    .join('');

  const html = `
    <div style="font-family: sans-serif; padding: 30px; background-color: #f1f5f9;">
      <h2 style="color: #0f172a;">🔥 New Offer Lead: ${offerTitle}</h2>
      <p style="color: #64748b;">A new user has registered for the offer. Details below:</p>
      
      <div style="background-color: #ffffff; padding: 20px; border-radius: 12px; margin: 20px 0;">
        <p style="margin-bottom: 20px;"><strong>Registration ID:</strong> <span style="background-color: #fef9c3; padding: 4px 8px; border-radius: 4px;">${registrationId}</span></p>
        <table style="width: 100%; border-collapse: collapse; background-color: #fff;">
          ${detailsHtml}
        </table>
      </div>
      
      <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/offers" style="display: inline-block; padding: 12px 24px; background-color: #2dd4bf; color: #020617; text-decoration: none; border-radius: 8px; font-weight: bold;">View in Admin Panel</a></p>
    </div>
  `;
  return await sendEmail({ to: process.env.ADMIN_EMAIL, subject: `Lead Alert: ${offerTitle} [${registrationId}]`, html });
};

module.exports = { sendEmail, sendConfirmationEmail, sendAdminNotification, sendOfferConfirmation, sendOfferLeadToAdmin };
