import React from 'react';
import { Helmet } from 'react-helmet-async';

const EntertainmentPage = () => {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8">
      <Helmet>
        <title>Entertainment | MukonoTalks</title>
        <meta name="description" content="Entertainment stories, creator culture and community lifestyle from Mukono." />
      </Helmet>

      <h1 className="font-display text-3xl font-bold text-text-primary">Entertainment</h1>
      <p className="mt-2 max-w-2xl text-text-secondary">
        Music, events, creators and social culture shaping Mukono conversations.
      </p>

      <div className="mt-7 rounded-2xl border border-dark-border bg-dark-slate p-6 shadow-card">
        <h2 className="text-xl font-semibold text-text-primary">Editor picks</h2>
        <ul className="mt-4 space-y-3 text-sm text-text-secondary">
          <li>Mukono weekend events roundup and venue highlights.</li>
          <li>Top local creators to watch this month on short-form video.</li>
          <li>Community festival preview with artist and host line-up.</li>
        </ul>
      </div>
    </section>
  );
};

export default EntertainmentPage;
