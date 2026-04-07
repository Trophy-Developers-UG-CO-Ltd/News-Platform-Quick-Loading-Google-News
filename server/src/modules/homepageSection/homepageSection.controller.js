const homepageSectionService = require('./homepageSection.service');
const { asyncHandler }        = require('../../middlewares/error.middleware');

/**
 * GET /api/homepage-sections/:key  — public
 * Returns the section document for the requested key.
 */
exports.getSection = asyncHandler(async (req, res) => {
  const section = await homepageSectionService.getSection(req.params.key);
  if (!section) return res.status(404).json({ message: 'Section not found' });
  res.json(section);
});

/**
 * GET /api/homepage-sections  — admin
 * Returns all section documents.
 */
exports.getAllSections = asyncHandler(async (req, res) => {
  const sections = await homepageSectionService.getAllSections();
  res.json(sections);
});

/**
 * PUT /api/homepage-sections/:key  — admin
 * Creates or updates a section.
 */
exports.upsertSection = asyncHandler(async (req, res) => {
  const section = await homepageSectionService.upsertSection(
    req.params.key,
    req.body
  );
  res.json(section);
});
