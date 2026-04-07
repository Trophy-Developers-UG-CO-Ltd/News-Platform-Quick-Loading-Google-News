/**
 * About Us — MukonoTalks Ltd
 * Dynamic CMS-driven page — editable via Admin › Pages › "about"
 * Falls back to the built-in static layout when the CMS record does not exist yet.
 */

import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Factory,
  FlaskConical,
  Droplets,
  Paintbrush,
  Globe,
  FileText,
  ShieldCheck,
  MapPin,
  ChevronRight,
  Users,
  Award,
  TrendingUp,
  Zap,
  ArrowRight,
  Pencil,
  PlusCircle,
} from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import BlockRenderer from './BlockRenderer'
import usePage from './usePage'
import pageService from './pageService'
import Spinner from '../../components/ui/Spinner'

/* ─── Data ─────────────────────────────────────────────────────── */

const STATS = [
  { value: '10+', label: 'Years of Experience', icon: Award },
  { value: '500+', label: 'Products in Catalogue', icon: FlaskConical },
  { value: '4', label: 'Country Offices', icon: Globe },
  { value: '1,000+', label: 'Business Clients', icon: Users },
]

const INDUSTRIES = [
  {
    icon: Paintbrush,
    title: 'Coatings Manufacturing',
    desc: 'Pigments and resin systems for protective coatings, decorative paints, and industrial surface finishes.',
    color: 'bg-rose-50 text-rose-600',
  },
  {
    icon: Factory,
    title: 'Plastics Manufacturing',
    desc: 'Pigments and additives that enhance colour performance and durability in polymer materials.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Droplets,
    title: 'Water Treatment',
    desc: 'Ion exchange resins used in municipal and industrial water purification systems.',
    color: 'bg-sky-50 text-sky-600',
  },
  {
    icon: FlaskConical,
    title: 'Composite Materials',
    desc: 'Polyester resins for fiberglass, construction composites, and advanced material fabrication.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Zap,
    title: 'Industrial Processing',
    desc: 'Specialty raw materials for chemical processing plants and manufacturing facilities.',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    icon: TrendingUp,
    title: 'Export & Distribution',
    desc: 'Pan-African chemical distribution network spanning East Africa and Southern Africa.',
    color: 'bg-teal-50 text-teal-600',
  },
]

const PORTFOLIO = [
  {
    icon: FlaskConical,
    title: 'Industrial Pigments',
    desc: 'Used in coatings manufacturing, polymer compounding, plastics production, and specialty material formulation.',
    badge: 'Core Product',
  },
  {
    icon: Factory,
    title: 'Polyester Resins',
    desc: 'Resin systems in coatings, composite materials, fiberglass structures, and construction materials.',
    badge: 'High Demand',
  },
  {
    icon: Droplets,
    title: 'Ion Exchange Resins',
    desc: 'Chemical purification systems used in industrial filtration and water treatment facilities.',
    badge: 'Specialist',
  },
]

const LOCATIONS = [
  { city: 'Kampala', country: 'Uganda' },
  { city: 'Nairobi', country: 'Kenya' },
  { city: 'Dar es Salaam', country: 'Tanzania' },
  { city: 'Guangzhou', country: 'China' },
]

/* ─── Admin bars ────────────────────────────────────────────────── */

/** Shown when the CMS page exists — lets admin jump straight to the editor */
const AdminEditBar = ({ pageId }) => (
  <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-8 flex items-center justify-between">
    <div className="flex items-center gap-2 text-amber-700 text-sm font-medium">
      <Pencil className="w-4 h-4" />
      <span>Admin — this page is CMS-driven. Edit blocks below.</span>
    </div>
    <Link
      to={`/admin/pages/${pageId}/edit`}
      className="flex items-center gap-1.5 text-sm font-semibold text-amber-700 border border-amber-300 px-3 py-1.5 rounded-md hover:bg-amber-100 transition-colors"
    >
      Edit in CMS <ArrowRight className="w-3 h-3" />
    </Link>
  </div>
)

