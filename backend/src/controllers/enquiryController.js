const Enquiry = require('../models/Enquiry');
const { sendConfirmationEmail, sendAdminNotification, sendEmail } = require('../services/emailService');

exports.createEnquiry = async (req, res) => {
  try {
    const enquiry = new Enquiry(req.body);
    await enquiry.save();
    
    // Send background emails
    sendConfirmationEmail(enquiry.email, enquiry.name).catch(console.error);
    sendAdminNotification(enquiry).catch(console.error);
    
    res.status(201).json({ message: 'Enquiry submitted successfully', data: enquiry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    res.json(enquiries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.replyToEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const enquiry = await Enquiry.findById(id);
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found' });
    
    // Send email reply
    await sendEmail({
      to: enquiry.email,
      subject: 'Re: Your Enquiry at Krishna Medicose',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <p>Hello ${enquiry.name},</p>
          <p>${message}</p>
          <br>
          <p>Best regards,<br>Krishna Pandit<br>Krishna Medicose</p>
        </div>
      `
    });

    enquiry.replies.push({ message });
    enquiry.status = 'replied';
    await enquiry.save();
    
    res.json({ message: 'Reply sent successfully', data: enquiry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
