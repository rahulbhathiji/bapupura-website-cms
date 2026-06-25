const db = require('../db/db');

// Seed default events if empty
const seedDefaultEvents = async () => {
  try {
    const count = await db.Event.countDocuments();
    if (count === 0) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 3);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const lastMonth = new Date();
      lastMonth.setDate(lastMonth.getDate() - 15);
      const lastMonthStr = lastMonth.toISOString().split('T')[0];

      await db.Event.create({
        titleGu: 'ડિજિટલ સાક્ષરતા અને કમ્પ્યુટર તાલીમ શિબિર',
        titleEn: 'Digital Literacy & Computer Training Camp',
        descGu: 'ગામના યુવાનો અને મહિલાઓ માટે કમ્પ્યુટરના મૂળભૂત જ્ઞાન અને ઈન્ટરનેટ વપરાશ અંગેની ફ્રી ૩ દિવસની શિબિર.',
        descEn: 'A free 3-day basic computer operations and internet security camp aimed at youth and women.',
        date: tomorrowStr,
        locationGu: 'ડિજિટલ ક્લાસરૂમ, સંસ્કાર ભવન',
        locationEn: 'Digital Classroom, Sanskar Bhavan',
        registrationLink: 'https://forms.gle/sampleform',
        isFeatured: true,
        images: [],
        isArchived: false
      });

      await db.Event.create({
        titleGu: 'સજીવ ખેતી અને ઓર્ગેનિક ખાતર બનાવવાની તાલીમ',
        titleEn: 'Organic Farming & Bio-Fertilizer Workshop',
        descGu: 'કૃષિ વિજ્ઞાન કેન્દ્રના વૈજ્ઞાનિકો દ્વારા ઓર્ગેનિક ખેતી પદ્ધતિઓ અને ગાય આધારિત ખેતીનું સેમિનાર.',
        descEn: 'Comprehensive guide and demonstration of bio-fertilizer prep led by state agriculture scientists.',
        date: lastMonthStr,
        locationGu: 'સેમિનાર હોલ, સંસ્કાર ભવન',
        locationEn: 'Seminar Hall, Sanskar Bhavan',
        registrationLink: '',
        isFeatured: false,
        images: [],
        isArchived: true
      });
      console.log('Seeded default events.');
    }
  } catch (err) {
    console.error('Error seeding events:', err);
  }
};

seedDefaultEvents();

// Helper: Auto-archive events whose dates have passed
const runAutoArchive = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const events = await db.Event.find();
    
    for (const event of events) {
      if (!event.isArchived && event.date < today) {
        await db.Event.findByIdAndUpdate(event._id || event.id, { isArchived: true });
      }
    }
  } catch (err) {
    console.error('Error running auto-archive:', err);
  }
};

// @desc    Get all events
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
  const { archived, featured } = req.query;
  try {
    // Run auto archive check first
    await runAutoArchive();

    let list = await db.Event.find();

    // Filter
    if (archived === 'true') {
      list = list.filter(e => e.isArchived);
    } else if (archived === 'false') {
      list = list.filter(e => !e.isArchived);
    }

    if (featured === 'true') {
      list = list.filter(e => e.isFeatured);
    }

    // Sort by date (upcoming events first, or past events latest first)
    list.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({ success: true, data: list });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create an event
// @route   POST /api/events
// @access  Private (Admin/Editor)
const createEvent = async (req, res) => {
  try {
    const event = await db.Event.create(req.body);
    res.status(201).json({ success: true, data: event, message: 'Event created successfully' });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private (Admin/Editor)
const updateEvent = async (req, res) => {
  try {
    const updated = await db.Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, data: updated, message: 'Event updated successfully' });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private (Admin)
const deleteEvent = async (req, res) => {
  try {
    const deleted = await db.Event.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent
};
