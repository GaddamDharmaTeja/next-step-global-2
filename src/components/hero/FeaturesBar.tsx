"use client";

import { motion } from "framer-motion";
import { Building2, GraduationCap, Plane, ShieldCheck, UsersRound } from "lucide-react";

const features = [
  {
    title: "Top Ranked",
    subtitle: "Universities",
    icon: Building2,
    tone: "blue",
  },
  {
    title: "Scholarship",
    subtitle: "Assistance",
    icon: GraduationCap,
    tone: "gold",
  },
  {
    title: "Visa",
    subtitle: "Support",
    icon: ShieldCheck,
    tone: "blue",
  },
  {
    title: "Pre-Departure",
    subtitle: "Support",
    icon: Plane,
    tone: "gold",
  },
  {
    title: "Expert",
    subtitle: "Mentors",
    icon: UsersRound,
    tone: "blue",
  },
];

export function FeaturesBar() {
  return (
    <motion.div
      className="home-hero__features"
      aria-label="Study abroad support features"
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.28, ease: "easeOut" }}
    >
      {features.map((feature) => {
        const Icon = feature.icon;
        return (
          <motion.article key={`${feature.title}-${feature.subtitle}`} className="home-hero__feature" whileHover={{ y: -4 }}>
            <div className={`home-hero__feature-icon home-hero__feature-icon--${feature.tone}`}>
              <Icon className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <h2>{feature.title}</h2>
              <p>{feature.subtitle}</p>
            </div>
          </motion.article>
        );
      })}
    </motion.div>
  );
}
