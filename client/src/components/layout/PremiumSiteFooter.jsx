import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaInstagram, FaTiktok, FaXTwitter, FaYoutube, FaWhatsapp } from 'react-icons/fa6';

const WHATSAPP_HREF =
  'https://wa.me/256755303076?text=Hi%2C%20I%20love%20your%20articles%20please%2C%20I%20need%20your%20help%20on%20http%3A%2F%2Flocalhost%3A3000%2F%20its%20about%20Untitled%20story';

const SOCIAL_LINKS = [
  {
    label: 'WhatsApp',
    href: WHATSAPP_HREF,
    Icon: FaWhatsapp,
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@mukonotalks',
    Icon: FaTiktok,
  },
  {
    label: 'X',
    href: 'https://x.com/mukonotalks',
    Icon: FaXTwitter,
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/mukonotalks',
    Icon: FaFacebookF,
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/mukonotalks',
    Icon: FaYoutube,
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/mukonotalks',
    Icon: FaInstagram,
  },
];

const PremiumSiteFooter = () => {
  return (
    <footer className="mt-10 border-t border-white/10 bg-black text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 text-sm md:flex-row md:items-center md:justify-between">
        <p className="text-white/90">© Mukono Talks</p>

        <div className="flex flex-wrap items-center gap-4 text-white/90">
          <Link to="/about" className="transition hover:text-white">About</Link>
          <Link to="/advertise" className="transition hover:text-white">Advertise</Link>
          <Link to="/contact" className="transition hover:text-white">Contact</Link>
        </div>

        <div className="flex items-center gap-2">
          {SOCIAL_LINKS.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              title={`${label} /mukonotalks`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black text-white transition hover:border-white hover:bg-white hover:text-black"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default PremiumSiteFooter;
