const mongoose = require('mongoose');
const localDb = require('./localDb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config();

const useMongo = !!process.env.MONGODB_URI;

if (useMongo) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB database.'))
    .catch((err) => console.error('MongoDB connection error:', err));
} else {
  console.log('No MONGODB_URI found. Initializing Local File-based database (backend/data/).');
}

// Model names mapping
const MODELS = {
  User: 'User',
  Content: 'Content',
  Facility: 'Facility',
  Book: 'Book',
  Event: 'Event',
  Notice: 'Notice',
  Media: 'Media',
  Inquiry: 'Inquiry',
  Analytics: 'Analytics',
  History: 'History',
  Settings: 'Settings',
  Page: 'Page',
  Donor: 'Donor',
  Slider: 'Slider',
  Gallery: 'Gallery'
};

let db = {};

if (useMongo) {
  // Define Schemas for Mongoose
  const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    role: { type: String, enum: ['super_admin', 'site_admin', 'admin', 'editor'], default: 'site_admin' }
  }, { timestamps: true });

  const SettingsSchema = new mongoose.Schema({
    websiteName: { type: String, default: 'Shri Raghuveer Chaudhary Sanskar Bhavan Bapupura' },
    logoUrl: { type: String, default: '' },
    faviconUrl: { type: String, default: '' },
    copyrightGu: { type: String, default: 'શ્રી રઘુવીર ચૌધરી સંસ્કાર ભવન બાપુપુરા © ૨૦૨૬' },
    copyrightEn: { type: String, default: 'Shri Raghuveer Chaudhary Sanskar Bhavan Bapupura © 2026' },
    footerSubtextGu: { type: String, default: 'સર્વ હક સ્વાધિન. સામાજિક અને શૈક્ષણિક ટ્રસ્ટ નોંધણી અંતર્ગત સંચાલિત.' },
    footerSubtextEn: { type: String, default: 'All Rights Reserved. Registered Educational & Welfare Trust.' },
    navLabels: {
      homeGu: { type: String, default: 'હોમ' },
      homeEn: { type: String, default: 'Home' },
      aboutGu: { type: String, default: 'વિશે' },
      aboutEn: { type: String, default: 'About' },
      facilitiesGu: { type: String, default: 'સુવિધાઓ' },
      facilitiesEn: { type: String, default: 'Facilities' },
      donorsGu: { type: String, default: 'દાતાઓ' },
      donorsEn: { type: String, default: 'Donors' },
      galleryGu: { type: String, default: 'ગેલેરી' },
      galleryEn: { type: String, default: 'Gallery' },
      noticesGu: { type: String, default: 'સૂચનાઓ' },
      noticesEn: { type: String, default: 'Notices' },
      contactGu: { type: String, default: 'સંપર્ક' },
      contactEn: { type: String, default: 'Contact' }
    },
    themeColors: {
      primary: { type: String, default: '#0284c7' }, // sky-600
      secondary: { type: String, default: '#f59e0b' } // amber-500
    },
    seo: {
      metaTitle: { type: String, default: 'Shri Raghuveer Chaudhary Sanskar Bhavan Bapupura' },
      metaDescription: { type: String, default: 'Bapupura Community Development Hub' },
      keywords: { type: String, default: 'Bapupura, Sanskar Bhavan, Gandhinagar' },
      ogImage: { type: String, default: '' },
      twitterCard: { type: String, default: 'summary_large_image' }
    }
  }, { timestamps: true });

  const ContentSchema = new mongoose.Schema({
    section: { type: String, required: true, unique: true }, // 'hero', 'about', 'donation', 'contact'
    data: { type: mongoose.Schema.Types.Mixed, required: true }
  }, { timestamps: true });

  const PageSchema = new mongoose.Schema({
    titleGu: { type: String, required: true },
    titleEn: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    contentGu: { type: String, default: '' },
    contentEn: { type: String, default: '' },
    galleryImages: [{
      url: { type: String, required: true },
      captionGu: { type: String, default: '' },
      captionEn: { type: String, default: '' }
    }],
    videos: [{
      url: { type: String, required: true },
      titleGu: { type: String, default: '' },
      titleEn: { type: String, default: '' },
      type: { type: String, default: 'youtube' }
    }],
    documents: [{
      titleGu: { type: String, default: '' },
      titleEn: { type: String, default: '' },
      url: { type: String, required: true },
      fileSize: { type: String, default: '' }
    }],
    links: [{
      titleGu: { type: String, default: '' },
      titleEn: { type: String, default: '' },
      url: { type: String, required: true }
    }],
    enabledSections: {
      enableContent: { type: Boolean, default: true },
      enableGallery: { type: Boolean, default: true },
      enableVideos: { type: Boolean, default: true },
      enableDocuments: { type: Boolean, default: true },
      enableLinks: { type: Boolean, default: true }
    },
    seo: {
      metaTitle: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
      keywords: { type: String, default: '' }
    },
    status: { type: String, enum: ['published', 'draft'], default: 'draft' },
    isEnabled: { type: Boolean, default: true },
    showInNav: { type: Boolean, default: true },
    navOrder: { type: Number, default: 0 },
    bannerImage: { type: String, default: '' }
  }, { timestamps: true });

  const DonorSchema = new mongoose.Schema({
    nameGu: { type: String, required: true },
    nameEn: { type: String, required: true },
    photoUrl: { type: String, default: '' },
    bioGu: { type: String, default: '' },
    bioEn: { type: String, default: '' },
    detailsGu: { type: String, default: '' },
    detailsEn: { type: String, default: '' },
    isFeatured: { type: Boolean, default: false }
  }, { timestamps: true });

  const SliderSchema = new mongoose.Schema({
    section: { type: String, required: true, enum: ['hero', 'about'] }, // which slider it belongs to
    imageUrl: { type: String, required: true },
    titleGu: { type: String, default: '' },
    titleEn: { type: String, default: '' },
    subtitleGu: { type: String, default: '' },
    subtitleEn: { type: String, default: '' },
    order: { type: Number, default: 0 },
    isEnabled: { type: Boolean, default: true }
  }, { timestamps: true });

  const GallerySchema = new mongoose.Schema({
    titleGu: { type: String, required: true },
    titleEn: { type: String, required: true },
    category: { type: String, default: 'General' },
    date: { type: String, default: '' },
    descGu: { type: String, default: '' },
    descEn: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    photos: [{
      url: { type: String, required: true },
      captionGu: { type: String, default: '' },
      captionEn: { type: String, default: '' }
    }],
    videos: [{
      url: { type: String, required: true },
      titleGu: { type: String, default: '' },
      titleEn: { type: String, default: '' },
      type: { type: String, default: 'youtube' }
    }],
    isFeatured: { type: Boolean, default: false },
    isEnabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
  }, { timestamps: true });

  const FacilitySchema = new mongoose.Schema({
    icon: { type: String, default: '📚' },
    titleGu: { type: String, required: true },
    titleEn: { type: String, required: true },
    slug: { type: String, required: true },
    descGu: { type: String, required: true },
    descEn: { type: String, required: true },
    richTextContentGu: { type: String, default: '' },
    richTextContentEn: { type: String, default: '' },
    bannerImage: { type: String, default: '' },
    galleryImages: [{ type: String }],
    videos: [{ type: String }],
    documents: [{ type: String }],
    seoSettings: {
      metaTitle: { type: String, default: '' },
      metaDescription: { type: String, default: '' }
    },
    isPublished: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    isEnabled: { type: Boolean, default: true }
  }, { timestamps: true });

  const BookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, default: '' },
    category: { type: String, default: 'General' },
    pdfUrl: { type: String, required: true },
    coverUrl: { type: String, default: '' },
    isFeatured: { type: Boolean, default: false },
    downloadCount: { type: Number, default: 0 }
  }, { timestamps: true });

  const EventSchema = new mongoose.Schema({
    titleGu: { type: String, required: true },
    titleEn: { type: String, required: true },
    descGu: { type: String, required: true },
    descEn: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    locationGu: { type: String, default: 'બાપુપુરા' },
    locationEn: { type: String, default: 'Bapupura' },
    venueGu: { type: String, default: '' },
    venueEn: { type: String, default: '' },
    registrationLink: { type: String, default: '' },
    isFeatured: { type: Boolean, default: false },
    images: [{ type: String }],
    galleryImages: [{ type: String }],
    status: { type: String, enum: ['published', 'draft', 'archived'], default: 'draft' },
    isArchived: { type: Boolean, default: false }
  }, { timestamps: true });

  const NoticeSchema = new mongoose.Schema({
    titleGu: { type: String, required: true },
    titleEn: { type: String, required: true },
    descriptionGu: { type: String, default: '' },
    descriptionEn: { type: String, default: '' },
    categoryGu: { type: String, default: 'સામાન્ય' },
    categoryEn: { type: String, default: 'General' },
    pdfUrl: { type: String, default: '' },
    fileUrls: [{ type: String }],
    fileSize: { type: String, default: '0.0 MB' },
    expiryDate: { type: String, default: '' }, // YYYY-MM-DD
    isPinned: { type: Boolean, default: false },
    isUrgent: { type: Boolean, default: false },
    status: { type: String, enum: ['published', 'draft'], default: 'draft' },
    isEnabled: { type: Boolean, default: true }
  }, { timestamps: true });

  const MediaSchema = new mongoose.Schema({
    url: { type: String, required: true },
    filename: { type: String, required: true },
    originalName: { type: String, default: '' },
    size: { type: Number, default: 0 },
    album: { type: String, default: 'General' }
  }, { timestamps: true });

  const InquirySchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false }
  }, { timestamps: true });

  const AnalyticsSchema = new mongoose.Schema({
    date: { type: String, required: true, unique: true }, // YYYY-MM-DD
    visitors: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    inquiries: { type: Number, default: 0 },
    pageViewsDetail: { type: Map, of: Number, default: {} },
    downloadsDetail: { type: Map, of: Number, default: {} }
  }, { timestamps: true });

  const HistorySchema = new mongoose.Schema({
    collectionName: { type: String, required: true },
    recordId: { type: String, required: true },
    snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    updatedBy: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  });

  db.User = mongoose.model(MODELS.User, UserSchema);
  db.Settings = mongoose.model(MODELS.Settings, SettingsSchema);
  db.Content = mongoose.model(MODELS.Content, ContentSchema);
  db.Facility = mongoose.model(MODELS.Facility, FacilitySchema);
  db.Book = mongoose.model(MODELS.Book, BookSchema);
  db.Event = mongoose.model(MODELS.Event, EventSchema);
  db.Notice = mongoose.model(MODELS.Notice, NoticeSchema);
  db.Media = mongoose.model(MODELS.Media, MediaSchema);
  db.Inquiry = mongoose.model(MODELS.Inquiry, InquirySchema);
  db.Analytics = mongoose.model(MODELS.Analytics, AnalyticsSchema);
  db.History = mongoose.model(MODELS.History, HistorySchema);
  db.Page = mongoose.model(MODELS.Page, PageSchema);
  db.Donor = mongoose.model(MODELS.Donor, DonorSchema);
  db.Slider = mongoose.model(MODELS.Slider, SliderSchema);
  db.Gallery = mongoose.model(MODELS.Gallery, GallerySchema);
} else {
  // Initialize Local Models
  db.User = localDb.model(MODELS.User);
  db.Settings = localDb.model(MODELS.Settings);
  db.Content = localDb.model(MODELS.Content);
  db.Facility = localDb.model(MODELS.Facility);
  db.Book = localDb.model(MODELS.Book);
  db.Event = localDb.model(MODELS.Event);
  db.Notice = localDb.model(MODELS.Notice);
  db.Media = localDb.model(MODELS.Media);
  db.Inquiry = localDb.model(MODELS.Inquiry);
  db.Analytics = localDb.model(MODELS.Analytics);
  db.History = localDb.model(MODELS.History);
  db.Page = localDb.model(MODELS.Page);
  db.Donor = localDb.model(MODELS.Donor);
  db.Slider = localDb.model(MODELS.Slider);
  db.Gallery = localDb.model(MODELS.Gallery);
}

module.exports = db;
