const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', galleryController.getGalleries);
router.get('/categories', galleryController.getCategories);
router.get('/:id', galleryController.getGalleryById);

router.post('/', protect, authorize('editor', 'site_admin', 'admin', 'super_admin'), galleryController.createGallery);
router.put('/:id', protect, authorize('editor', 'site_admin', 'admin', 'super_admin'), galleryController.updateGallery);
router.delete('/:id', protect, authorize('site_admin', 'admin', 'super_admin'), galleryController.deleteGallery);
router.patch('/reorder', protect, authorize('editor', 'site_admin', 'admin', 'super_admin'), galleryController.reorderGalleries);

module.exports = router;
