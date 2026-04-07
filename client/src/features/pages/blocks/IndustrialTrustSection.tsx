import React from "react"
import {
  ShieldCheck,
  Truck,
  FlaskConical,
  Handshake,
  ArrowRight
} from "lucide-react"
import { LucideIcon } from "lucide-react"

/**
 * Feature type definition
 */
type Feature = {
  icon: LucideIcon
  title: string
  description: string
  highlight: boolean
}

/**
 * Feature data
 */
const features: Feature[] = [
  {
    icon: ShieldCheck,
    title: "Certified Quality",
    description:
      "All chemical materials supplied by MukonoTalks meet internationally recognized safety, performance, and quality standards required for industrial manufacturing.",
    highlight: false
  },
  {
    icon: Truck,
    title: "Reliable Distribution",
    description:
      "Efficient logistics and distribution networks supporting consistent delivery of industrial pigments, resins, and specialty materials for production environments.",
    highlight: true
  },
  {
    icon: FlaskConical,
    title: "Technical Expertise",
    description:
      "Decades of experience supplying chemical raw materials for coatings manufacturing, plastics production, water treatment, and industrial processing.",
    highlight: false
  },
  {
    icon: Handshake,
    title: "B2B Partnerships",
    description:
      "Dedicated support for manufacturers, distributors, and industrial buyers requiring stable supply chains and long-term technical collaboration.",
    highlight: false
  }
]

/**
 * Component
 */
const IndustrialTrustSection: React.FC = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">

        {/* SECTION HEADER */}

        <div className="max-w-3xl mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Industrial Chemical Supply You Can Trust
          </h2>

          <p className="text-gray-600 mt-4 text-lg">
            MukonoTalks supports manufacturers and industrial buyers with
            reliable chemical materials, technical expertise, and dependable
            supply infrastructure across African markets.
          </p>
        </div>

        {/* FEATURE GRID */}

        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">

          {features.map((feature, index) => {
            const Icon = feature.icon

            return (
              <div
                key={index}
                className={`relative group rounded-xl p-8 transition-all duration-300 ${
                  feature.highlight
                    ? "bg-[#1e3a8a] text-white shadow-xl"
                    : "bg-white shadow-md hover:shadow-xl"
                }`}
              >

                {/* ICON */}

                <div
                  className={`w-12 h-12 flex items-center justify-center rounded-lg mb-6 ${
                    feature.highlight
                      ? "bg-white/10"
                      : "bg-[#1e3a8a]/10"
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      feature.highlight
                        ? "text-white"
                        : "text-[#1e3a8a]"
                    }`}
                  />
                </div>

                {/* TITLE */}

                <h3 className="text-xl font-semibold mb-3">
                  {feature.title}
                </h3>

                {/* DESCRIPTION */}

                <p
                  className={`text-sm leading-relaxed ${
                    feature.highlight
                      ? "text-gray-200"
                      : "text-gray-600"
                  }`}
                >
                  {feature.description}
                </p>

                {/* CTA */}

                <div className="mt-6">
                  <a
                    href="/about-us"
                    className={`inline-flex items-center text-sm font-semibold ${
                      feature.highlight
                        ? "text-[#f97316]"
                        : "text-[#1e3a8a]"
                    }`}
                  >
                    Learn More
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </a>
                </div>

                {/* ACCENT BAR */}

                <div
                  className={`absolute bottom-0 left-0 h-1 w-full ${
                    feature.highlight
                      ? "bg-[#f97316]"
                      : "bg-[#2eb570]"
                  }`}
                />

              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}

export default IndustrialTrustSection