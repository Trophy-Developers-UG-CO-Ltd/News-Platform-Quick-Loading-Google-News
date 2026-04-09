import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../app/axios';
import Spinner from '../components/ui/Spinner';
import { Helmet } from 'react-helmet-async';

const resolveText = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.en || value.sw || value.zh || '';
};

const toTitleCase = (value = '') =>
  String(value)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

const CategoryPage = () => {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [catRes, artRes] = await Promise.all([
          api.get(`/categories/${slug}`),
          api.get('/articles', { params: { category: slug, page: 1, limit: 24 } }),
        ]);
        if (!mounted) return;
        setCategory(catRes.data.category || null);
        setArticles(Array.isArray(artRes.data.articles) ? artRes.data.articles : []);
      } catch {
        if (mounted) {
          setCategory(null);
          setArticles([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (slug) fetchData();
    return () => { mounted = false; };
  }, [slug]);

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="lg" /></div>;
  if (!category) return <div className="py-20 text-center text-gray-500">Category not found.</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Helmet>
        <title>{toTitleCase(resolveText(category.localizedName) || category.name || slug)} | MukonoTalks</title>
      </Helmet>
      <h1 className="text-3xl font-bold mb-6">{toTitleCase(resolveText(category.localizedName) || category.name || slug)}</h1>
      {articles.length === 0 ? (
        <div className="text-gray-500">No articles found in this category.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((article) => (
            <Link key={article._id} to={"/blog/" + (article.localizedSlug?.en || article.localizedSlug)} className="block border rounded-lg p-4 hover:shadow-md transition">
              <div className="font-semibold text-lg mb-2">{resolveText(article.title)}</div>
              <div className="text-gray-600 text-sm mb-1">{article.author?.name}</div>
              <div className="text-gray-500 text-xs">{new Date(article.publishedAt).toLocaleDateString()}</div>
              <div className="mt-2 text-gray-700 line-clamp-3">{resolveText(article.excerpt)}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
