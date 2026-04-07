import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ADSENSE_CLIENT_ID } from '../../config/ads';

const AdSenseScript = () => {
  if (!ADSENSE_CLIENT_ID) return null;

  return (
    <Helmet>
      <script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
        crossOrigin="anonymous"
      />
    </Helmet>
  );
};

export default AdSenseScript;
