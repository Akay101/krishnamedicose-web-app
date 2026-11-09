const Enquiry = require('../models/Enquiry');
const { sendConfirmationEmail, sendAdminNotification, sendEmail } = require('../services/emailService');
const { cleanText, escapeHtml } = require('../utils/security');

exports.createEnquiry = async (req, res) => {
  try {
    // Only accept public form fields - status/replies/follow-up are admin-controlled
    const payload = {
      name: cleanText(req.body.name, 100),
      mobile: cleanText(req.body.mobile, 20),
      country: cleanText(req.body.country, 60) || 'India',
      email: cleanText(req.body.email, 120).toLowerCase(),
      type: req.body.type === 'collaborate' ? 'collaborate' : 'enquire',
      description: cleanText(req.body.description, 3000)
    };

    if (!payload.name || !payload.mobile || !payload.description || !/^\S+@\S+\.\S+$/.test(payload.email)) {
      return res.status(400).json({ message: 'Please provide your name, a valid email, mobile number and message.' });
    }

    const enquiry = new Enquiry(payload);
    await enquiry.save();

    // Send background emails
    sendConfirmationEmail(enquiry.email, enquiry.name).catch(console.error);
    sendAdminNotification(enquiry).catch(console.error);

    res.status(201).json({ message: 'Enquiry submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to submit enquiry right now.' });
  }
};

exports.getEnquiries = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const query = {};
    if (status === 'pending' || status === 'completed') query.followUpStatus = status;

    const [enquiries, total, pendingCount, completedCount] = await Promise.all([
      Enquiry.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Enquiry.countDocuments(query),
      Enquiry.countDocuments({ followUpStatus: 'pending' }),
      Enquiry.countDocuments({ followUpStatus: 'completed' })
    ]);

    res.json({
      data: enquiries,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      pendingCount,
      completedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateEnquiryFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    const { followUpStatus, followUpNotes } = req.body;

    const enquiry = await Enquiry.findByIdAndUpdate(
      id,
      {
        followUpStatus: followUpStatus === 'completed' ? 'completed' : 'pending',
        followUpNotes: cleanText(followUpNotes, 2000)
      },
      { new: true, runValidators: true }
    );
    
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found' });
    res.json(enquiry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.replyToEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const message = cleanText(req.body.message, 5000);
    if (!message) return res.status(400).json({ message: 'Reply message is required' });
    const enquiry = await Enquiry.findById(id);
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found' });
    
    // Send email reply
    await sendEmail({
      to: enquiry.email,
      subject: 'Re: Your Enquiry at Krishna Medicose',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <p>Hello ${escapeHtml(enquiry.name)},</p>
          <p style="white-space: pre-line;">${escapeHtml(message)}</p>
          <br>
          <p>Best regards,<br>Krishna Pandit<br>Krishna Medicose</p>
        </div>
      `
    });

    enquiry.replies.push({ message });
    enquiry.status = 'replied';
    // Optionally mark as completed if replied? But let's keep follow-up independent.
    await enquiry.save();
    
    res.json({ message: 'Reply sent successfully', data: enquiry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
