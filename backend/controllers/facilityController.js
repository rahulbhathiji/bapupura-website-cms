const db = require('../db/db');

// Seed default facilities if empty
const seedDefaultFacilities = async () => {
  try {
    const count = await db.Facility.countDocuments();
    if (count === 0) {
      const defaults = [
        {
          icon: '📚',
          titleGu: 'પુસ્તકાલય અને વાંચન ખંડ',
          titleEn: 'Library & Reading Space',
          descGu: 'સ્પર્ધાત્મક પરીક્ષાઓની તૈયારી માટે પુસ્તકો અને શાંત વાતાવરણ. કરિયર ગાઈડન્સ સેલ.',
          descEn: 'Curated syllabus guides, quiet study spaces, and strategic counseling mentorship arrays.',
          order: 0,
          isEnabled: true
        },
        {
          icon: '🌱',
          titleGu: 'તાલીમ અને સેમિનાર',
          titleEn: 'Workshops & Training',
          descGu: 'આરોગ્ય જાગૃતિ, અદ્યતન ઓર્ગેનિક કૃષિ અને પશુપાલન માટે નિષ્ણાતો દ્વારા માર્ગદર્શન શિબિરો.',
          descEn: 'Expert-led clinics focusing on organic framing layouts and modern animal husbandry mechanics.',
          order: 1,
          isEnabled: true
        },
        {
          icon: '💼',
          titleGu: 'મહિલા સશક્તિકરણ',
          titleEn: 'Women Empowerment',
          descGu: 'કૌશલ્ય વિકાસ તાલીમ, ગૃહ ઉદ્યોગ પ્રવૃત્તિઓ અને નાના વ્યવસાય માટે આર્થિક માર્ગદર્શન પ્રોગ્રામ.',
          descEn: 'Vocational craft support loops, digital literacy tracks, and small enterprise funding guidance.',
          order: 2,
          isEnabled: true
        },
        {
          icon: '💻',
          titleGu: 'ડિજિટલ સ્માર્ટ ક્લાસરૂમ',
          titleEn: 'Digital Smart Rooms',
          descGu: 'ઓડિયો-વિઝ્યુઅલ સિસ્ટમ્સ, કોમ્પ્યુટર લેબ અને હાઇ-સ્પીડ ફ્રી ઇન્ટરનેટ લર્નિંગ એન્વાયરમેન્ટ.',
          descEn: 'Hi-speed computing labs, multi-media screens, and interactive instructional technology setups.',
          order: 3,
          isEnabled: true
        }
      ];
      for (const item of defaults) {
        await db.Facility.create(item);
      }
      console.log('Seeded default Facilities.');
    }
  } catch (err) {
    console.error('Error seeding facilities:', err);
  }
};

seedDefaultFacilities();

// @desc    Get all facilities
// @route   GET /api/facilities
// @access  Public
const getFacilities = async (req, res) => {
  try {
    const list = await db.Facility.find();
    // Sort by order ascending
    const sorted = list.sort((a, b) => a.order - b.order);
    
    // If not authenticated, filter enabled only
    const isAdmin = !!req.headers.authorization || (req.cookies && req.cookies.token);
    const result = isAdmin ? sorted : sorted.filter(f => f.isEnabled);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get facilities error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create a facility
// @route   POST /api/facilities
// @access  Private (Admin/Editor)
const createFacility = async (req, res) => {
  try {
    const count = await db.Facility.countDocuments();
    const facility = await db.Facility.create({
      ...req.body,
      order: count
    });
    res.status(201).json({ success: true, data: facility, message: 'Facility created successfully' });
  } catch (error) {
    console.error('Create facility error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update a facility
// @route   PUT /api/facilities/:id
// @access  Private (Admin/Editor)
const updateFacility = async (req, res) => {
  try {
    const updated = await db.Facility.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Facility not found' });
    }
    res.json({ success: true, data: updated, message: 'Facility updated successfully' });
  } catch (error) {
    console.error('Update facility error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a facility
// @route   DELETE /api/facilities/:id
// @access  Private (Admin)
const deleteFacility = async (req, res) => {
  try {
    const deleted = await db.Facility.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Facility not found' });
    }
    res.json({ success: true, message: 'Facility deleted successfully' });
  } catch (error) {
    console.error('Delete facility error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Reorder facilities
// @route   PATCH /api/facilities/reorder
// @access  Private (Admin/Editor)
const reorderFacilities = async (req, res) => {
  const { orders } = req.body; // array of { id, order }

  if (!orders || !Array.isArray(orders)) {
    return res.status(400).json({ success: false, message: 'Invalid order payloads' });
  }

  try {
    for (const item of orders) {
      await db.Facility.findByIdAndUpdate(item.id, { order: item.order });
    }
    res.json({ success: true, message: 'Facilities reordered successfully' });
  } catch (error) {
    console.error('Reorder facilities error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getFacilities,
  createFacility,
  updateFacility,
  deleteFacility,
  reorderFacilities
};
