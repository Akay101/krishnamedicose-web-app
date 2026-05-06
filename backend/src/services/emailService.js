// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   host: process.env.MAIL_HOST,
//   port: parseInt(process.env.MAIL_PORT || 587),
//   secure: process.env.MAIL_PORT == 465, // true for 465, false for 587
//   auth: {
//     user: process.env.MAIL_USER,
//     pass: process.env.MAIL_PASS,
//   },
//   tls: {
//     rejectUnauthorized: false, // Helps with some cloud hosting provider certificate issues
//   },
//   connectionTimeout: 10000, // 10 seconds
//   greetingTimeout: 10000,
//   socketTimeout: 10000,
// });

// const sendEmail = async ({ to, subject, html }) => {
//   try {
//     const info = await transporter.sendMail({
//       from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM}>`,
//       to,
//       subject,
//       html,
//     });
//     console.log("Message sent: %s", info.messageId);
//     return info;
//   } catch (error) {
//     console.error("Error sending email:", error);
//     throw error;
//   }
// };

// const sendOTPEmail = async (email, otp) => {
//   try {
//     await transporter.sendMail({
//       from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM}>`,
//       to: email,
//       subject: "Password Recovery OTP - Krishna Medicose",
//       html: `
//           <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #f9fbfd; border-radius: 20px;">
//             <div style="text-align: center; margin-bottom: 30px;">
//               <h1 style="color: #00D1FF; margin: 0; font-size: 28px;">Password Recovery</h1>
//               <p style="color: #64748b; font-size: 16px;">Securely reset your admin account password</p>
//             </div>

//             <div style="background-color: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: center;">
//               <p style="color: #334155; font-size: 16px; margin-bottom: 32px;">Use the following 6-digit code to verify your identity. This code is valid for 10 minutes.</p>

//               <div style="background-color: #f1f5f9; padding: 24px; border-radius: 12px; font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #0f172a; margin-bottom: 32px;">
//                 ${otp}
//               </div>

//               <p style="color: #94a3b8; font-size: 14px;">If you did not request this code, please ignore this email or contact the root admin.</p>
//             </div>

//             <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 12px;">
//               &copy; 2024 Krishna Medicose. All rights reserved.
//             </div>
//           </div>
//         `,
//     });
//   } catch (error) {
//     console.error("OTP Email error:", error);
//   }
// };

// const sendConfirmationEmail = async (userEmail, userName) => {
//   const html = `
//     <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #f8fafc;">
//       <div style="background-color: #2dd4bf; padding: 20px; border-radius: 15px; text-align: center;">
//         <h1 style="color: #020617; margin: 0;">Krishna Medicose</h1>
//       </div>
//       <div style="padding: 20px; color: #1e293b;">
//         <h2 style="color: #0d9488;">Hello ${userName},</h2>
//         <p>Thank you for reaching out to Krishna Medicose! We have successfully registered your enquiry.</p>
//         <p>Our team is reviewing your request and will get back to you shortly.</p>
//         <div style="margin: 30px 0; padding: 20px; background-color: #ffffff; border-radius: 10px; border-left: 4px solid #2dd4bf;">
//           <strong>Your enquiry is safe with us.</strong>
//         </div>
//         <p>Best regards,<br><strong>Team Krishna Medicose</strong></p>
//       </div>
//       // <footer style="text-align: center; color: #64748b; font-size: 12px; margin-top: 20px;">
//       //   © 2024 Krishna Medicose. All rights reserved.
//       // </footer>
//     </div>
//   `;
//   return await sendEmail({
//     to: userEmail,
//     subject: "Enquiry Successfully Registered - Krishna Medicose",
//     html,
//   });
// };

