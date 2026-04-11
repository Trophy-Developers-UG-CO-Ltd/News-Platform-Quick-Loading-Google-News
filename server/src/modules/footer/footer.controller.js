/**
 * Footer controller — singleton GET (public) + PUT (admin)
 * @module modules/footer/footer.controller
 */

const FooterSettings = require('./footer.model');
const logger = require('../../utils/logger');
const translationService = require('../../services/translationService');

const DEFAULT = {
  tagline: 'Independent local news, community reporting, and editorial coverage for audiences across Mukono and beyond.',
  quickLinks: [
    { label: 'Home',             href: '/' },
    { label: 'Latest News',      href: '/news' },
    { label: 'Create Account',   href: '/register' },
    { label: 'Privacy Policy',   href: '/privacy' },
    { label: 'Terms & Conditions', href: '/terms' },
  ],
  serviceLinks: [
    { label: 'Advertise',        href: '/advertise' },
    { label: 'My Account',       href: '/dashboard' },
  ],
  contactEmail:   'info@mukonotalks.ug',
  contactPhone:   '+256 (0) 700 000 000',
  contactAddress: 'Uganda, Kenya, Tanzania',
  copyrightName:  'MukonoTalks',
};

/* ─── GET /api/footer  (public) ────────────────────────────── */
exports.getFooter = async (req, res, next) => {
  try {
    let doc = await FooterSettings.findOne({ key: 'main' }).lean();
    if (!doc) {
      doc = await FooterSettings.create({ key: 'main', ...DEFAULT });
    }
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

/* ─── PUT /api/footer  (admin) ──────────────────────────────── */
exports.updateFooter = async (req, res, next) => {
  try {
    const {
      tagline, quickLinks, serviceLinks,
      contactEmail, contactPhone, contactAddress, copyrightName,
    } = req.body;

    // Auto-translate the tagline to Swahili and Chinese
    let localizedTagline;
    if (tagline && process.env.GOOGLE_TRANSLATE_API_KEY) {
      try {
        const { sw, zh } = await translationService.translateCMS(tagline);
        localizedTagline = { en: tagline, sw: sw || undefined, zh: zh || undefined };
      } catch (err) {
        logger.warn(`[FooterController] Tagline translation failed (non-fatal): ${err.message}`);
        localizedTagline = { en: tagline };
      }
    } else if (tagline) {
      localizedTagline = { en: tagline };
    }

    const doc = await FooterSettings.findOneAndUpdate(
      { key: 'main' },
      {
        $set: {
          tagline,
          ...(localizedTagline ? { localizedTagline } : {}),
          quickLinks,
          serviceLinks,
          contactEmail,
          contactPhone,
          contactAddress,
          copyrightName,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

// MukonoTalks