/** Shown when no CMS record exists yet — lets admin create it immediately */
const AdminCreateBar = () => (
  <div className="bg-sky-50 border border-sky-200 rounded-lg px-4 py-3 mb-8 flex items-center justify-between">
    <div className="flex items-center gap-2 text-sky-700 text-sm font-medium">
      <PlusCircle className="w-4 h-4" />
      <span>This page is using the built-in static layout. Create a CMS record to enable block-based editing.</span>
    </div>
    <Link
      to="/admin/pages/new"
      className="flex items-center gap-1.5 text-sm font-semibold text-sky-700 border border-sky-300 px-3 py-1.5 rounded-md hover:bg-sky-100 transition-colors"
    >
      Create CMS record <ArrowRight className="w-3 h-3" />
    </Link>
  </div>
)

/** Shown when a CMS record exists but is not yet published */
const AdminDraftBar = ({ pageId }) => (
  <div className="bg-violet-50 border border-violet-200 rounded-lg px-4 py-3 mb-8 flex items-center justify-between">
    <div className="flex items-center gap-2 text-violet-700 text-sm font-medium">
      <Pencil className="w-4 h-4" />
      <span>CMS record exists but is in <strong>Draft</strong>. Publish it to make it live.</span>
    </div>
    <div className="flex items-center gap-2">
      <Link
        to={`/admin/pages/${pageId}/edit`}
        className="flex items-center gap-1.5 text-sm font-semibold text-violet-700 border border-violet-300 px-3 py-1.5 rounded-md hover:bg-violet-100 transition-colors"
      >
        Edit draft <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  </div>
)

/* ─── Dynamic wrapper ───────────────────────────────────────────── */

const About = () => {
  const { lang = 'en' } = useParams()
  const { user } = useSelector((state) => state.auth)
  const isAdmin = user?.role === 'admin' || user?.role === 'developer'

  // Start with the canonical slug; if the CMS page was renamed,
  // usePage returns a redirectTo and we extract+follow the new slug here
  // instead of navigating away (URL stays at /en/about or /en/about-us).
  const [activeSlug, setActiveSlug] = useState('about')
  const { page, isLoading, redirectTo } = usePage(lang, activeSlug)

  useEffect(() => {
    if (!redirectTo) return
    // Extract the final path segment as the new slug, e.g.:
    //   /en/page/about-us  →  about-us
    const newSlug = redirectTo.split('/').filter(Boolean).pop()
    if (newSlug && newSlug !== activeSlug) {
      setActiveSlug(newSlug)
    }
  }, [redirectTo, activeSlug])

  // When isAdmin and no published page found, check if a draft record exists
  const [draftPage, setDraftPage] = useState(null)
  useEffect(() => {
    if (!isAdmin || page || isLoading) return
    pageService.getAdminPageByKey(activeSlug)
      .then((res) => setDraftPage(res.page || null))
      .catch(() => setDraftPage(null))
  }, [isAdmin, page, isLoading, activeSlug])

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  /* ── CMS page found → render blocks ── */
  if (page) {
    return (
      <>
        <Helmet>
          <title>{page.seo?.title || 'About Us'} | MukonoTalks Ltd</title>
          {page.seo?.description && (
            <meta name="description" content={page.seo.description} />
          )}
          {page.seo?.keywords && (
            <meta name="keywords" content={page.seo.keywords} />
          )}
        </Helmet>

        {isAdmin && (
          <div className="container mx-auto px-6 pt-6">
            <AdminEditBar pageId={page._id} />
          </div>
        )}

        <BlockRenderer blocks={page.contentBlocks} />
      </>
    )
  }

  /* ── CMS page not found → static fallback ── */
  return <StaticAbout isAdmin={isAdmin} draftPage={draftPage} />
}

/* ═══════════════════════════════════════════════════════════════════
   STATIC FALLBACK
   Displayed until the admin seeds / creates the "about" CMS page.
   Run:  cd server && node seeds/seedAboutPage.js
   ═══════════════════════════════════════════════════════════════════ */

