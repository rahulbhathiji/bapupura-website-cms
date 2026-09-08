const db = require('../db/db');

// Seed default sample event galleries if collection is empty
const seedDefaultGalleries = async () => {
  try {
    const count = await db.Gallery.countDocuments();
    if (count === 0) {
      await db.Gallery.create({
        titleGu: 'વાર્ષિક સ્નેહમિલન અને સાંસ્કૃતિક ઉત્સવ ૨૦૨૬',
        titleEn: 'Annual Gathering & Cultural Festival 2026',
        category: 'Cultural',
        date: '2026-03-15',
        descGu: 'બાપુપુરા સંસ્કાર ભવન ખાતે યોજાયેલ વાર્ષિક સ્નેહમિલન સમારોહ અને વિદ્યાર્થીઓ દ્વારા પ્રસ્તુત સાંસ્કૃતિક કાર્યક્રમ.',
        descEn: 'Annual gathering festival held at Bapupura Sanskar Bhavan featuring youth cultural performances and community felicitations.',
        coverImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
        photos: [
          {
            url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
            captionGu: 'સમારોહનું ઉદ્ઘાટન અને દીપ પ્રાગટ્ય',
            captionEn: 'Inaugural lighting of the lamp ceremony'
          },
          {
            url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
            captionGu: 'વિદ્યાર્થીઓ દ્વારા સાંસ્કૃતિક નૃત્ય પ્રસ્તુતિ',
            captionEn: 'Cultural dance performances by students'
          },
          {
            url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=80',
            captionGu: 'તેજસ્વી વિદ્યાર્થીઓનું સન્માન',
            captionEn: 'Felicitating meritorious students'
          }
        ],
        videos: [
          {
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            titleGu: 'સાંસ્કૃતિક કાર્યક્રમ હાઇલાઇટ્સ',
            titleEn: 'Cultural Program Highlights',
            type: 'youtube'
          }
        ],
        isFeatured: true,
        isEnabled: true,
        order: 1
      });

      await db.Gallery.create({
        titleGu: 'ડિજિટલ સાક્ષરતા અને કમ્પ્યુટર તાલીમ કાર્યશાળા',
        titleEn: 'Digital Literacy & Computer Workshop',
        category: 'Education',
        date: '2026-04-10',
        descGu: 'ગ્રામીણ યુવાનો અને વિદ્યાર્થીઓ માટે ૩ દિવસીય ડિજિટલ સાક્ષરતા વર્કશોપ.',
        descEn: '3-day comprehensive digital skills and computer literacy training camp for village youth.',
        coverImage: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
        photos: [
          {
            url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
            captionGu: 'ડિજિટલ સ્માર્ટ રૂમમાં તાલીમ સત્ર',
            captionEn: 'Hands-on learning in the Digital Smart Room'
          },
          {
            url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
            captionGu: 'વિદ્યાર્થીઓ કમ્પ્યુટર પ્રેક્ટિકલ કરતા',
            captionEn: 'Students practicing computer fundamentals'
          }
        ],
        videos: [],
        isFeatured: true,
        isEnabled: true,
        order: 2
      });

      await db.Gallery.create({
        titleGu: 'સજીવ ખેતી અને વૃક્ષારોપણ અભિયાન',
        titleEn: 'Organic Farming & Tree Plantation Drive',
        category: 'Agriculture',
        date: '2026-05-02',
        descGu: 'પર્યાવરણ સંરક્ષણ અને ઓર્ગેનિક ખેતી પદ્ધતિઓ અંગે જાગૃતિ અભિયાન અને ૫૦૦ વૃક્ષોનું વાવેતર.',
        descEn: 'Community plantation drive planting 500 saplings alongside organic farming awareness demonstrations.',
        coverImage: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
        photos: [
          {
            url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80',
            captionGu: 'સામૂહિક વૃક્ષારોપણ કાર્યક્રમ',
            captionEn: 'Mass tree plantation drive in village outskirts'
          },
          {
            url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80',
            captionGu: 'ઓર્ગેનિક ખેતી માર્ગદર્શન સત્ર',
            captionEn: 'Farmers attending organic agriculture demonstration'
          }
        ],
        videos: [],
        isFeatured: false,
        isEnabled: true,
        order: 3
      });

      console.log('Seeded default event galleries.');
    }
  } catch (err) {
    console.error('Error seeding gallery albums:', err);
  }
};

seedDefaultGalleries();

// @desc    Get all gallery albums
// @route   GET /api/gallery
// @access  Public
const getGalleries = async (req, res) => {
  const { category, featured, search, all } = req.query;

  try {
    let list = await db.Gallery.find();

    // Unless 'all=true' (for admin), only return enabled albums
    if (all !== 'true') {
      list = list.filter(g => g.isEnabled !== false);
    }

    // Filter by Category
    if (category && category !== 'All' && category !== 'બધા') {
      list = list.filter(g => (g.category || '').toLowerCase() === category.toLowerCase());
    }

    // Filter by Featured
    if (featured === 'true') {
      list = list.filter(g => g.isFeatured);
    }

    // Search query
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(g =>
        (g.titleGu && g.titleGu.toLowerCase().includes(q)) ||
        (g.titleEn && g.titleEn.toLowerCase().includes(q)) ||
        (g.category && g.category.toLowerCase().includes(q)) ||
        (g.descGu && g.descGu.toLowerCase().includes(q)) ||
        (g.descEn && g.descEn.toLowerCase().includes(q))
      );
    }

    // Sort by order ascending, then by date descending
    list.sort((a, b) => {
      if ((a.order || 0) !== (b.order || 0)) {
        return (a.order || 0) - (b.order || 0);
      }
      return new Date(b.date || 0) - new Date(a.date || 0);
    });

    res.json({ success: true, data: list });
  } catch (error) {
    console.error('Get galleries error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching gallery albums' });
  }
};

