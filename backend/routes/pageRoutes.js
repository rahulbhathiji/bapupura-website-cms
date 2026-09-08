const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', pageController.getPages);
router.get('/:slug', pageController.getPageBySlug);
router.post('/', protect, authorize('editor', 'site_admin', 'admin', 'super_admin'), pageController.createPage);
router.put('/:id', protect, authorize('editor', 'site_admin', 'admin', 'super_admin'), pageController.updatePage);
router.delete('/:id', protect, authorize('site_admin', 'admin', 'super_admin'), pageController.deletePage);

module.exports = router;
