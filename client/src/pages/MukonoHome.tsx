// Type definitions for TSX compatibility
interface Category {
  name: string;
  slug: string;
}

interface Article {
  _id: string;
  title: string;
  excerpt: string;
  slug: string;
  featuredImage?: string;
  category?: Category;
  createdAt?: string;
  publishedAt?: string;
  viewCount?: number;
}

interface GroupedCategory {
  category: Category;
  articles: Article[];
}

const ALWAYS_SHOW = ["music", "lifestyle", "videos", "news"];

function formatCategoryLabel(slugOrName?: string): string {
  if (!slugOrName) return "News";
  return slugOrName
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function slugifyCategory(value?: string): string {
  if (!value) return "news";
  return value.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function normalizeArticle(raw: any, fallbackCategory?: Category): Article {
  const rawCategory = typeof raw.category === "string" ? raw.category : raw.category?.slug || raw.category?.name;
  const categorySlug = fallbackCategory?.slug || slugifyCategory(rawCategory);
  const categoryName = fallbackCategory?.name || formatCategoryLabel(rawCategory);

  return {
    ...raw,
    title: raw.title?.en || raw.title || "",
    excerpt: raw.excerpt?.en || raw.excerpt || "",
    slug: raw.slug || raw.localizedSlug?.en || "",
    category: { name: categoryName, slug: categorySlug },
  };
}

function sortByLatest(articles: Article[]) {
  return [...articles].sort(
    (a, b) =>
      new Date(b.createdAt || b.publishedAt || 0).getTime() -
      new Date(a.createdAt || a.publishedAt || 0).getTime()
  );
}

function sortByViews(articles: Article[]) {
  return [...articles].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
}

function ensureAlwaysShowSections(sections: GroupedCategory[]) {
  const existing = new Set(sections.map((section) => section.category.slug));
  const nextSections = [...sections];

  ALWAYS_SHOW.forEach((slug) => {
    if (!existing.has(slug)) {
      nextSections.push({
        category: { name: formatCategoryLabel(slug), slug },
        articles: [],
      });
    }
  });

  return nextSections;
}

function groupByCategory(articles: Article[]): GroupedCategory[] {
  const map: Record<string, { name: string; slug: string; articles: Article[] }> = {};

  articles.forEach((a) => {
    const name = a.category?.name?.trim() || "News";
    const slug =
      a.category?.slug?.trim() ||
      name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    if (!map[slug]) {
      map[slug] = { name, slug, articles: [] };
    }
    map[slug].articles.push(a);
  });

  return Object.values(map).map(({ name, slug, articles }) => ({
    category: { name, slug },
    articles,
  }));
}
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../app/axios";
import SafeImage from "../components/common/SafeImage";
import { buildArticlePathFromParts } from "../features/articles/articleUrls";



export default function MukonoHome() {
  const [sections, setSections] = useState<GroupedCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [search, setSearch] = useState<string>("");
  const [results, setResults] = useState<Article[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/categories/with-articles");

        const grouped: GroupedCategory[] = (data || []).map((cat: any) => {
          const category = {
            name: cat.name || formatCategoryLabel(cat.slug),
            slug: cat.slug || slugifyCategory(cat.name),
          };

          return {
            category,
            articles: (cat.articles || []).map((article: any) => normalizeArticle(article, category)),
          };
        });

        if (grouped.some((section) => section.articles.length > 0)) {
          setSections(ensureAlwaysShowSections(grouped));
          return;
        }

        const fallbackResponse = await api.get("/articles", { params: { limit: 12 } });
        const fallbackArticles = (fallbackResponse.data?.articles || []).map((article: any) =>
          normalizeArticle(article)
        );
        setSections(ensureAlwaysShowSections(groupByCategory(fallbackArticles)));
      } catch {
        try {
          const fallbackResponse = await api.get("/articles", { params: { limit: 12 } });
          const fallbackArticles = (fallbackResponse.data?.articles || []).map((article: any) =>
            normalizeArticle(article)
          );
          setSections(ensureAlwaysShowSections(groupByCategory(fallbackArticles)));
        } catch {
          setSections(ensureAlwaysShowSections([]));
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // SEARCH
  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }

    const all = sections.flatMap((s) => s.articles);
    const filtered = all.filter((a) =>
      a.title.toLowerCase().includes(search.toLowerCase())
    );
    setResults(filtered.slice(0, 6));
  }, [search, sections]);

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  const allArticles = sections.flatMap((s) => s.articles);
  const hero = sortByLatest(allArticles).slice(0, 2);
  const trending = sortByViews(allArticles).slice(0, 3);
  const visibleSections = sections.filter((section) => {
    const hasArticles = section.articles.length > 0;
    const always = ALWAYS_SHOW.includes(section.category.slug);
    return hasArticles || always;
  });

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">

      {/* 🔍 SEARCH */}
      <div className="relative w-full mb-8">
        <input
          type="text"
          placeholder="Search news..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-4 pr-14 border rounded-xl"
        />
        <span
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black rounded-full w-9 h-9 flex items-center justify-center shadow"
          aria-hidden="true"
        >
          <Search size={20} className="text-white" />
        </span>

        {results.length > 0 && (
          <div className="absolute w-full bg-white shadow-lg mt-2 rounded-xl z-50">
            {results.map((r) => (
              <Link
                key={r._id}
                to={buildArticlePathFromParts({ category: r.category?.slug || r.category?.name, slug: r.slug })}
                className="flex gap-3 p-3 hover:bg-gray-100"
              >
                <SafeImage
                  src={r.featuredImage}
                  alt={r.title ? `Image for ${r.title}` : "Article image"}
                  className="w-16 h-12 object-cover rounded"
                />
                <p className="text-sm font-bold">{r.title}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 📰 HERO */}
      <section className="grid md:grid-cols-2 gap-6 mb-10">
        {hero.map((a) => (
          <Link key={a._id} to={buildArticlePathFromParts({ category: a.category?.slug || a.category?.name, slug: a.slug })} className="relative">
            <SafeImage
              src={a.featuredImage}
              alt={a.title ? `Image for ${a.title}` : "Article image"}
              className="w-full h-[320px] object-cover rounded-xl"
            />
            <div className="absolute inset-0 bg-black/50" />
            <div className="absolute bottom-4 left-4 text-white">
              <span className="text-xs uppercase">
                {a.category?.name || "News"}
              </span>
              <h2 className="text-xl font-bold">{a.title}</h2>
            </div>
          </Link>
        ))}
      </section>

      {/* 📂 CATEGORY SECTIONS */}
      {visibleSections.map((section, index) => (
        <div key={section.category.slug}>
          <section className="mb-12">

            <div className="flex justify-between mb-4">
              <h2 className="text-2xl font-bold">
                {section.category.name}
              </h2>

              <Link to={`/category/${section.category.slug}`}>
                View all →
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {section.articles.slice(0, 2).map((a) => (
                <Link key={a._id} to={buildArticlePathFromParts({ category: a.category?.slug || a.category?.name, slug: a.slug })}>
                  <SafeImage
                    src={a.featuredImage}
                    alt={a.title ? `Image for ${a.title}` : "Article image"}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <h2 className="mt-2 font-semibold line-clamp-2">
                    {a.title}
                  </h2>
                </Link>
              ))}
            </div>

          </section>

          {index < visibleSections.length - 1 && (
            <div className="my-10 bg-gray-100 h-32 flex items-center justify-center rounded">
              Ad Space (728x90)
            </div>
          )}
        </div>
      ))}

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Trending</h2>

        <div className="grid md:grid-cols-3 gap-6">
          {trending.map((a) => (
            <Link key={a._id} to={buildArticlePathFromParts({ category: a.category?.slug || a.category?.name, slug: a.slug })}>
              <SafeImage
                src={a.featuredImage}
                alt={a.title ? `Image for ${a.title}` : "Article image"}
                className="w-full h-40 object-cover rounded-lg"
              />
              <h2 className="mt-2 font-semibold line-clamp-2">
                {a.title}
              </h2>
            </Link>
          ))}
        </div>
      </section>

    </main>
  );
}