// @desc    Get distinct gallery categories
// @route   GET /api/gallery/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const list = await db.Gallery.find();
    const categories = [...new Set(list.map(g => g.category || 'General').filter(Boolean))];
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching categories' });
  }
};

// @desc    Get single gallery album by ID
// @route   GET /api/gallery/:id
// @access  Public
const getGalleryById = async (req, res) => {
  try {
    const album = await db.Gallery.findById(req.params.id);
    if (!album) {
      return res.status(404).json({ success: false, message: 'Gallery album not found' });
    }
    res.json({ success: true, data: album });
  } catch (error) {
    console.error('Get gallery by ID error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching gallery album' });
  }
};

// @desc    Create a new gallery album
// @route   POST /api/gallery
// @access  Private (Admin/Editor)
const createGallery = async (req, res) => {
  const {
    titleGu,
    titleEn,
    category = 'General',
    date = '',
    descGu = '',
    descEn = '',
    coverImage = '',
    photos = [],
    videos = [],
    isFeatured = false,
    isEnabled = true,
    order = 0
  } = req.body;

  if (!titleGu || !titleEn) {
    return res.status(400).json({ success: false, message: 'Gujarati and English titles are required.' });
  }

  try {
    const newAlbum = await db.Gallery.create({
      titleGu,
      titleEn,
      category,
      date: date || new Date().toISOString().split('T')[0],
      descGu,
      descEn,
      coverImage: coverImage || (photos[0] ? (photos[0].url || photos[0]) : ''),
      photos: Array.isArray(photos) ? photos.map(p => typeof p === 'string' ? { url: p, captionGu: '', captionEn: '' } : p) : [],
      videos: Array.isArray(videos) ? videos : [],
      isFeatured: !!isFeatured,
      isEnabled: isEnabled !== false,
      order: Number(order) || 0
    });

    res.status(201).json({ success: true, data: newAlbum, message: 'Gallery album created successfully' });
  } catch (error) {
    console.error('Create gallery error:', error);
    res.status(500).json({ success: false, message: 'Server error creating gallery album' });
  }
};

// @desc    Update a gallery album
// @route   PUT /api/gallery/:id
// @access  Private (Admin/Editor)
const updateGallery = async (req, res) => {
  try {
    const album = await db.Gallery.findById(req.params.id);
    if (!album) {
      return res.status(404).json({ success: false, message: 'Gallery album not found' });
    }

    const {
      titleGu,
      titleEn,
      category,
      date,
      descGu,
      descEn,
      coverImage,
      photos,
      videos,
      isFeatured,
      isEnabled,
      order
    } = req.body;

    const updates = {};
    if (titleGu !== undefined) updates.titleGu = titleGu;
    if (titleEn !== undefined) updates.titleEn = titleEn;
    if (category !== undefined) updates.category = category;
    if (date !== undefined) updates.date = date;
    if (descGu !== undefined) updates.descGu = descGu;
    if (descEn !== undefined) updates.descEn = descEn;
    if (coverImage !== undefined) updates.coverImage = coverImage;
    if (photos !== undefined) {
      updates.photos = Array.isArray(photos) ? photos.map(p => typeof p === 'string' ? { url: p, captionGu: '', captionEn: '' } : p) : [];
    }
    if (videos !== undefined) updates.videos = Array.isArray(videos) ? videos : [];
    if (isFeatured !== undefined) updates.isFeatured = !!isFeatured;
    if (isEnabled !== undefined) updates.isEnabled = isEnabled !== false;
    if (order !== undefined) updates.order = Number(order);

    const updated = await db.Gallery.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, data: updated, message: 'Gallery album updated successfully' });
  } catch (error) {
    console.error('Update gallery error:', error);
    res.status(500).json({ success: false, message: 'Server error updating gallery album' });
  }
};

// @desc    Delete a gallery album
// @route   DELETE /api/gallery/:id
// @access  Private (Admin)
const deleteGallery = async (req, res) => {
  try {
    const album = await db.Gallery.findById(req.params.id);
    if (!album) {
      return res.status(404).json({ success: false, message: 'Gallery album not found' });
    }

    await db.Gallery.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Gallery album deleted successfully' });
  } catch (error) {
    console.error('Delete gallery error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting gallery album' });
  }
};

// @desc    Reorder gallery albums
// @route   PATCH /api/gallery/reorder
// @access  Private (Admin/Editor)
const reorderGalleries = async (req, res) => {
  const { orderList } = req.body; // Array of { id, order }

  if (!Array.isArray(orderList)) {
    return res.status(400).json({ success: false, message: 'orderList must be an array' });
  }

  try {
    for (const item of orderList) {
      await db.Gallery.findByIdAndUpdate(item.id || item._id, { order: item.order });
    }
    res.json({ success: true, message: 'Gallery order updated successfully' });
  } catch (error) {
    console.error('Reorder gallery error:', error);
    res.status(500).json({ success: false, message: 'Server error reordering gallery' });
  }
};

module.exports = {
  getGalleries,
  getCategories,
  getGalleryById,
  createGallery,
  updateGallery,
  deleteGallery,
  reorderGalleries
};
