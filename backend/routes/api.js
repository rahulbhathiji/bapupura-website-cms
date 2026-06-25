const express = require('express');
const router = express.Router();

// Middleware
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Controllers
const auth = require('../controllers/authController');
const content = require('../controllers/contentController');
const facility = require('../controllers/facilityController');
const library = require('../controllers/libraryController');
const event = require('../controllers/eventController');
const notice = require('../controllers/noticeController');
const inquiry = require('../controllers/inquiryController');
const analytics = require('../controllers/analyticsController');
const media = require('../controllers/mediaController');

// ----------------------------------------------------
// Authentication Routes (/api/auth)
// ----------------------------------------------------
router.post('/auth/login', auth.login);
router.post('/auth/logout', auth.logout);
router.get('/auth/me', protect, auth.getMe);
router.post('/auth/change-password', protect, auth.changePassword);
router.post('/auth/forgot-password', auth.forgotPassword);
router.post('/auth/reset-password', auth.resetPassword);

// ----------------------------------------------------
// Global Settings Routes (/api/settings)
// ----------------------------------------------------
router.get('/settings', content.getSettings);
router.put('/settings', protect, authorize('admin', 'super_admin'), content.updateSettings);

// ----------------------------------------------------
// CMS Content Section Routes (/api/content)
// ----------------------------------------------------
router.get('/content/:section', content.getContent);
router.put('/content/:section', protect, authorize('editor', 'admin', 'super_admin'), content.updateContent);
router.get('/content/history/:section', protect, authorize('admin', 'super_admin'), content.getHistory);
router.post('/content/history/revert', protect, authorize('admin', 'super_admin'), content.revertHistory);

// ----------------------------------------------------
// Facilities Routes (/api/facilities)
// ----------------------------------------------------
router.get('/facilities', facility.getFacilities);
router.post('/facilities', protect, authorize('editor', 'admin', 'super_admin'), facility.createFacility);
router.put('/facilities/:id', protect, authorize('editor', 'admin', 'super_admin'), facility.updateFacility);
router.delete('/facilities/:id', protect, authorize('admin', 'super_admin'), facility.deleteFacility);
router.patch('/facilities/reorder', protect, authorize('editor', 'admin', 'super_admin'), facility.reorderFacilities);

// ----------------------------------------------------
// Library (Books) Routes (/api/library)
// ----------------------------------------------------
router.get('/library', library.getBooks);
router.get('/library/categories', library.getCategories);
router.post('/library', protect, authorize('editor', 'admin', 'super_admin'), library.createBook);
router.put('/library/:id', protect, authorize('editor', 'admin', 'super_admin'), library.updateBook);
router.delete('/library/:id', protect, authorize('admin', 'super_admin'), library.deleteBook);
router.post('/library/download/:id', library.trackDownload);

// ----------------------------------------------------
// Events Routes (/api/events)
// ----------------------------------------------------
router.get('/events', event.getEvents);
router.post('/events', protect, authorize('editor', 'admin', 'super_admin'), event.createEvent);
router.put('/events/:id', protect, authorize('editor', 'admin', 'super_admin'), event.updateEvent);
router.delete('/events/:id', protect, authorize('admin', 'super_admin'), event.deleteEvent);

// ----------------------------------------------------
// Notices Routes (/api/notices)
// ----------------------------------------------------
router.get('/notices', notice.getNotices);
router.post('/notices', protect, authorize('editor', 'admin', 'super_admin'), notice.createNotice);
router.put('/notices/:id', protect, authorize('editor', 'admin', 'super_admin'), notice.updateNotice);
router.delete('/notices/:id', protect, authorize('admin', 'super_admin'), notice.deleteNotice);

// ----------------------------------------------------
// Contact Form Submission (Inquiries) Routes (/api/inquiries)
// ----------------------------------------------------
router.get('/inquiries', protect, authorize('editor', 'admin', 'super_admin'), inquiry.getInquiries);
router.get('/inquiries/export', protect, authorize('admin', 'super_admin'), inquiry.exportInquiries);
router.post('/inquiries', inquiry.createInquiry);
router.patch('/inquiries/:id', protect, authorize('editor', 'admin', 'super_admin'), inquiry.toggleReadStatus);
router.delete('/inquiries/:id', protect, authorize('admin', 'super_admin'), inquiry.deleteInquiry);

// ----------------------------------------------------
// Media Library Routes (/api/media)
// ----------------------------------------------------
router.get('/media', protect, authorize('editor', 'admin', 'super_admin'), media.getMedia);
router.get('/media/albums', protect, authorize('editor', 'admin', 'super_admin'), media.getAlbums);
router.post('/media/upload', protect, authorize('editor', 'admin', 'super_admin'), upload.array('files', 10), media.uploadMedia);
router.put('/media/:id', protect, authorize('editor', 'admin', 'super_admin'), media.renameMedia);
router.post('/media/replace/:id', protect, authorize('editor', 'admin', 'super_admin'), upload.single('file'), media.replaceMedia);
router.delete('/media/:id', protect, authorize('admin', 'super_admin'), media.deleteMedia);

// ----------------------------------------------------
// Analytics Tracking Routes (/api/analytics)
// ----------------------------------------------------
router.post('/analytics/track', analytics.trackVisit);
router.get('/analytics/summary', protect, authorize('editor', 'admin', 'super_admin'), analytics.getAnalyticsSummary);

module.exports = router;
