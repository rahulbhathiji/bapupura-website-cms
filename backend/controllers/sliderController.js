const db = require('../db/db');

// @desc    Get all sliders (optionally by section)
// @route   GET /api/sliders
// @access  Public
const getSliders = async (req, res) => {
  try {
    const { section } = req.query;
    let query = {};
    if (section) query.section = section;
    
    const list = await db.Slider.find(query);
    // Return sorted by order, and filter enabled for public (handled mostly frontend, but good to filter)
    const isAdmin = !!req.headers.authorization || (req.cookies && req.cookies.token);
    const sorted = list.sort((a, b) => a.order - b.order);
    const result = isAdmin ? sorted : sorted.filter(s => s.isEnabled);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get sliders error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create a slider
// @route   POST /api/sliders
// @access  Private (Admin/Editor)
const createSlider = async (req, res) => {
  try {
    const count = await db.Slider.countDocuments({ section: req.body.section });
    const slider = await db.Slider.create({
      ...req.body,
      order: count
    });
    res.status(201).json({ success: true, data: slider, message: 'Slider created successfully' });
  } catch (error) {
    console.error('Create slider error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update a slider
// @route   PUT /api/sliders/:id
// @access  Private (Admin/Editor)
const updateSlider = async (req, res) => {
  try {
    const updated = await db.Slider.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Slider not found' });
    res.json({ success: true, data: updated, message: 'Slider updated successfully' });
  } catch (error) {
    console.error('Update slider error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a slider
// @route   DELETE /api/sliders/:id
// @access  Private (Admin/Super Admin)
const deleteSlider = async (req, res) => {
  try {
    const deleted = await db.Slider.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Slider not found' });
    res.json({ success: true, message: 'Slider deleted successfully' });
  } catch (error) {
    console.error('Delete slider error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Reorder sliders
// @route   PATCH /api/sliders/reorder
// @access  Private (Admin/Editor)
const reorderSliders = async (req, res) => {
  const { orders } = req.body;
  if (!orders || !Array.isArray(orders)) return res.status(400).json({ success: false, message: 'Invalid payload' });

  try {
    for (const item of orders) {
      await db.Slider.findByIdAndUpdate(item.id, { order: item.order });
    }
    res.json({ success: true, message: 'Sliders reordered successfully' });
  } catch (error) {
    console.error('Reorder error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getSliders,
  createSlider,
  updateSlider,
  deleteSlider,
  reorderSliders
};
