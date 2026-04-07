/**
 * Article API service
 * Publishing engine fetch operations for public and admin
 * @module features/articles/articleService
 */

import api from '../../app/axios';

/**
 * Fetch a public article by language and slug
 */
const getPublicArticle = async (lang, slug) => {
  const response = await api.get(`/articles/${lang}/${slug}`);
  return response.data;
};

/**
 * List public articles with filters
 */
const listPublicArticles = async (params) => {
  const response = await api.get('/articles', { params });
  return response.data;
};

/**
 * Get all articles — admin (includes draft/scheduled)
 */
const getAllArticles = async (params) => {
  const response = await api.get('/articles/admin/all', { params });
  return response.data;
};

/**
 * Get a single article by ID — admin
 */
const getArticleById = async (articleId) => {
  const response = await api.get(`/articles/admin/${articleId}`);
  return response.data;
};

/**
 * Create a new article — admin
 */
const createArticle = async (articleData) => {
  const response = await api.post('/articles', articleData);
  return response.data;
};

/**
 * Update an article — admin
 */
const updateArticle = async (articleId, articleData) => {
  const response = await api.put(`/articles/${articleId}`, articleData);
  return response.data;
};

/**
 * Publish or unpublish an article — admin
 */
const publishArticle = async (articleId, action) => {
  const response = await api.patch(`/articles/publish/${articleId}`, { action });
  return response.data;
};

/**
 * Schedule an article — admin
 */
const scheduleArticle = async (articleId, scheduledAt) => {
  const response = await api.patch(`/articles/schedule/${articleId}`, { scheduledAt });
  return response.data;
};

/**
 * Delete an article — admin
 */
const deleteArticle = async (articleId) => {
  const response = await api.delete(`/articles/${articleId}`);
  return response.data;
};

/**
 * Get article analytics — admin
 */
const getArticleAnalytics = async () => {
  const response = await api.get('/articles/admin/analytics');
  return response.data;
};

const articleService = {
  getPublicArticle,
  listPublicArticles,
  getAllArticles,
  getArticleById,
  createArticle,
  updateArticle,
  publishArticle,
  scheduleArticle,
  deleteArticle,
  getArticleAnalytics,
};

export default articleService;

// MukonoTalks

