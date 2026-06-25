const db = require('../db/db');

// Seed default notices if empty
const seedDefaultNotices = async () => {
  try {
    const count = await db.Notice.countDocuments();
    if (count === 0) {
      await db.Notice.create({
        titleGu: 'પરીક્ષા તૈયારી ફ્રી પુસ્તકો વિતરણ શેડ્યૂલ ૨૦૨૬',
        titleEn: 'Competitive Exam Free Textbook Distribution Schedule 2026',
        categoryGu: 'મહત્વપૂર્ણ',
        categoryEn: 'Urgent',
        pdfUrl: '#',
        fileSize: '1.2 MB',
        expiryDate: '',
        isPinned: true,
        isUrgent: true
      });
      await db.Notice.create({
        titleGu: 'આધુનિક ઓર્ગેનિક ખેતી પદ્ધતિઓ માર્ગદર્શન પત્રિકા',
        titleEn: 'Modern Organic Agricultural Practices Training Manual',
        categoryGu: 'સેમિનાર',
        categoryEn: 'Workshop',
        pdfUrl: '#',
        fileSize: '4.5 MB',
        expiryDate: '',
        isPinned: false,
        isUrgent: false
      });
      console.log('Seeded default notices.');
    }
  } catch (err) {
    console.error('Error seeding notices:', err);
  }
};

seedDefaultNotices();

// @desc    Get all notices
// @route   GET /api/notices
// @access  Public
const getNotices = async (req, res) => {
  try {
    const list = await db.Notice.find();
    const today = new Date().toISOString().split('T')[0];
    
    // Check auth to see if we show expired ones (show to admin only)
    const isAdmin = !!req.headers.authorization || (req.cookies && req.cookies.token);
    
    let result = list;
    if (!isAdmin) {
      // Filter out expired notices
      result = list.filter(n => !n.expiryDate || n.expiryDate >= today);
    }

    // Sort: Pinned first, then Urgent first, then by createdAt descending
    result.sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      if (a.isUrgent !== b.isUrgent) {
        return a.isUrgent ? -1 : 1;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get notices error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create a notice
// @route   POST /api/notices
// @access  Private (Admin/Editor)
const createNotice = async (req, res) => {
  try {
    const notice = await db.Notice.create(req.body);
    res.status(201).json({ success: true, data: notice, message: 'Notice created successfully' });
  } catch (error) {
    console.error('Create notice error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update a notice
// @route   PUT /api/notices/:id
// @access  Private (Admin/Editor)
const updateNotice = async (req, res) => {
  try {
    const updated = await db.Notice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }
    res.json({ success: true, data: updated, message: 'Notice updated successfully' });
  } catch (error) {
    console.error('Update notice error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a notice
// @route   DELETE /api/notices/:id
// @access  Private (Admin)
const deleteNotice = async (req, res) => {
  try {
    const deleted = await db.Notice.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }
    res.json({ success: true, message: 'Notice deleted successfully' });
  } catch (error) {
    console.error('Delete notice error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice
};
