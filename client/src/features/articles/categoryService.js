import api from '../../app/axios';

const listCategories = async () => {
  const { data } = await api.get('/categories');
  return data;
};

const listAllCategoriesAdmin = async () => {
  const { data } = await api.get('/categories/admin/all');
  return data;
};

const createCategory = async (payload) => {
  const { data } = await api.post('/categories', payload);
  return data;
};

const updateCategory = async (id, payload) => {
  const { data } = await api.put(`/categories/${id}`, payload);
  return data;
};

const deactivateCategory = async (id) => {
  const { data } = await api.delete(`/categories/${id}`);
  return data;
};

const normalizeCategoryOptions = (categories = []) => {
  return categories
    .filter((category) => category?.isActive !== false)
    .map((category) => ({
      value: category?.slug || category?.name || '',
      label: category?.localizedName?.en || category?.name || category?.slug || 'Unnamed category',
    }))
    .filter((item) => item.value)
    .sort((a, b) => a.label.localeCompare(b.label));
};

export default {
  listCategories,
  listAllCategoriesAdmin,
  createCategory,
  updateCategory,
  deactivateCategory,
  normalizeCategoryOptions,
};
