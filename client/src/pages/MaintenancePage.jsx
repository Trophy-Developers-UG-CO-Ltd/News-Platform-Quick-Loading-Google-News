import React from 'react';
 
export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#0A0A0A] text-white">
      <div className="flex flex-col items-center justify-center flex-1 px-6 text-center">
        <h1 className="text-5xl md:text-6xl font-black tracking-tight">
          MukonoTalks
        </h1>

        <p className="mt-4 text-sm tracking-[0.3em] text-gray-400 uppercase">
          Coming Soon
        </p>

        <div className="w-16 h-[1px] bg-[#2E2E2E] my-8"></div>

        <p className="text-gray-400 text-sm max-w-md">
          We are preparing a better experience for you. Stay connected and be the first to know when we go live.
        </p>

        <a
          href="https://wa.me/256755303076"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center justify-center px-6 py-3 bg-white text-black font-semibold rounded-xl transition hover:bg-gray-200"
        >
          Notify Me on WhatsApp
        </a>
      </div>

      <div className="text-center text-xs text-gray-500 pb-6">
        MukonoTalks © All rights reserved.
      </div>
    </div>
  );
}

// MukonoTalks

