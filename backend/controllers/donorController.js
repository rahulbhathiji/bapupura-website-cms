const db = require('../db/db');

// @desc    Get all donors
// @route   GET /api/donors
// @access  Public
const getDonors = async (req, res) => {
  try {
    const list = await db.Donor.find();
    res.json({ success: true, data: list });
  } catch (error) {
    console.error('Get donors error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get donor by ID
// @route   GET /api/donors/:id
// @access  Public
const getDonorById = async (req, res) => {
  try {
    const donor = await db.Donor.findById(req.params.id);
    if (!donor) return res.status(404).json({ success: false, message: 'Donor not found' });
    res.json({ success: true, data: donor });
  } catch (error) {
    console.error('Get donor error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create a donor
// @route   POST /api/donors
// @access  Private (Admin/Editor)
const createDonor = async (req, res) => {
  try {
    const donor = await db.Donor.create(req.body);
    res.status(201).json({ success: true, data: donor, message: 'Donor created successfully' });
  } catch (error) {
    console.error('Create donor error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update a donor
// @route   PUT /api/donors/:id
// @access  Private (Admin/Editor)
const updateDonor = async (req, res) => {
  try {
    const updated = await db.Donor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Donor not found' });
    res.json({ success: true, data: updated, message: 'Donor updated successfully' });
  } catch (error) {
    console.error('Update donor error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a donor
// @route   DELETE /api/donors/:id
// @access  Private (Admin/Super Admin)
const deleteDonor = async (req, res) => {
  try {
    const deleted = await db.Donor.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Donor not found' });
    res.json({ success: true, message: 'Donor deleted successfully' });
  } catch (error) {
    console.error('Delete donor error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Bulk import donors from CSV/Excel data
// @route   POST /api/donors/bulk-import
// @access  Private (Admin/Editor)
const bulkImportDonors = async (req, res) => {
  try {
    const { donors } = req.body;

    if (!Array.isArray(donors) || donors.length === 0) {
      return res.status(400).json({ success: false, message: 'No donor data provided. Expected { donors: [...] }' });
    }

    if (donors.length > 500) {
      return res.status(400).json({ success: false, message: 'Maximum 500 donors per import. Please split into smaller batches.' });
    }

    const results = { imported: 0, failed: 0, errors: [] };

    for (let i = 0; i < donors.length; i++) {
      const row = donors[i];

      // Validate required fields
      if (!row.nameEn && !row.nameGu) {
        results.failed++;
        results.errors.push({ row: i + 1, reason: 'Both nameEn and nameGu are empty — at least one name is required.' });
        continue;
      }

      try {
        const donorData = {
          nameGu: (row.nameGu || row.nameEn || '').toString().trim(),
          nameEn: (row.nameEn || row.nameGu || '').toString().trim(),
          bioGu: (row.bioGu || '').toString().trim(),
          bioEn: (row.bioEn || '').toString().trim(),
          detailsGu: (row.detailsGu || '').toString().trim(),
          detailsEn: (row.detailsEn || '').toString().trim(),
          isFeatured: row.isFeatured === true || row.isFeatured === 'true' || row.isFeatured === '1' || row.isFeatured === 'yes',
          photoUrl: '' // Photos are added manually after import
        };

        await db.Donor.create(donorData);
        results.imported++;
      } catch (rowErr) {
        results.failed++;
        results.errors.push({ row: i + 1, name: row.nameEn || row.nameGu, reason: rowErr.message });
      }
    }

    res.status(201).json({
      success: true,
      message: `Import complete: ${results.imported} imported, ${results.failed} failed.`,
      data: results
    });
  } catch (error) {
    console.error('Bulk import donors error:', error);
    res.status(500).json({ success: false, message: 'Server error during bulk import' });
  }
};

module.exports = {
  getDonors,
  getDonorById,
  createDonor,
  updateDonor,
  deleteDonor,
  bulkImportDonors
};
