const fs = require('fs');
const path = require('path');
const db = require('../db/db');

// @desc    Get all media
// @route   GET /api/media
// @access  Private (Admin/Editor)
const getMedia = async (req, res) => {
  const { album, search } = req.query;

  try {
    let list = await db.Media.find();

    // Filters
    if (album) {
      list = list.filter(m => m.album.toLowerCase() === album.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m => 
        (m.originalName && m.originalName.toLowerCase().includes(q)) ||
        m.filename.toLowerCase().includes(q)
      );
    }

    // Sort by createdAt descending
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, data: list });
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get distinct albums
// @route   GET /api/media/albums
// @access  Private (Admin/Editor)
const getAlbums = async (req, res) => {
  try {
    const list = await db.Media.find();
    const albums = [...new Set(list.map(m => m.album || 'General'))];
    res.json({ success: true, data: albums });
  } catch (error) {
    console.error('Get albums error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Upload multiple media files
// @route   POST /api/media/upload
// @access  Private (Admin/Editor)
const uploadMedia = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }

  const { album = 'General' } = req.body;

  try {
    const uploadedDocs = [];

    for (const file of req.files) {
      // Local storage URL format
      const fileUrl = `/uploads/${file.filename}`;
      
      const doc = await db.Media.create({
        url: fileUrl,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        album
      });
      uploadedDocs.push(doc);
    }

    res.status(201).json({ 
      success: true, 
      data: uploadedDocs, 
      message: `${req.files.length} file(s) uploaded successfully` 
    });
  } catch (error) {
    console.error('Upload media error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Rename a media item
// @route   PUT /api/media/:id
// @access  Private (Admin/Editor)
const renameMedia = async (req, res) => {
  const { originalName, album } = req.body;
  try {
    const media = await db.Media.findById(req.params.id);
    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    const updates = {};
    if (originalName) updates.originalName = originalName;
    if (album) updates.album = album;

    const updated = await db.Media.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, data: updated, message: 'Media details updated successfully' });
  } catch (error) {
    console.error('Rename media error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Replace an existing media file
// @route   POST /api/media/replace/:id
// @access  Private (Admin/Editor)
const replaceMedia = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a replacement file' });
  }

  try {
    const media = await db.Media.findById(req.params.id);
    if (!media) {
      // Delete uploaded file to avoid orphaned files
      const newPath = path.join(__dirname, '../uploads', req.file.filename);
      if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
      return res.status(404).json({ success: false, message: 'Media target not found' });
    }

    // Delete old local file
    const oldPath = path.join(__dirname, '../uploads', media.filename);
    if (fs.existsSync(oldPath)) {
      try {
        fs.unlinkSync(oldPath);
      } catch (err) {
        console.error(`Failed to delete old file: ${oldPath}`, err);
      }
    }

    // Update with new file info
    const fileUrl = `/uploads/${req.file.filename}`;
    const updated = await db.Media.findByIdAndUpdate(req.params.id, {
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    }, { new: true });

    res.json({ success: true, data: updated, message: 'Media file replaced successfully' });
  } catch (error) {
    console.error('Replace media error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a media item
// @route   DELETE /api/media/:id
// @access  Private (Admin)
const deleteMedia = async (req, res) => {
  try {
    const media = await db.Media.findById(req.params.id);
    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    // Delete local file from disk
    const filePath = path.join(__dirname, '../uploads', media.filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`Failed to delete local disk file: ${filePath}`, err);
      }
    }

    await db.Media.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getMedia,
  getAlbums,
  uploadMedia,
  renameMedia,
  replaceMedia,
  deleteMedia
};