// const sendAdminNotification = async (enquiryData) => {
//   const html = `
//     <div style="font-family: sans-serif; padding: 20px; background-color: #f1f5f9;">
//       <h2>New Business Lead!</h2>
//       <p>A new enquiry has been submitted on the website.</p>
//       <table style="width: 100%; border-collapse: collapse;">
//         <tr><td style="padding: 8px; border: 1px solid #cbd5e1;"><strong>Name</strong></td><td style="padding: 8px; border: 1px solid #cbd5e1;">${enquiryData.name}</td></tr>
//         <tr><td style="padding: 8px; border: 1px solid #cbd5e1;"><strong>Email</strong></td><td style="padding: 8px; border: 1px solid #cbd5e1;">${enquiryData.email}</td></tr>
//         <tr><td style="padding: 8px; border: 1px solid #cbd5e1;"><strong>Type</strong></td><td style="padding: 8px; border: 1px solid #cbd5e1;">${enquiryData.type}</td></tr>
//         <tr><td style="padding: 8px; border: 1px solid #cbd5e1;"><strong>Description</strong></td><td style="padding: 8px; border: 1px solid #cbd5e1;">${enquiryData.description}</td></tr>
//       </table>
//       <p><a href="http://localhost:5173/admin" style="display: inline-block; padding: 10px 20px; background-color: #2dd4bf; color: #020617; text-decoration: none; border-radius: 5px;">View in Admin Panel</a></p>
//     </div>
//   `;
//   return await sendEmail({
//     to: process.env.ADMIN_EMAIL,
//     subject: "New Lead: " + enquiryData.name,
//     html,
//   });
// };

// const sendOfferConfirmation = async (
//   userEmail,
//   { userName, offerTitle, registrationId, details }
// ) => {
//   const html = `
//     <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: auto; padding: 30px; border-radius: 24px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0;">
//       <div style="text-align: center; margin-bottom: 30px;">
//         <div style="display: inline-block; padding: 12px 24px; background-color: #2dd4bf; border-radius: 12px; color: #020617; font-weight: bold; font-size: 20px;">
//           Registration Successful
//         </div>
//       </div>

//       <div style="background-color: #ffffff; padding: 30px; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
//         <h2 style="color: #0d9488; margin-top: 0;">Hi ${userName},</h2>
//         <p style="color: #475569; line-height: 1.6;">You have successfully registered for the exclusive offer: <strong style="color: #0f172a;">${offerTitle}</strong>.</p>

//         <div style="margin: 25px 0; padding: 25px; background-color: #f0fdfa; border-radius: 16px; border: 1px dashed #2dd4bf; text-align: center;">
//           <p style="color: #0d9488; font-size: 14px; margin: 0 0 10px 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Your Registration ID</p>
//           <h1 style="color: #0f172a; margin: 0; font-size: 28px; letter-spacing: 2px;">${registrationId}</h1>
//         </div>

//         <div style="color: #475569; font-size: 14px;">
//           <p>Our team will reach out to you shortly with the next steps.</p>
//         </div>
//       </div>

//       <footer style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
//         <p>&copy; 2024 Krishna Medicose. All rights reserved.</p>
//         <p style="font-size: 10px;">This is an automated confirmation. Please do not reply to this email.</p>
//       </footer>
//     </div>
//   `;
//   return await sendEmail({
//     to: userEmail,
//     subject: `Registration Confirmed: ${offerTitle} [${registrationId}]`,
//     html,
//   });
// };

// const sendOfferLeadToAdmin = async ({
//   offerTitle,
//   registrationId,
//   details,
// }) => {
//   const detailsHtml = Object.entries(details)
//     .map(([key, value]) => {
//       const isUrl = typeof value === "string" && value.startsWith("http");
//       const displayValue = isUrl
//         ? `<a href="${value}" style="display: inline-block; padding: 4px 12px; background-color: #f1f5f9; color: #0d9488; text-decoration: none; border-radius: 4px; font-weight: bold; border: 1px solid #e2e8f0;">View Document</a>`
//         : value;

//       return `<tr><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; text-transform: capitalize; color: #64748b;">${key.replace("_", " ")}</td><td style="padding: 10px; border: 1px solid #e2e8f0; color: #0f172a;">${displayValue}</td></tr>`;
//     })
//     .join("");

//   const html = `
//     <div style="font-family: sans-serif; padding: 30px; background-color: #f1f5f9;">
//       <h2 style="color: #0f172a;">🔥 New Offer Lead: ${offerTitle}</h2>
//       <p style="color: #64748b;">A new user has registered for the offer. Details below:</p>

