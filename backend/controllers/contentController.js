const db = require('../db/db');

// Default Content Values
const DEFAULTS = {
  hero: {
    tagGu: 'શિક્ષણ • સંસ્કૃતિ • પ્રગતિ',
    tagEn: 'Education • Culture • Growth',
    headingGu: 'બાપુપુરા ગામ અને આસપાસના વિસ્તારના સર્વાંગી વિકાસનું કેન્દ્ર',
    headingEn: 'Empowering Bapupura Village Through Knowledge & Character',
    descGu: 'સામાજિક, શૈક્ષણિક, સાંસ્કૃતિક અને આર્થિક ઉત્થાન માટે સમર્પિત ડિજિટલ સુવિધાઓથી સજ્જ આધુનિક સંસ્કાર ભવન.',
    descEn: 'A modern institutional hub equipped with state-of-the-art facilities dedicated to social, educational, and economic empowerment.',
    button1TextGu: 'સુવિધાઓ જુઓ',
    button1Link: '#facilities',
    button1TextEn: 'Explore Facilities',
    button2TextGu: 'આગામી સેમિનારો',
    button2Link: '#events',
    button2TextEn: 'Upcoming Seminars',
    bgImageUrl: '',
    announcementGu: 'નવી સૂચના: આગામી ડિજિટલ સાક્ષરતા અને કૃષિ સેમિનાર આવતા રવિવારે યોજાશે. રજીસ્ટ્રેશન ખુલ્લું છે!',
    announcementEn: 'Notice: Upcoming Digital Literacy and Agriculture Seminar next Sunday. Registration is open!'
  },
  about: {
    visionHeadingGu: 'ધ્યેય અને વિઝન',
    visionHeadingEn: 'Vision & Mission',
    visionGu: 'અમારો મુખ્ય હેતુ ગ્રામીણ યુવાનોને સ્પર્ધાત્મક પરીક્ષાઓ માટે પ્રોત્સાહિત કરવાનો, આધુનિક ડિજિટલ લેબ્સ દ્વારા કૌશલ્ય આપવાનો, અને મહિલાઓને સ્વનિર્ભર બનાવવાનો છે. બાપુપુરા ગામને એક મોડેલ સ્માર્ટ વિલેજ તરીકે સ્થાપિત કરવું એ અમારું સપનું છે.',
    visionEn: 'Our foundational core is to motivate rural youth for competitive examinations, offer technical skill-sets via digital modules, and structurally support women-led micro-enterprises across neighboring blocks.',
    quoteGu: 'શિક્ષણ અને યોગ્ય સંસ્કાર એ જ સમાજ પરિવર્તનનું સૌથી મોટું સાધન છે.',
    quoteEn: 'Education paired with foundational cultural values is the single most powerful catalyst for institutional societal change.',
    chairmanMessageGu: '',
    chairmanMessageEn: '',
    chairmanImageUrl: '',
    visionImageUrl: ''
  },
  donation: {
    headingGu: 'ગામના વિકાસ માટે તમારું અમૂલ્ય યોગદાન આપો',
    headingEn: 'Support Your Village Development Vision',
    descGu: 'અમારા દ્વારા ચલાવવામાં આવતી લાઈબ્રેરી, ફ્રી કોમ્પ્યુટર લેબ અને મહિલા પાંખના સંચાલન માટે આપેલું દાન આવકવેરા મુક્તિ (80G) ને પાત્ર છે.',
    descEn: 'All funding support directed toward managing our free student libraries and skill classrooms qualifies for local statutory 80G tax benefits.',
    bankName: 'State Bank of India (SBI)',
    acName: 'Shri Raghuveer Chaudhary Sanskar Bhavan',
    acNumber: '12345678901',
    ifsc: 'SBIN0001234',
    upiId: 'bapupura@sbi',
    qrCodeUrl: '',
    taxInfoGu: '80G આવકવેરા મુક્તિ લાયક',
    taxInfoEn: '80G Tax Exempted'
  },
  contact: {
    phoneGu: 'હેલ્પલાઇન: +91 98765 43210',
    phoneEn: 'Support: +91 98765 43210',
    email: 'info@bapupurasanskarbhavan.org',
    addressGu: 'શ્રી રઘુવીર ચૌધરી સંસ્કાર ભવન, મુખ્ય બજાર, ગામ: બાપુપુરા, જિલ્લો: ગાંધીનગર, ગુજરાત.',
    addressEn: 'Main Market, Village: Bapupura, District: Gandhinagar, Gujarat, India.',
    mapsUrl: '', // Google Maps Embed Src Link
    facebookUrl: '',
    twitterUrl: '',
    instagramUrl: '',
    whatsappUrl: '+919876543210'
  }
};

