"use client";

import { motion } from "framer-motion";
import { HeroButtons } from "./HeroButtons";
import { HeroIllustration } from "./HeroIllustration";
import { FeaturesBar } from "./FeaturesBar";

type HeroContent = {
  heroTitle?: string | null;
  heroAccent?: string | null;
  heroSubtitle?: string | null;
  heroRightImage?: string | null;
  primaryCta?: string | null;
  secondaryCta?: string | null;
};

type HeroSectionProps = {
  content?: HeroContent | null;
};

const fallbackSubtitle =
  "At NextStep Global Educational Services, we provide personalized guidance for students aspiring to study abroad. From university selection and admissions to scholarship assistance, visa processing, and pre-departure support, we're with you every step of the way.\n\nWe don't just process applications - we help shape your future. Partner with experienced mentors dedicated to guiding you toward the world's leading universities.";

export function HeroSection({ content }: HeroSectionProps) {
  const subtitle = content?.heroSubtitle || fallbackSubtitle;

  return (
    <section id="home" className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero__orb home-hero__orb--left" aria-hidden="true" />
      <div className="home-hero__orb home-hero__orb--right" aria-hidden="true" />

      <div className="home-hero__inner">
        <div className="home-hero__copy">
          <motion.h1
            id="home-hero-title"
            className="home-hero__title"
            initial={{ opacity: 0, y: 34 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <span>
              <span className="home-hero__title-white">future</span>{" "}
              <span className="home-hero__title-gold">starts</span>
            </span>
            <span className="home-hero__title-gold">here.</span>
          </motion.h1>

          <motion.div
            className="home-hero__body"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1, ease: "easeOut" }}
          >
            {subtitle.split(/\n{2,}/).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </motion.div>

          <HeroButtons primaryText={content?.primaryCta} secondaryText={content?.secondaryCta} />
        </div>

        <HeroIllustration imageUrl={content?.heroRightImage || undefined} />
      </div>

      <FeaturesBar />
    </section>
  );
}
