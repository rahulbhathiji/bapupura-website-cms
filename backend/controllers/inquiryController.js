const db = require('../db/db');

// @desc    Get all inquiries
// @route   GET /api/inquiries
// @access  Private (Admin/Editor)
const getInquiries = async (req, res) => {
  const { status, search, page = 1, limit = 10 } = req.query;

  try {
    let list = await db.Inquiry.find();

    // Filters
    if (status === 'read') {
      list = list.filter(i => i.isRead);
    } else if (status === 'unread') {
      list = list.filter(i => !i.isRead);
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(i => 
        i.name.toLowerCase().includes(q) ||
        i.message.toLowerCase().includes(q) ||
        (i.email && i.email.toLowerCase().includes(q)) ||
        i.phone.includes(q)
      );
    }

    // Sort by date descending
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const total = list.length;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + parseInt(limit));

    res.json({
      success: true,
      data: paginated,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get inquiries error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Submit an inquiry (Public)
// @route   POST /api/inquiries
// @access  Public
const createInquiry = async (req, res) => {
  const { name, phone, email, message } = req.body;

  if (!name || !phone || !message) {
    return res.status(400).json({ success: false, message: 'Name, phone, and message are required' });
  }

  try {
    const inquiry = await db.Inquiry.create({ name, phone, email, message });

    // Track in Analytics
    const today = new Date().toISOString().split('T')[0];
    let analytics = await db.Analytics.findOne({ date: today });
    if (!analytics) {
      analytics = await db.Analytics.create({ date: today });
    }
    const currentInquiries = (analytics.inquiries || 0) + 1;
    await db.Analytics.findByIdAndUpdate(analytics._id || analytics.id, { inquiries: currentInquiries });

    res.status(201).json({ success: true, data: inquiry, message: 'Inquiry submitted successfully' });
  } catch (error) {
    console.error('Create inquiry error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Mark inquiry as read/unread
// @route   PATCH /api/inquiries/:id
// @access  Private (Admin/Editor)
const toggleReadStatus = async (req, res) => {
  const { isRead } = req.body;
  try {
    const updated = await db.Inquiry.findByIdAndUpdate(req.params.id, { isRead }, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }
    res.json({ success: true, data: updated, message: 'Inquiry status updated' });
  } catch (error) {
    console.error('Update inquiry status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete an inquiry
// @route   DELETE /api/inquiries/:id
// @access  Private (Admin)
const deleteInquiry = async (req, res) => {
  try {
    const deleted = await db.Inquiry.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }
    res.json({ success: true, message: 'Inquiry deleted successfully' });
  } catch (error) {
    console.error('Delete inquiry error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Export inquiries as JSON/CSV
// @route   GET /api/inquiries/export
// @access  Private (Admin)
const exportInquiries = async (req, res) => {
  try {
    const list = await db.Inquiry.find();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=inquiries.csv');
    
    // Build CSV content
    let csv = 'Name,Phone,Email,Message,Read,Date\n';
    list.forEach(i => {
      const cleanMsg = i.message.replace(/"/g, '""').replace(/\n/g, ' ');
      csv += `"${i.name}","${i.phone}","${i.email || ''}","${cleanMsg}",${i.isRead},"${i.createdAt}"\n`;
    });

    res.status(200).send(csv);
  } catch (error) {
    console.error('Export inquiries error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getInquiries,
  createInquiry,
  toggleReadStatus,
  deleteInquiry,
  exportInquiries
};
