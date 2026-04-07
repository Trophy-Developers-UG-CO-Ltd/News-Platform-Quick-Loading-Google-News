/**
 * Page API service
 * CMS page fetch operations for public and admin
 * @module features/pages/pageService
 */

import api from '../../app/axios';

/**
 * Fetch a public page by language and slug
 */
const getPublicPage = async (lang, slug) => {
  const response = await api.get(`/pages/${lang}/${slug}`);
  return response.data;
};

/**
 * Get all pages (admin)
 */
const getAllPages = async (params) => {
  const response = await api.get('/pages/admin/all', { params });
  return response.data;
};

/**
 * Get a single page by ID (admin)
 */
const getPageById = async (pageId) => {
  const response = await api.get(`/pages/admin/${pageId}`);
  return response.data;
};

/**
 * Create a new page (admin)
 */
const createPage = async (pageData) => {
  const response = await api.post('/pages', pageData);
  return response.data;
};

/**
 * Update a page (admin)
 */
const updatePage = async (pageId, pageData) => {
  const response = await api.put(`/pages/${pageId}`, pageData);
  return response.data;
};

/**
 * Publish or unpublish a page (admin)
 */
const publishPage = async (pageId, action) => {
  const response = await api.patch(`/pages/publish/${pageId}`, { action });
  return response.data;
};

/**
 * Delete a page (admin)
 */
const deletePage = async (pageId) => {
  const response = await api.delete(`/pages/${pageId}`);
  return response.data;
};

/**
 * Get a page by pageKey (admin — includes drafts)
 */
const getAdminPageByKey = async (pageKey) => {
  const response = await api.get(`/pages/admin/key/${pageKey}`);
  return response.data;
};

/**
 * Fetch a page for admin preview (draft or published) by language and slug
 */
const previewPage = async (lang, slug) => {
  const response = await api.get(`/pages/admin/preview/${lang}/${slug}`);
  return response.data;
};

const pageService = {
  getPublicPage,
  previewPage,
  getAllPages,
  getPageById,
  getAdminPageByKey,
  createPage,
  updatePage,
  publishPage,
  deletePage,
};

export default pageService;

// MukonoTalks

