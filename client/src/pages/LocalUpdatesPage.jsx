import React from 'react';
import { Helmet } from 'react-helmet-async';

const updates = [
  'Mukono municipal road repairs scheduled this week around central trading routes.',
  'Community cleanup drive planned for Sunday in Ggulu and nearby neighborhoods.',
  'New youth sports fixtures announced for schools across Mukono district.',
];

const LocalUpdatesPage = () => {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8">
      <Helmet>
        <title>Local Updates | MukonoTalks</title>
        <meta name="description" content="Hyper-local Mukono updates on civic activity, schools, roads, and community events." />
      </Helmet>

      <h1 className="font-display text-3xl font-bold text-text-primary">Mukono Local Updates</h1>
      <p className="mt-2 max-w-2xl text-text-secondary">
        Real-time neighborhood and district updates to keep residents informed.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {updates.map((item) => (
          <article key={item} className="rounded-2xl border border-dark-border bg-dark-slate p-5 shadow-card">
            <p className="text-sm leading-6 text-text-secondary">{item}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default LocalUpdatesPage;
