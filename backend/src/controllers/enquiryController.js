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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const query = {};
    if (status) query.followUpStatus = status;

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
      { followUpStatus, followUpNotes },
      { new: true }
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
    // Optionally mark as completed if replied? But let's keep follow-up independent.
    await enquiry.save();
    
    res.json({ message: 'Reply sent successfully', data: enquiry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