const DEFAULT_SETTINGS = {
  websiteName: 'Shri Raghuveer Chaudhary Sanskar Bhavan Bapupura',
  logoUrl: '',
  faviconUrl: '',
  copyrightGu: 'શ્રી રઘુવીર ચૌધરી સંસ્કાર ભવન બાપુપુરા © ૨૦૨૬',
  copyrightEn: 'Shri Raghuveer Chaudhary Sanskar Bhavan Bapupura © 2026',
  footerSubtextGu: 'સર્વ હક સ્વાધિન. સામાજિક અને શૈક્ષણિક ટ્રસ્ટ નોંધણી અંતર્ગત સંચાલિત.',
  footerSubtextEn: 'All Rights Reserved. Registered Educational & Welfare Trust.',
  themeColors: {
    primary: '#0284c7',
    secondary: '#f59e0b'
  },
  seo: {
    metaTitle: 'Shri Raghuveer Chaudhary Sanskar Bhavan Bapupura',
    metaDescription: 'Bapupura Community Development Hub',
    keywords: 'Bapupura, Sanskar Bhavan, Gandhinagar',
    ogImage: '',
    twitterCard: 'summary_large_image'
  }
};

// @desc    Get website settings
// @route   GET /api/settings
// @access  Public
const getSettings = async (req, res) => {
  try {
    let settings = await db.Settings.findOne();
    if (!settings) {
      settings = await db.Settings.create(DEFAULT_SETTINGS);
    } else {
      // Ensure local schema defaults are merged (for local db instances lacking mongoose schema validator defaults)
      const settingsObj = settings.toObject ? settings.toObject() : settings;
      let needsUpdate = false;

      const checkAndMerge = (target, source) => {
        let updated = false;
        for (const key in source) {
          if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (!target[key]) {
              target[key] = {};
              updated = true;
            }
            if (checkAndMerge(target[key], source[key])) {
              updated = true;
            }
          } else if (target[key] === undefined || target[key] === null) {
            target[key] = source[key];
            updated = true;
          }
        }
        return updated;
      };

      if (checkAndMerge(settingsObj, DEFAULT_SETTINGS)) {
        settings = await db.Settings.findByIdAndUpdate(settingsObj._id || settingsObj.id, settingsObj, { new: true });
      }
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update website settings
// @route   PUT /api/settings
// @access  Private (Admin)
const updateSettings = async (req, res) => {
  try {
    let settings = await db.Settings.findOne();
    if (!settings) {
      settings = await db.Settings.create(DEFAULT_SETTINGS);
    }

    const updated = await db.Settings.findByIdAndUpdate(
      settings._id || settings.id,
      req.body,
      { new: true }
    );

    // Save history
    await db.History.create({
      collectionName: 'Settings',
      recordId: settings._id || settings.id,
      snapshot: settings.toObject ? settings.toObject() : settings,
      updatedBy: req.user.username
    });

    res.json({ success: true, data: updated, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get content section
// @route   GET /api/content/:section
// @access  Public
const getContent = async (req, res) => {
  const { section } = req.params;
  
  if (!DEFAULTS[section]) {
    return res.status(400).json({ success: false, message: 'Invalid section name' });
  }

  try {
    let content = await db.Content.findOne({ section });
    if (!content) {
      content = await db.Content.create({ section, data: DEFAULTS[section] });
    }
    res.json({ success: true, data: content.data });
  } catch (error) {
    console.error(`Get content ${section} error:`, error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update content section
// @route   PUT /api/content/:section
// @access  Private (Admin/Editor)
const updateContent = async (req, res) => {
  const { section } = req.params;
  
  if (!DEFAULTS[section]) {
    return res.status(400).json({ success: false, message: 'Invalid section name' });
  }

  try {
    let content = await db.Content.findOne({ section });
    if (!content) {
      content = await db.Content.create({ section, data: DEFAULTS[section] });
    }

    const previousSnapshot = content.toObject ? content.toObject() : content;

    const updated = await db.Content.findByIdAndUpdate(
      content._id || content.id,
      { data: req.body },
      { new: true }
    );

    // Save history
    await db.History.create({
      collectionName: `Content_${section}`,
      recordId: content._id || content.id,
      snapshot: previousSnapshot.data || previousSnapshot,
      updatedBy: req.user.username
    });

    res.json({ success: true, data: updated.data, message: `${section} content updated successfully` });
  } catch (error) {
    console.error(`Update content ${section} error:`, error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get edit version history
// @route   GET /api/content/history/:section
// @access  Private (Admin)
const getHistory = async (req, res) => {
  const { section } = req.params;
  const colName = section === 'settings' ? 'Settings' : `Content_${section}`;

  try {
    const list = await db.History.find({ collectionName: colName });
    // sort by timestamp descending
    const sorted = list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json({ success: true, data: sorted });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Revert content to a historical snapshot
// @route   POST /api/content/history/revert
// @access  Private (Admin)
const revertHistory = async (req, res) => {
  const { historyId } = req.body;

  if (!historyId) {
    return res.status(400).json({ success: false, message: 'History ID is required' });
  }

  try {
    const history = await db.History.findById(historyId);
    if (!history) {
      return res.status(404).json({ success: false, message: 'Historical record not found' });
    }

    const { collectionName, recordId, snapshot } = history;

    if (collectionName === 'Settings') {
      await db.Settings.findByIdAndUpdate(recordId, snapshot);
    } else if (collectionName.startsWith('Content_')) {
      await db.Content.findByIdAndUpdate(recordId, { data: snapshot });
    } else {
      return res.status(400).json({ success: false, message: 'Unsupported collection revert' });
    }

    res.json({ success: true, message: 'Content reverted to snapshot successfully' });
  } catch (error) {
    console.error('Revert history error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getContent,
  updateContent,
  getHistory,
  revertHistory
};
