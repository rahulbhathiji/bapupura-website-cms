const db = require('../db/db');

// @desc    Track public visit / page view
// @route   POST /api/analytics/track
// @access  Public
const trackVisit = async (req, res) => {
  const { path, isNewVisitor } = req.body;
  const today = new Date().toISOString().split('T')[0];

  try {
    let stats = await db.Analytics.findOne({ date: today });
    if (!stats) {
      stats = await db.Analytics.create({
        date: today,
        visitors: 0,
        views: 0,
        downloads: 0,
        inquiries: 0,
        pageViewsDetail: {},
        downloadsDetail: {}
      });
    }

    const updates = {
      views: (stats.views || 0) + 1
    };

    if (isNewVisitor) {
      updates.visitors = (stats.visitors || 0) + 1;
    }

    // Detail map tracking
    const detailObj = stats.pageViewsDetail ? (stats.pageViewsDetail.toObject ? stats.pageViewsDetail.toObject() : stats.pageViewsDetail) : {};
    const pagePath = path || '/';
    detailObj[pagePath] = (detailObj[pagePath] || 0) + 1;
    updates.pageViewsDetail = detailObj;

    await db.Analytics.findByIdAndUpdate(stats._id || stats.id, updates);
    res.json({ success: true });
  } catch (error) {
    console.error('Track analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get dashboard analytics charts and figures
// @route   GET /api/analytics/summary
// @access  Private (Admin/Editor)
const getAnalyticsSummary = async (req, res) => {
  try {
    const list = await db.Analytics.find();
    
    // Sort by date ascending to get timeline
    list.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate aggregated metrics
    let totalViews = 0;
    let totalVisitors = 0;
    let totalDownloads = 0;
    let totalInquiries = 0;
    
    list.forEach(day => {
      totalViews += day.views || 0;
      totalVisitors += day.visitors || 0;
      totalDownloads += day.downloads || 0;
      totalInquiries += day.inquiries || 0;
    });

    // Get last 7 days chart data
    const last7Days = list.slice(-7);
    const chartLabels = [];
    const chartViews = [];
    const chartVisitors = [];
    const chartDownloads = [];
    
    // Generate dates if empty
    if (last7Days.length === 0) {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        chartLabels.push(dStr);
        chartViews.push(0);
        chartVisitors.push(0);
        chartDownloads.push(0);
      }
    } else {
      last7Days.forEach(day => {
        chartLabels.push(day.date);
        chartViews.push(day.views || 0);
        chartVisitors.push(day.visitors || 0);
        chartDownloads.push(day.downloads || 0);
      });
    }

    // Find most viewed page paths
    const pageCounts = {};
    list.forEach(day => {
      const details = day.pageViewsDetail ? (day.pageViewsDetail.toObject ? day.pageViewsDetail.toObject() : day.pageViewsDetail) : {};
      for (const p in details) {
        pageCounts[p] = (pageCounts[p] || 0) + details[p];
      }
    });

    const topPages = Object.entries(pageCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get today's stats
    const todayStr = new Date().toISOString().split('T')[0];
    const todayStats = list.find(d => d.date === todayStr) || { views: 0, visitors: 0, downloads: 0, inquiries: 0 };

    res.json({
      success: true,
      summary: {
        totalViews,
        totalVisitors,
        totalDownloads,
        totalInquiries,
        today: {
          views: todayStats.views || 0,
          visitors: todayStats.visitors || 0,
          downloads: todayStats.downloads || 0,
          inquiries: todayStats.inquiries || 0
        }
      },
      charts: {
        labels: chartLabels,
        views: chartViews,
        visitors: chartVisitors,
        downloads: chartDownloads
      },
      topPages
    });
  } catch (error) {
    console.error('Get analytics summary error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  trackVisit,
  getAnalyticsSummary
};
