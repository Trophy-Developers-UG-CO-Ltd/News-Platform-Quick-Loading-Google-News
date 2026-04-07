import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Search,
  Flame,
  PlayCircle,
  Briefcase,
  BarChart3,
  MessageCircle,
} from 'lucide-react';

const posts = Array.from({ length: 12 });

const MukonoHome = () => {
  return (
    <div className="min-h-screen bg-dark-charcoal text-text-primary">
      <Helmet>
        <title>MukonoTalks | News, Entertainment, Local Updates</title>
        <meta
          name="description"
          content="MukonoTalks premium homepage for high-traffic news, entertainment, opportunities, and video content with ad-ready placement."
        />
      </Helmet>

      <header className="sticky top-0 z-50 border-b border-dark-border bg-dark-charcoal/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-xl font-bold tracking-widest text-text-primary">
            MUKONO TALKS
          </Link>

          <nav className="hidden gap-6 text-sm text-text-secondary md:flex">
            <Link to="/" className="transition hover:text-text-primary">Home</Link>
            <Link to="/news" className="transition hover:text-text-primary">News</Link>
            <Link to="/entertainment" className="transition hover:text-text-primary">Entertainment</Link>
            <Link to="/local" className="transition hover:text-text-primary">Politics</Link>
            <Link to="/entertainment" className="transition hover:text-text-primary">Lifestyle</Link>
            <Link to="/applications" className="transition hover:text-text-primary">Opportunities</Link>
            <Link to="/videos" className="transition hover:text-text-primary">Videos</Link>
          </nav>

          <div className="flex items-center gap-4 text-text-secondary">
            <button type="button" className="cursor-pointer hover:text-text-primary" aria-label="Search">
              <Search size={18} />
            </button>
            <button type="button" className="cursor-pointer hover:text-text-primary" aria-label="Trending">
              <Flame size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-hidden whitespace-nowrap bg-dark-black px-4 py-2 text-xs text-text-muted">
          Trending: Politics update • Celebrity news • Jobs released • Campus trends • Business stories
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search news, topics, videos..."
            className="w-full rounded-2xl border border-dark-border bg-dark-slate px-4 py-3 pl-10 text-text-primary outline-none focus:border-dark-hover"
          />
        </div>
      </div>

      <section className="mx-auto grid w-full max-w-7xl gap-4 px-4 md:grid-cols-3">
        <div className="group relative overflow-hidden rounded-3xl shadow-card md:col-span-2">
          <img
            src="https://via.placeholder.com/800x500"
            alt="Featured headline"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />

          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-dark-black via-black/40 to-transparent p-6">
            <span className="text-xs text-category-news">NEWS</span>

            <h2 className="text-2xl font-bold leading-tight md:text-3xl">
              Major national headline with strong engagement hook
            </h2>

            <p className="mt-2 text-xs text-text-muted">2 hours ago • 12K views</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="group relative overflow-hidden rounded-3xl shadow-soft">
              <img
                src="https://via.placeholder.com/400x250"
                alt="Trending side story"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />

              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-dark-black to-transparent p-4">
                <span className="text-xs text-category-entertainment">ENTERTAINMENT</span>
                <h3 className="text-sm font-semibold">Trending story headline</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        <div className="flex h-24 items-center justify-center rounded-2xl border border-dark-border bg-dark-surface text-text-muted">
          Ad Space
        </div>
      </div>

      <section className="mx-auto w-full max-w-7xl px-4 py-6">
        <div className="mb-4 flex items-center gap-2">
          <Flame
            size={18}
            className="bg-gradient-to-r from-accent-orange to-accent-red bg-clip-text text-transparent"
          />
          <h3 className="text-lg font-semibold">Trending Now</h3>
        </div>

        <div className="flex gap-4 overflow-x-auto">
          {posts.slice(0, 8).map((_, i) => (
            <div
              key={i}
              className="min-w-[220px] overflow-hidden rounded-2xl bg-dark-surface shadow-soft transition hover:bg-dark-hover hover:shadow-card"
            >
              <img src="https://via.placeholder.com/200x120" alt="Trending card" className="w-full" />
              <div className="p-3 text-sm text-text-secondary">Trending headline example</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 md:grid-cols-3">
        {posts.map((_, i) => (
          <div key={i} className="group cursor-pointer animate-fade">
            <div className="overflow-hidden rounded-2xl shadow-soft">
              <img
                src="https://via.placeholder.com/400x250"
                alt="Article card"
                className="w-full transition duration-500 group-hover:scale-105"
              />
            </div>

            <span className="mt-2 block text-xs text-category-news">NEWS</span>

            <h3 className="mt-1 line-clamp-2 font-semibold text-text-primary">
              Article headline optimized for clicks and engagement
            </h3>

            <p className="mt-1 text-xs text-text-muted">April 2026</p>
          </div>
        ))}
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-center gap-2">
          <PlayCircle size={18} className="text-text-secondary" />
          <h3 className="text-lg font-semibold">Watch</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-dark-border bg-dark-surface p-4 shadow-card">
            <iframe
              className="h-64 w-full rounded-xl"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              allowFullScreen
              title="Featured video"
            />
            <p className="mt-3 text-sm text-text-secondary">Featured video headline</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-dark-border bg-dark-surface p-2 shadow-soft transition hover:bg-dark-hover"
              >
                <div className="flex h-24 items-center justify-center rounded bg-dark-black text-text-muted">
                  Video
                </div>
                <p className="mt-2 text-xs text-text-secondary">Video title</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-center gap-2">
          <Briefcase size={18} className="text-accent-green" />
          <h3 className="text-lg font-semibold">Opportunities</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-dark-border bg-dark-surface p-5 shadow-soft transition hover:bg-dark-hover"
            >
              <h4 className="font-semibold">Opportunity Title</h4>
              <p className="mt-2 text-sm text-text-secondary">
                Short description of job or opportunity.
              </p>
              <button type="button" className="mt-3 text-sm text-accent-green">
                View Details →
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-text-secondary" />
          <h3 className="text-lg font-semibold">Most Read</h3>
        </div>

        <ol className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <li key={i} className="cursor-pointer text-text-secondary transition hover:text-text-primary">
              {i}. Viral article headline users are reading
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 py-10 text-center">
        <div className="rounded-2xl border border-dark-border bg-dark-surface p-6 shadow-card">
          <div className="mb-2 flex justify-center">
            <MessageCircle size={20} className="text-accent-green" />
          </div>

          <h3 className="text-lg font-semibold">Join our WhatsApp Channel</h3>

          <button
            type="button"
            className="mt-4 rounded-xl bg-accent-green px-6 py-2 font-semibold text-dark-black transition hover:opacity-90"
          >
            Join Now
          </button>
        </div>
      </section>

      <footer className="mt-10 border-t border-dark-border">
        <div className="mx-auto flex w-full max-w-7xl flex-col justify-between px-4 py-6 text-sm text-text-muted md:flex-row">
          <p>© Mukono Talks</p>

          <div className="flex gap-4">
            <Link to="/about" className="hover:text-text-primary">About</Link>
            <Link to="/advertise" className="hover:text-text-primary">Advertise</Link>
            <Link to="/contact" className="hover:text-text-primary">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MukonoHome;
