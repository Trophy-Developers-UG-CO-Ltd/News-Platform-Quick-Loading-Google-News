import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import categoryService from '../../features/articles/categoryService';
import RichTextEditor from '../../components/ui/RichTextEditor';
import SafeRichText from '../../components/ui/SafeRichText';

const emptyForm = {
  name: '',
  description: '',
  image: '',
  parent: null,
  isActive: true,
};

const EditorCategoriesPage = ({ backTo = '/editor', backLabel = 'Back to CMS' }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState(emptyForm);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const { categories: rows = [] } = await categoryService.listAllCategoriesAdmin();
      setCategories(rows);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const parentOptions = useMemo(
    () => categories.filter((category) => category._id !== editingId),
    [categories, editingId]
  );

  const resetForm = () => {
    setEditingId('');
    setForm(emptyForm);
  };

  const startEdit = (category) => {
    setEditingId(category._id);
    setForm({
      name: category.name || '',
      description: category.description || '',
      image: category.image || '',
      parent: category.parent?._id || category.parent || null,
      isActive: category.isActive !== false,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description || '',
        image: form.image?.trim() || '',
        parent: form.parent || null,
        isActive: form.isActive,
      };

      if (editingId) {
        await categoryService.updateCategory(editingId, payload);
        toast.success('Category updated');
      } else {
        await categoryService.createCategory(payload);
        toast.success('Category created');
      }

      resetForm();
      await loadCategories();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (category) => {
    setSaving(true);
    try {
      await categoryService.updateCategory(category._id, { isActive: !category.isActive });
      toast.success(!category.isActive ? 'Category activated' : 'Category deactivated');
      await loadCategories();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update category');
    } finally {
      setSaving(false);
    }
  };

  const moveCategory = async (index, direction) => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= categories.length) return;

    const current = categories[index];
    const adjacent = categories[target];

    setSaving(true);
    try {
      await Promise.all([
        categoryService.updateCategory(current._id, { sortOrder: adjacent.sortOrder ?? target }),
        categoryService.updateCategory(adjacent._id, { sortOrder: current.sortOrder ?? index }),
      ]);
      toast.success('Category order updated');
      await loadCategories();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to reorder categories');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-text-primary">Categories CMS</h1>
          <p className="mt-1 text-sm text-text-secondary">Create, edit, reorder, and activate editorial categories.</p>
        </div>
        <Link to={backTo} className="text-sm font-semibold text-accent-blue transition-colors hover:text-category-news">
          {backLabel}
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-dark-border bg-dark-slate p-5 shadow-card lg:col-span-1">
          <h2 className="text-lg font-semibold text-text-primary">{editingId ? 'Edit Category' : 'New Category'}</h2>

          <label className="block">
            <span className="text-sm font-medium text-text-secondary">Name</span>
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-dark-border bg-dark-charcoal px-3 py-2 text-text-primary placeholder:text-text-muted"
              placeholder="News"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-text-secondary">Description</span>
            <RichTextEditor
              value={form.description}
              onChange={(value) => setForm((prev) => ({ ...prev, description: value }))}
              minHeight={180}
              placeholder="Category summary"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-text-secondary">Image URL</span>
            <input
              value={form.image}
              onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-dark-border bg-dark-charcoal px-3 py-2 text-text-primary placeholder:text-text-muted"
              placeholder="https://..."
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-text-secondary">Parent Category</span>
            <select
              value={form.parent || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, parent: e.target.value || null }))}
              className="mt-1 w-full rounded-xl border border-dark-border bg-dark-charcoal px-3 py-2 text-text-primary"
            >
              <option value="">No parent</option>
              {parentOptions.map((category) => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={!!form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
            />
            Active category
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-accent-blue px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-category-news disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Update Category' : 'Create Category'}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-dark-border bg-dark-charcoal px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-dark-hover hover:text-text-primary"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        <div className="rounded-2xl border border-dark-border bg-dark-slate p-5 shadow-card lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold text-text-primary">Category List</h2>

          {loading ? <p className="text-text-secondary">Loading categories...</p> : null}

          {!loading && categories.length === 0 ? (
            <p className="text-text-secondary">No categories found.</p>
          ) : (
            <div className="space-y-2">
              {categories.map((category, index) => (
                <article key={category._id} className="rounded-xl border border-dark-border bg-dark-charcoal p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-text-primary">{category.name}</h3>
                      <p className="mt-1 text-xs text-text-muted">slug: {category.slug} · sort: {category.sortOrder ?? index}</p>
                      {category.description ? (
                        <SafeRichText
                          className="prose prose-sm mt-2 max-w-none text-text-secondary prose-headings:text-text-primary prose-strong:text-text-primary prose-a:text-accent-blue"
                          html={category.description}
                        />
                      ) : null}
                      {category.parent?.name ? (
                        <p className="mt-1 text-xs text-text-muted">parent: {category.parent.name}</p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${category.isActive ? 'bg-accent-green/15 text-accent-green' : 'bg-dark-slate text-text-secondary'}`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        type="button"
                        disabled={saving || index === 0}
                        onClick={() => moveCategory(index, 'up')}
                        className="rounded-full border border-dark-border bg-dark-slate px-2 py-1 text-xs font-semibold text-text-secondary disabled:opacity-40"
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        disabled={saving || index === categories.length - 1}
                        onClick={() => moveCategory(index, 'down')}
                        className="rounded-full border border-dark-border bg-dark-slate px-2 py-1 text-xs font-semibold text-text-secondary disabled:opacity-40"
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => startEdit(category)}
                        className="rounded-full border border-dark-border bg-dark-slate px-3 py-1 text-xs font-semibold text-text-secondary transition-colors hover:bg-dark-hover hover:text-text-primary"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => toggleActive(category)}
                        className="rounded-full border border-dark-border bg-dark-slate px-3 py-1 text-xs font-semibold text-text-secondary transition-colors hover:bg-dark-hover hover:text-text-primary"
                      >
                        {category.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default EditorCategoriesPage;