//       <div style="background-color: #ffffff; padding: 20px; border-radius: 12px; margin: 20px 0;">
//         <p style="margin-bottom: 20px;"><strong>Registration ID:</strong> <span style="background-color: #fef9c3; padding: 4px 8px; border-radius: 4px;">${registrationId}</span></p>
//         <table style="width: 100%; border-collapse: collapse; background-color: #fff;">
//           ${detailsHtml}
//         </table>
//       </div>

//       <p><a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/admin/offers" style="display: inline-block; padding: 12px 24px; background-color: #2dd4bf; color: #020617; text-decoration: none; border-radius: 8px; font-weight: bold;">View in Admin Panel</a></p>
//     </div>
//   `;
//   return await sendEmail({
//     to: process.env.ADMIN_EMAIL,
//     subject: `Lead Alert: ${offerTitle} [${registrationId}]`,
//     html,
//   });
// };

// module.exports = {
//   sendEmail,
//   sendConfirmationEmail,
//   sendAdminNotification,
//   sendOfferConfirmation,
//   sendOfferLeadToAdmin,
// };

const SibApiV3Sdk = require("sib-api-v3-sdk");

const defaultClient = SibApiV3Sdk.ApiClient.instance;

const apiKey = defaultClient.authentications["api-key"];

apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

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

  <body style="
    margin:0;
    padding:0;
    background:#f1f5f9;
    font-family:Arial,sans-serif;
  ">

    <div style="
      max-width:700px;
      margin:40px auto;
      background:#ffffff;
      border-radius:24px;
      overflow:hidden;
      box-shadow:0 10px 40px rgba(0,0,0,0.08);
    ">

      <!-- HEADER -->
      <div style="
        background:linear-gradient(135deg,#00D1FF,#2dd4bf);
        padding:50px 40px;
        text-align:center;
      ">
        <h1 style="
          margin:0;
          color:#02131a;
          font-size:34px;
          font-weight:800;
        ">
          Krishna Medicose
        </h1>

        <p style="
          margin-top:12px;
          color:#083344;
          font-size:16px;
        ">
          AI Powered Pharmacy Solutions
        </p>
      </div>

      <!-- BODY -->
      <div style="padding:50px 40px;">

        <h2 style="
          margin-top:0;
          color:#0f172a;
          font-size:30px;
          font-weight:700;
        ">
          ${title}
        </h2>

        <p style="
          color:#64748b;
          font-size:16px;
          line-height:1.8;
          margin-bottom:35px;
        ">
          ${subtitle}
        </p>

        ${content}

      </div>

      <!-- FOOTER -->
      <div style="
        background:#0f172a;
        padding:35px 25px;
        text-align:center;
      ">

        <div style="margin-bottom:20px;">
          <a
            href="https://www.instagram.com/krishna1211pandit/?hl=en"
            style="
              display:inline-block;
              margin:0 10px;
              color:#ffffff;
              text-decoration:none;
              font-size:14px;
            "
          >
            Instagram
          </a>

          <a
            href="https://www.youtube.com/@krishnamedicos12"
            style="
              display:inline-block;
              margin:0 10px;
              color:#ffffff;
              text-decoration:none;
              font-size:14px;
            "
          >
            YouTube
          </a>
        </div>

        <p style="
          color:#94a3b8;
          font-size:12px;
          line-height:1.7;
          margin:0;
        ">
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
    const sendSmtpEmail = {
      sender: {
        email: process.env.MAIL_FROM,
        name: process.env.MAIL_FROM_NAME,
      },

      to: [{ email: to }],

      subject,

      htmlContent: html,
    };

    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log("Email sent:", response.messageId);

    return response;
  } catch (error) {
    console.error(
      "Error sending email:",
      error.response?.body || error.message
    );

    throw error;
  }
};

/**
 * ENQUIRY CONFIRMATION
 */
