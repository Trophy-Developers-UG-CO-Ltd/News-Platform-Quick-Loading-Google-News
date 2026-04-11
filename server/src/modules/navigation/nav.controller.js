/**
 * Navigation controller
 * Public read + admin CRUD for nav menu items
 * @module modules/navigation/nav.controller
 */

const NavItem = require('./nav.model');

/* ─── Default seed data ─────────────────────────────────────── */
const DEFAULT_NAV = [
  { label: 'Home',          href: '/',              order: 0, isVisible: true, isExternal: false, icon: 'Home',        iconPosition: 'before', textWeight: 'bold' },
  { label: 'News',          href: '/news',          order: 1, isVisible: true, isExternal: false, icon: 'Newspaper',   iconPosition: 'before', textWeight: 'bold' },
  { label: 'Entertainment', href: '/entertainment', order: 2, isVisible: true, isExternal: false, icon: 'Sparkles',    iconPosition: 'before', textWeight: 'bold' },
  { label: 'Politics',      href: '/local',         order: 3, isVisible: true, isExternal: false, icon: 'Landmark',    iconPosition: 'before', textWeight: 'bold' },
  { label: 'Lifestyle',     href: '/entertainment', order: 4, isVisible: true, isExternal: false, icon: 'Coffee',      iconPosition: 'before', textWeight: 'bold' },
  { label: 'Videos',        href: '/videos',        order: 5, isVisible: true, isExternal: false, icon: 'Clapperboard', iconPosition: 'before', textWeight: 'bold' },
];

/* ─── GET /api/navigation — public visible items ───────────── */
exports.getPublicNav = async (req, res, next) => {
  try {
    let items = await NavItem.find({ isVisible: true }).sort('order').lean();

    // Auto-seed defaults when collection is empty (first run)
    if (items.length === 0) {
      await NavItem.insertMany(DEFAULT_NAV);
      items = await NavItem.find({ isVisible: true }).sort('order').lean();
    }

    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};

/* ─── GET /api/navigation/admin — all items (admin) ─────────── */
exports.getAllNav = async (req, res, next) => {
  try {
    let items = await NavItem.find().sort('order').lean();

    if (items.length === 0) {
      await NavItem.insertMany(DEFAULT_NAV);
      items = await NavItem.find().sort('order').lean();
    }

    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};

/* ─── PUT /api/navigation — bulk reorder + update (admin) ───── */
exports.bulkUpdate = async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'items must be an array' });
    }

    // Wipe and re-insert with new order
    await NavItem.deleteMany({});
    const payload = items.map((item, i) => ({
      label:       item.label      || '',
      localizedLabel: {
        en: item.localizedLabel?.en || null,
        zh: item.localizedLabel?.zh || null,
        sw: item.localizedLabel?.sw || null,
      },
      href:        item.href       || '/',
      order:       i,
      isVisible:   item.isVisible  !== undefined ? item.isVisible  : true,
      openInNewTab: item.openInNewTab !== undefined ? item.openInNewTab : false,
      isExternal:  item.isExternal  !== undefined ? item.isExternal  : false,
      icon:        item.icon       || '',
      iconPosition: item.iconPosition === 'after' ? 'after' : 'before',
      textWeight: ['normal', 'medium', 'semibold', 'bold'].includes(item.textWeight) ? item.textWeight : 'medium',
      translationStatus: item.translationStatus || undefined,
      translationMeta: item.translationMeta || undefined,
      translationHash: item.translationHash || undefined,
    }));

    const created = await NavItem.insertMany(payload);
    res.json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
};

/* ─── POST /api/navigation — add single item (admin) ─────────── */
exports.createNavItem = async (req, res, next) => {
  try {
    const count = await NavItem.countDocuments();
    const item = await NavItem.create({ ...req.body, order: count });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

/* ─── PATCH /api/navigation/:id — update single item (admin) ─── */
exports.updateNavItem = async (req, res, next) => {
  try {
    const item = await NavItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Nav item not found' });
    }

    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

/* ─── DELETE /api/navigation/:id — remove item (admin) ──────── */
exports.deleteNavItem = async (req, res, next) => {
  try {
    const item = await NavItem.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Nav item not found' });
    }

    res.json({ success: true, message: 'Navigation item deleted' });
  } catch (err) {
    next(err);
  }
};

// MukonoTalks
