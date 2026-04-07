import React from 'react';
import { Helmet } from 'react-helmet-async';

const EntertainmentPage = () => {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8">
      <Helmet>
        <title>Entertainment | MukonoTalks</title>
        <meta name="description" content="Entertainment stories, creator culture and community lifestyle from Mukono." />
      </Helmet>

      <h1 className="text-3xl font-bold text-gray-900">Entertainment</h1>
      <p className="mt-2 max-w-2xl text-gray-600">
        Music, events, creators and social culture shaping Mukono conversations.
      </p>

      <div className="mt-7 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Editor picks</h2>
        <ul className="mt-4 space-y-3 text-sm text-gray-700">
          <li>Mukono weekend events roundup and venue highlights.</li>
          <li>Top local creators to watch this month on short-form video.</li>
          <li>Community festival preview with artist and host line-up.</li>
        </ul>
      </div>
    </section>
  );
};

export default EntertainmentPage;