const sendConfirmationEmail = async (userEmail, userName) => {
  const html = createEmailLayout({
    title: `Hello ${userName},`,
    subtitle:
      "Thank you for contacting Krishna Medicose. We have successfully received your enquiry.",

    content: `
      <div style="
        background:#f8fafc;
        border:1px solid #e2e8f0;
        border-radius:18px;
        padding:30px;
      ">
        <p style="
          margin:0;
          color:#334155;
          font-size:15px;
          line-height:1.8;
        ">
          Our team is currently reviewing your request and will get back to you shortly with the best possible assistance.
          <br/><br/>
          We appreciate your trust in Krishna Medicose.
        </p>
      </div>

      <div style="margin-top:35px;">
        <a
          href="https://www.instagram.com/krishna1211pandit/?hl=en"
          style="
            display:inline-block;
            background:#00D1FF;
            color:#02131a;
            text-decoration:none;
            padding:14px 28px;
            border-radius:12px;
            font-weight:700;
          "
        >
          Follow Us
        </a>
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
      <table style="
        width:100%;
        border-collapse:collapse;
        overflow:hidden;
        border-radius:16px;
      ">
        <tr>
          <td style="padding:16px;background:#f8fafc;font-weight:bold;">Name</td>
          <td style="padding:16px;background:#ffffff;">${enquiryData.name}</td>
        </tr>

        <tr>
          <td style="padding:16px;background:#f8fafc;font-weight:bold;">Email</td>
          <td style="padding:16px;background:#ffffff;">${enquiryData.email}</td>
        </tr>

        <tr>
          <td style="padding:16px;background:#f8fafc;font-weight:bold;">Type</td>
          <td style="padding:16px;background:#ffffff;">${enquiryData.type}</td>
        </tr>

        <tr>
          <td style="padding:16px;background:#f8fafc;font-weight:bold;">Description</td>
          <td style="padding:16px;background:#ffffff;">${enquiryData.description}</td>
        </tr>
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
 * OFFER CONFIRMATION
 */
const sendOfferConfirmation = async (to, data) => {
  const html = createEmailLayout({
    title: "Registration Successful",
    subtitle:
      "Your registration for the exclusive Krishna Medicose offer has been completed successfully.",

    content: `
      <div style="
        background:linear-gradient(135deg,#ecfeff,#f0fdfa);
        border:1px solid #a5f3fc;
        padding:35px;
        border-radius:22px;
        text-align:center;
      ">

        <p style="
          color:#0f766e;
          font-size:13px;
          letter-spacing:2px;
          text-transform:uppercase;
          font-weight:bold;
        ">
          Registration ID
        </p>

        <h1 style="
          margin:10px 0 0 0;
          color:#0f172a;
          font-size:34px;
          letter-spacing:2px;
        ">
          ${data.registrationId}
        </h1>

      </div>

      <div style="margin-top:30px;">
        <p style="
          color:#334155;
          line-height:1.8;
          font-size:15px;
        ">
          <strong>Name:</strong> ${data.userName}
          <br/><br/>

          <strong>Offer:</strong> ${data.offerTitle}

          <br/><br/>

          Our team will contact you shortly with further onboarding details.
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
    .map(
      ([key, value]) => `
      <tr>
        <td style="
          padding:14px;
          background:#f8fafc;
          font-weight:bold;
          text-transform:capitalize;
        ">
          ${key.replace(/_/g, " ")}
        </td>

        <td style="
          padding:14px;
          background:#ffffff;
        ">
          ${value}
        </td>
      </tr>
    `
    )
    .join("");

  const html = createEmailLayout({
    title: "New Offer Registration",
    subtitle: "A new user has successfully registered for an offer.",

    content: `
      <div style="
        margin-bottom:25px;
        padding:20px;
        background:#fefce8;
        border-radius:14px;
        border:1px solid #fde68a;
      ">
        <strong>Registration ID:</strong>
        ${data.registrationId}
      </div>

      <table style="
        width:100%;
        border-collapse:collapse;
        overflow:hidden;
        border-radius:18px;
      ">
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
  sendOfferConfirmation,
  sendOfferLeadToAdmin,
};
