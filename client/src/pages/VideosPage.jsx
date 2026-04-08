import React from 'react';
import { Helmet } from 'react-helmet-async';

const videos = [
  {
    platform: 'YouTube',
    title: 'Mukono community story',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
  {
    platform: 'TikTok',
    title: 'Mukono quick update',
    embedUrl: 'https://www.tiktok.com/embed/v2/7231832812999999999',
  },
];

const VideosPage = () => {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8">
      <Helmet>
        <title>Videos | MukonoTalks</title>
        <meta name="description" content="Watch MukonoTalks videos from YouTube and TikTok." />
      </Helmet>

      <h1 className="font-display text-3xl font-bold text-text-primary">Video Desk</h1>
      <p className="mt-2 max-w-2xl text-text-secondary">
        Curated YouTube and TikTok embeds for local reporting and entertainment.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {videos.map((video) => (
          <article key={video.embedUrl} className="overflow-hidden rounded-2xl border border-dark-border bg-dark-slate shadow-card">
            <div className="aspect-video w-full bg-dark-black">
              <iframe
                className="h-full w-full"
                src={video.embedUrl}
                title={video.title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent-blue">{video.platform}</p>
              <h2 className="mt-1 text-base font-semibold text-text-primary">{video.title}</h2>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default VideosPage;
