const db = require('../db/db');

// @desc    Get all committee members (or filtered by type)
// @route   GET /api/committees
// @access  Public
exports.getMembers = async (req, res) => {
  try {
    const { type } = req.query;
    const query = {};
    if (type) {
      query.committeeType = type;
    }
    
    let members = await db.Committee.find(query);
    
    // Sort by order ascending
    members.sort((a, b) => (a.order || 0) - (b.order || 0));

    res.json({ success: true, count: members.length, data: members });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single committee member
// @route   GET /api/committees/:id
// @access  Public
exports.getMemberById = async (req, res) => {
  try {
    const member = await db.Committee.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }
    res.json({ success: true, data: member });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create new committee member
// @route   POST /api/committees
// @access  Private (Editor, Admin, Super Admin)
exports.createMember = async (req, res) => {
  try {
    const { nameGu, nameEn, designationGu, designationEn, committeeType, photoUrl, order, isEnabled } = req.body;

    if (!nameGu || !nameEn || !committeeType) {
      return res.status(400).json({ success: false, message: 'Name (GU & EN) and Committee Type are required.' });
    }

    const newMember = await db.Committee.create({
      nameGu,
      nameEn,
      designationGu: designationGu || '',
      designationEn: designationEn || '',
      committeeType,
      photoUrl: photoUrl || '',
      order: order !== undefined ? Number(order) : 0,
      isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : true
    });

    res.status(201).json({ success: true, data: newMember });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Update committee member
// @route   PUT /api/committees/:id
// @access  Private (Editor, Admin, Super Admin)
exports.updateMember = async (req, res) => {
  try {
    const updatedMember = await db.Committee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedMember) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }
    res.json({ success: true, data: updatedMember });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Delete committee member
// @route   DELETE /api/committees/:id
// @access  Private (Site Admin, Admin, Super Admin)
exports.deleteMember = async (req, res) => {
  try {
    const deletedMember = await db.Committee.findByIdAndDelete(req.params.id);
    if (!deletedMember) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Reorder committee members
// @route   PATCH /api/committees/reorder
// @access  Private (Editor, Admin, Super Admin)
exports.reorderMembers = async (req, res) => {
  try {
    const { items } = req.body; // Array of { id, order }
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Items array is required' });
    }

    for (const item of items) {
      await db.Committee.findByIdAndUpdate(item.id, { order: item.order });
    }

    res.json({ success: true, message: 'Reordered successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
