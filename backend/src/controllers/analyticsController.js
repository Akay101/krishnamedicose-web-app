const Analytics = require('../models/Analytics');
const UAParser = require('ua-parser-js');

exports.logVisit = async (req, res) => {
  try {
    const { visitorId, path, referrer } = req.body;
    const ua = new UAParser(req.headers['user-agent']);
    const browser = ua.getBrowser();
    const os = ua.getOS();
    const device = ua.getDevice();

    const visit = new Analytics({
      visitorId,
      path,
      referrer,
      userAgent: req.headers['user-agent'],
      browser: browser.name,
      os: os.name,
      device: device.type || 'desktop',
      // In a real production environment, you'd use a GeoIP service here
      // For now, we'll leave country/city blank or use headers if available (e.g. from Cloudflare)
      country: req.headers['cf-ipcountry'] || 'Unknown'
    });

    await visit.save();
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Total & Unique Views (Last 24h)
    const stats24h = await Analytics.aggregate([
      { $match: { timestamp: { $gte: last24h } } },
      { $group: {
          _id: null,
          totalViews: { $sum: 1 },
          uniqueVisitors: { $addToSet: '$visitorId' }
      }},
      { $project: {
          totalViews: 1,
          uniqueCount: { $size: '$uniqueVisitors' }
      }}
    ]);

    // 2. Views Over Time (Last 7 Days, grouped by day)
    const timeline = await Analytics.aggregate([
      { $match: { timestamp: { $gte: last7d } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          views: { $sum: 1 },
          uniques: { $addToSet: "$visitorId" }
      }},
      { $sort: { "_id": 1 } },
      { $project: {
          date: "$_id",
          views: 1,
          uniques: { $size: "$uniques" },
          _id: 0
      }}
    ]);

    // 3. Device Breakdown
    const devices = await Analytics.aggregate([
      { $match: { timestamp: { $gte: last7d } } },
      { $group: { _id: "$device", count: { $sum: 1 } } }
    ]);

    // 4. Browser Breakdown
    const browsers = await Analytics.aggregate([
      { $match: { timestamp: { $gte: last7d } } },
      { $group: { _id: "$browser", count: { $sum: 1 } } }
    ]);

    res.json({
      summary: stats24h[0] || { totalViews: 0, uniqueCount: 0 },
      timeline,
      devices,
      browsers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
