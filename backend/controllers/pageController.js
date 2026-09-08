const db = require('../db/db');

exports.getPages = async (req, res) => {
  try {
    const pages = await db.Page.find({});
    res.json({ success: true, data: pages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPageBySlug = async (req, res) => {
  try {
    const page = await db.Page.findOne({ slug: req.params.slug });
    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }
    res.json({ success: true, data: page });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createPage = async (req, res) => {
  try {
    const newPage = await db.Page.create(req.body);
    res.status(201).json({ success: true, data: newPage });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updatePage = async (req, res) => {
  try {
    const updatedPage = await db.Page.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedPage) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }
    res.json({ success: true, data: updatedPage });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deletePage = async (req, res) => {
  try {
    const deletedPage = await db.Page.findByIdAndDelete(req.params.id);
    if (!deletedPage) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