const StaticAbout = ({ isAdmin, draftPage }) => (
    <>
      <Helmet>
        <title>About Us | MukonoTalks Ltd</title>
        <meta
          name="description"
          content="MukonoTalks Ltd — supplier of industrial pigments, polyester resins, ion exchange resins, and specialty chemical raw materials across East Africa."
        />
      </Helmet>

      <div className="bg-white">

        {/* ── ADMIN NOTICE ────────────────────────────── */}
        {isAdmin && (
          <div className="container mx-auto px-6 pt-6">
            {draftPage
              ? <AdminDraftBar pageId={draftPage._id} />
              : <AdminCreateBar />
            }
          </div>
        )}

        {/* ── HERO ────────────────────────────────────── */}
        <section className="relative bg-gray-950 text-white overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1581092583537-20d51b4b4f1b?auto=format&fit=crop&w=1600&q=80"
            alt="Industrial chemical manufacturing"
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
          {/* gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 to-gray-950/20" />

          <div className="relative container mx-auto px-6 py-32 lg:py-44">
            <div className="flex items-center gap-2 text-primary-400 text-sm font-semibold tracking-widest uppercase mb-6">
              <ShieldCheck className="w-4 h-4" />
              Trusted Local Publishing Platform
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight max-w-3xl mb-6">
              About MukonoTalks<br />
              <span className="text-primary-400">Publishing Platform</span>
            </h1>
            <p className="max-w-2xl text-lg text-gray-300 mb-10">
              MukonoTalks is a digital publishing platform focused on Mukono news, entertainment,
              local updates, and embedded video storytelling with speed, SEO visibility, and simple
              editorial workflows at the core.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Browse Products <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/get-quote"
                className="inline-flex items-center gap-2 border border-white/30 hover:border-white/60 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Request a Quote
              </Link>
            </div>
          </div>
        </section>

        {/* ── STATS BAR ───────────────────────────────── */}
        <section className="bg-primary-700 text-white">
          <div className="container mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-center">
                <div className="flex justify-center mb-2">
                  <Icon className="w-6 h-6 text-primary-200" />
                </div>
                <div className="text-3xl font-bold">{value}</div>
                <div className="text-sm text-primary-200 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── WHO WE ARE ──────────────────────────────── */}
        <section className="py-20 lg:py-28">
          <div className="container mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-primary-600 text-sm font-semibold tracking-widest uppercase mb-3">
                Who We Are
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                Industrial Chemical Raw Materials for Manufacturing Industries
              </h2>
              <p className="text-gray-600 mb-5 leading-relaxed">
                MukonoTalks supplies chemical materials used across coatings production,
                plastics manufacturing, composite materials, water purification systems, and chemical
                processing facilities.
              </p>
              <p className="text-gray-600 mb-8 leading-relaxed">
                By maintaining strong supplier partnerships and structured product classification,
                we help manufacturers identify reliable materials for modern industrial production
                environments.
              </p>
              <div className="flex flex-wrap gap-3">
                {['ISO Compliant', 'SDS Documentation', 'Technical Support', 'Pan-African Delivery'].map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 text-sm font-medium px-3 py-1.5 rounded-full border border-primary-100"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1581093588401-22c1b7b49d0d?auto=format&fit=crop&w=800&q=80"
                alt="Chemical laboratory"
                className="rounded-2xl shadow-2xl w-full object-cover aspect-[4/3]"
              />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-5 flex items-center gap-4 max-w-[240px]">
                <div className="bg-primary-100 rounded-lg p-3">
                  <Award className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm">Quality Assured</div>
                  <div className="text-xs text-gray-500 mt-0.5">All products verified</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── INDUSTRIES ──────────────────────────────── */}
        <section className="bg-gray-50 py-20 lg:py-28">
          <div className="container mx-auto px-6">
            <div className="text-center mb-14">
              <div className="text-primary-600 text-sm font-semibold tracking-widest uppercase mb-3">
                Sectors We Serve
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                Industries Supported
              </h2>
              <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
                Our chemical raw materials are used across a wide range of high-demand manufacturing
                and processing industries.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {INDUSTRIES.map(({ icon: Icon, title, desc, color }) => (
                <div
                  key={title}
                  className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
                >
                  <div className={`inline-flex p-3 rounded-xl mb-5 ${color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRODUCT PORTFOLIO ───────────────────────── */}
        <section className="py-20 lg:py-28">
          <div className="container mx-auto px-6">
            <div className="text-center mb-14">
              <div className="text-primary-600 text-sm font-semibold tracking-widest uppercase mb-3">
                Our Products
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                Chemical Product Portfolio
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {PORTFOLIO.map(({ icon: Icon, title, desc, badge }) => (
                <div key={title} className="relative border border-gray-200 rounded-2xl p-8 hover:border-primary-300 hover:shadow-lg transition-all group">
                  <span className="absolute top-5 right-5 text-xs font-semibold bg-primary-50 text-primary-600 px-2.5 py-1 rounded-full border border-primary-100">
                    {badge}
                  </span>
                  <Icon className="w-10 h-10 text-primary-600 mb-5" />
                  <h3 className="font-bold text-gray-900 text-xl mb-3">{title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-5">{desc}</p>
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-1.5 text-primary-600 font-semibold text-sm hover:gap-3 transition-all"
                  >
                    View products <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── VIDEO ───────────────────────────────────── */}
        <section className="bg-gray-950 text-white py-20 lg:py-28">
          <div className="container mx-auto px-6 text-center">
            <div className="text-primary-400 text-sm font-semibold tracking-widest uppercase mb-3">
              Our Work
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-5">
              Industrial Chemical Supply & Manufacturing
            </h2>
            <p className="max-w-2xl mx-auto text-gray-400 mb-12">
              MukonoTalks collaborates with global chemical manufacturers to supply industrial
              materials supporting coatings production, plastics manufacturing, water purification,
              and advanced material formulation.
            </p>
            <div className="max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              <iframe
                className="w-full aspect-video"
                src="https://www.youtube.com/embed/BX6n1kA5B5M"
                title="Industrial Chemical Production"
                allowFullScreen
              />
            </div>
          </div>
        </section>

        {/* ── DOCUMENTATION ───────────────────────────── */}
        <section className="py-20 lg:py-28 bg-gray-50">
          <div className="container mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1581091215367-59ab6f9c6f1c?auto=format&fit=crop&w=800&q=80"
                alt="Chemical documentation and technical sheets"
                className="rounded-2xl shadow-xl w-full object-cover aspect-[4/3]"
              />
            </div>

            <div>
              <div className="inline-flex p-4 bg-primary-50 rounded-2xl mb-6">
                <FileText className="w-8 h-8 text-primary-600" />
              </div>
              <div className="text-primary-600 text-sm font-semibold tracking-widest uppercase mb-3">
                Technical Resources
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-5">
                Structured Technical Documentation
              </h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                MukonoTalks provides structured documentation for industrial buyers including
                product specifications, technical data sheets, and Safety Data Sheets (SDS).
              </p>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Registered business users can access extended technical documentation through secure
                account access.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Register for Access <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── LOCATIONS ───────────────────────────────── */}
        <section className="py-20 lg:py-28">
          <div className="container mx-auto px-6">
            <div className="text-center mb-14">
              <div className="text-primary-600 text-sm font-semibold tracking-widest uppercase mb-3">
                Our Presence
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Our Locations
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                Offices and distribution networks across East Africa and Asia to serve our
                international client base.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {LOCATIONS.map(({ city, country }) => (
                <div
                  key={city}
                  className="border border-gray-200 rounded-2xl p-7 flex flex-col items-center text-center hover:border-primary-300 hover:shadow-md transition-all"
                >
                  <div className="bg-primary-50 rounded-full p-4 mb-4">
                    <MapPin className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">{city}</h3>
                  <p className="text-gray-500 text-sm mt-1">{country}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────── */}
        <section className="bg-gradient-to-br from-primary-700 to-primary-900 text-white py-20 lg:py-28">
          <div className="container mx-auto px-6 text-center">
            <Globe className="w-12 h-12 text-primary-300 mx-auto mb-6" />
            <h2 className="text-3xl lg:text-4xl font-bold mb-5">
              Work With MukonoTalks
            </h2>
            <p className="max-w-2xl mx-auto mb-10 text-primary-100 text-lg">
              Access technical documentation, product specifications, and industrial chemical supply
              support for your manufacturing operations.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-white text-primary-700 font-bold px-8 py-3.5 rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                Create Business Account <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 border border-white/30 hover:border-white/60 text-white font-semibold px-8 py-3.5 rounded-lg transition-colors"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </section>

      </div>
    </>
)

export default About