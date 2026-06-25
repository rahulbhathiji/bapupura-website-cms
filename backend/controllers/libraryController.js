const db = require('../db/db');

// Seed default books if empty
const seedDefaultBooks = async () => {
  try {
    const count = await db.Book.countDocuments();
    if (count === 0) {
      await db.Book.create({
        title: 'સ્પર્ધાત્મક પરીક્ષા સામાન્ય જ્ઞાન માર્ગદર્શિકા',
        author: 'ડૉ. રઘુવીર ચૌધરી ટ્રસ્ટ',
        category: 'Competitive Exams',
        pdfUrl: '/uploads/competitive_exam_gk_2026.pdf',
        coverUrl: '',
        isFeatured: true,
        downloadCount: 15
      });
      await db.Book.create({
        title: 'આધુનિક જૈવિક કૃષિ પદ્ધતિઓ અને બાગાયત',
        author: 'ગુજરાત કૃષિ સંશોધન પરિષદ',
        category: 'Agriculture',
        pdfUrl: '/uploads/organic_farming_manual.pdf',
        coverUrl: '',
        isFeatured: true,
        downloadCount: 32
      });
      console.log('Seeded default library books.');
    }
  } catch (err) {
    console.error('Error seeding books:', err);
  }
};

seedDefaultBooks();

// @desc    Get all books
// @route   GET /api/library
// @access  Public
const getBooks = async (req, res) => {
  const { category, search, featured } = req.query;
  try {
    let list = await db.Book.find();

    // In-memory filters to ensure compatibility with local JSON db
    if (featured === 'true') {
      list = list.filter(b => b.isFeatured);
    }
    if (category) {
      list = list.filter(b => b.category.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(b => 
        b.title.toLowerCase().includes(q) || 
        (b.author && b.author.toLowerCase().includes(q))
      );
    }

    // Sort by downloads descending
    list.sort((a, b) => b.downloadCount - a.downloadCount);

    res.json({ success: true, data: list });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get distinct book categories
// @route   GET /api/library/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const list = await db.Book.find();
    const categories = [...new Set(list.map(b => b.category))];
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create a book entry
// @route   POST /api/library
// @access  Private (Admin/Editor)
const createBook = async (req, res) => {
  try {
    const book = await db.Book.create(req.body);
    res.status(201).json({ success: true, data: book, message: 'Book added to library successfully' });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update a book entry
// @route   PUT /api/library/:id
// @access  Private (Admin/Editor)
const updateBook = async (req, res) => {
  try {
    const updated = await db.Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.json({ success: true, data: updated, message: 'Book updated successfully' });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a book entry
// @route   DELETE /api/library/:id
// @access  Private (Admin)
const deleteBook = async (req, res) => {
  try {
    const deleted = await db.Book.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.json({ success: true, message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Track download increment
// @route   POST /api/library/download/:id
// @access  Public
const trackDownload = async (req, res) => {
  try {
    const book = await db.Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    const count = (book.downloadCount || 0) + 1;
    const updated = await db.Book.findByIdAndUpdate(req.params.id, { downloadCount: count }, { new: true });
    
    // Log to Analytics as well
    const today = new Date().toISOString().split('T')[0];
    let analytics = await db.Analytics.findOne({ date: today });
    if (!analytics) {
      analytics = await db.Analytics.create({ date: today });
    }
    const currentDownloads = (analytics.downloads || 0) + 1;
    await db.Analytics.findByIdAndUpdate(analytics._id || analytics.id, { downloads: currentDownloads });

    res.json({ success: true, downloads: updated.downloadCount });
  } catch (error) {
    console.error('Track download error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getBooks,
  getCategories,
  createBook,
  updateBook,
  deleteBook,
  trackDownload
};
