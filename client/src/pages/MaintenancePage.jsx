/**
 * MaintenancePage — Full-screen blocking page shown when maintenance mode is active
 * @module pages/MaintenancePage
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { Wrench, Clock } from 'lucide-react';

const MaintenancePage = () => {
  const { message, estimatedEnd } = useSelector((s) => s.maintenance);
  const { settings: branding } = useSelector((s) => s.branding);

  const platformName = branding?.platformName || 'MukonoTalks';
  const accentColor = branding?.primaryColor || '#4f46e5';

  const formattedEnd = estimatedEnd
    ? new Date(estimatedEnd).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Icon */}
        <div
          className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-8 shadow-lg"
          style={{ backgroundColor: accentColor }}
        >
          <Wrench className="w-10 h-10 text-white" />
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Under Maintenance
        </h1>

        {/* Message */}
        <p className="text-slate-300 text-lg leading-relaxed mb-6">
          {message || 'We are currently performing scheduled maintenance. Please check back soon.'}
        </p>

        {/* Estimated time */}
        {formattedEnd && (
          <div className="inline-flex items-center gap-2 bg-slate-700/50 rounded-lg px-4 py-2.5 text-slate-300 text-sm">
            <Clock className="w-4 h-4" />
            <span>Expected back: <span className="text-white font-medium">{formattedEnd}</span></span>
          </div>
        )}

        {/* Platform name */}
        <p className="mt-10 text-slate-500 text-sm">
          {platformName}
        </p>
      </div>
    </div>
  );
};

export default MaintenancePage;

// MukonoTalks

