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

/**
 * BUNDLE PURCHASE CONFIRMATION FOR USER
 */
const sendBundlePurchaseConfirmation = async (to, data) => {
  const html = createEmailLayout({
    title: "Medicine Data Bundle Purchased Successfully!",
    subtitle: "Thank you for your purchase. You now have access to the Popular Medicine Data Bundle.",
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
          Order ID
        </p>
        <h2 style="
          margin:10px 0 0 0;
          color:#0f172a;
          font-size:24px;
          font-family:monospace;
        ">
          ${data.orderId}
        </h2>
      </div>

      <div style="margin-top:30px;">
        <p style="
          color:#334155;
          line-height:1.8;
          font-size:15px;
        ">
          <strong>Customer Name:</strong> ${data.userName}
          <br/><br/>
          <strong>Amount Paid:</strong> ₹${data.amount}
          <br/><br/>
          <strong>Popular Medicine Data Bundle Access:</strong>
          <br/>
          For data security and anti-theft compliance, direct downloads are disabled. You can securely access and query the dataset on-screen through our interactive viewer.
          <br/><br/>
          Please log in using the email address you purchased the bundle with to receive your secure verification OTP.
        </p>
      </div>

      <div style="margin-top:35px; text-align:center;">
        <a
          href="https://www.krishnamedicose.in/medicine-data"
          style="
            display:inline-block;
            background:#00D1FF;
            color:#02131a;
            text-decoration:none;
            padding:16px 32px;
            border-radius:12px;
            font-weight:bold;
            font-size:16px;
          "
        >
          Access Secure Data Portal
        </a>
      </div>
    `,
  });

  return sendEmail({
    to,
    subject: "Purchase Confirmed: Medicine Data Bundle - Krishna Medicose",
    html,
  });
};

/**
 * BUNDLE OTP EMAIL FOR USER LOGIN
 */
const sendBundleOtpEmail = async (to, otp) => {
  const html = createEmailLayout({
    title: "Secure Access OTP",
    subtitle: "Use this one-time password to securely access the Popular Medicine Data Bundle.",
    content: `
      <div style="
        background:#f8fafc;
        border:1px solid #e2e8f0;
        border-radius:18px;
        padding:30px;
        text-align:center;
      ">
        <p style="
          margin:0;
          color:#64748b;
          font-size:12px;
          text-transform:uppercase;
          letter-spacing:2px;
          font-weight:bold;
        ">
          One-Time Password (OTP)
        </p>
        <h1 style="
          margin:15px 0;
          color:#0f172a;
          font-size:42px;
          letter-spacing:6px;
          font-weight:800;
        ">
          ${otp}
        </h1>
        <p style="
          margin:0;
          color:#94a3b8;
          font-size:13px;
        ">
          This OTP is valid for 5 minutes. Do not share it with anyone.
        </p>
      </div>
    `,
  });

  return sendEmail({
    to,
    subject: "OTP for Secure Medicine Data Access - Krishna Medicose",
    html,
  });
};

/**
 * BUNDLE PURCHASE NOTIFICATION FOR ADMIN
 */
const sendBundleAdminNotification = async (data) => {
  const html = createEmailLayout({
    title: "New Medicine Bundle Purchase Received",
    subtitle: "A customer has successfully bought the Popular Medicine Data Bundle.",
    content: `
      <table style="
        width:100%;
        border-collapse:collapse;
        overflow:hidden;
        border-radius:18px;
      ">
        <tr>
          <td style="padding:16px;background:#f8fafc;font-weight:bold;">Customer Name</td>
          <td style="padding:16px;background:#ffffff;">${data.userName}</td>
        </tr>
        <tr>
          <td style="padding:16px;background:#f8fafc;font-weight:bold;">Email Address</td>
          <td style="padding:16px;background:#ffffff;">${data.userEmail}</td>
        </tr>
        <tr>
          <td style="padding:16px;background:#f8fafc;font-weight:bold;">Mobile Number</td>
          <td style="padding:16px;background:#ffffff;">${data.userMobile}</td>
        </tr>
        <tr>
          <td style="padding:16px;background:#f8fafc;font-weight:bold;">Order ID</td>
          <td style="padding:16px;background:#ffffff;font-family:monospace;">${data.orderId}</td>
        </tr>
        <tr>
          <td style="padding:16px;background:#f8fafc;font-weight:bold;">Amount Paid</td>
          <td style="padding:16px;background:#ffffff;font-weight:bold;">₹${data.amount}</td>
        </tr>
      </table>
    `,
  });

  return sendEmail({
    to: "amanyadavu65@gmail.com",
    subject: `Success: Medicine Bundle Purchased by ${data.userName}`,
    html,
  });
};

module.exports = {
  sendEmail,
  sendConfirmationEmail,
  sendAdminNotification,
  sendOfferConfirmation,
  sendOfferLeadToAdmin,
  sendBundlePurchaseConfirmation,
  sendBundleAdminNotification,
  sendBundleOtpEmail,
};

/**
 * BUNDLE UPDATE NOTIFICATION
 */
const sendBundleUpdateNotification = async (to, userName) => {
  const html = createEmailLayout({
    title: "Medicine Dataset Updated!",
    subtitle: "We have released a new update for the Popular Medicine Data Bundle.",
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
          Hello ${userName || "Valued Customer"},
          <br/><br/>
          An updated version of the **Popular Medicine Data Bundle** has been successfully uploaded to our secure database.
          <br/><br/>
          You can immediately view and search the new dataset by logging into your secure viewer portal on our website.
        </p>
      </div>

      <div style="margin-top:35px; text-align:center;">
        <a
          href="https://www.krishnamedicose.in/medicine-data"
          style="
            display:inline-block;
            background:#00D1FF;
            color:#02131a;
            text-decoration:none;
            padding:16px 32px;
            border-radius:12px;
            font-weight:bold;
            font-size:16px;
          "
        >
          Access Secure Viewer
        </a>
      </div>
    `,
  });

  return sendEmail({
    to,
    subject: "Update Released: Medicine Data Bundle - Krishna Medicose",
    html,
  });
};

module.exports = {
  sendEmail,
  sendConfirmationEmail,
  sendAdminNotification,
  sendOfferConfirmation,
  sendOfferLeadToAdmin,
  sendBundlePurchaseConfirmation,
  sendBundleAdminNotification,
  sendBundleOtpEmail,
  sendBundleUpdateNotification,
};

