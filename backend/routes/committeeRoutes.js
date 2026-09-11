const express = require('express');
const router = express.Router();
const committeeController = require('../controllers/committeeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', committeeController.getMembers);
router.patch('/reorder', protect, authorize('editor', 'site_admin', 'admin', 'super_admin'), committeeController.reorderMembers);
router.get('/:id', committeeController.getMemberById);
router.post('/', protect, authorize('editor', 'site_admin', 'admin', 'super_admin'), committeeController.createMember);
router.put('/:id', protect, authorize('editor', 'site_admin', 'admin', 'super_admin'), committeeController.updateMember);
router.delete('/:id', protect, authorize('site_admin', 'admin', 'super_admin'), committeeController.deleteMember);

module.exports = router;
