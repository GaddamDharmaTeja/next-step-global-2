"use client";

import { motion } from "framer-motion";
import { assetUrl } from "@/lib/runtime";

type HeroIllustrationProps = {
  imageUrl?: string;
};

export function HeroIllustration({ imageUrl = "/right-side-hero-illustration.png" }: HeroIllustrationProps) {
  return (
    <div className="home-hero__media" aria-label="Global study abroad illustration">
      <div className="home-hero__map" aria-hidden="true" />
      <div className="home-hero__ring" aria-hidden="true" />
      <motion.div
        className="home-hero__plane-dot"
        aria-hidden="true"
        animate={{ y: [0, -10, 0], x: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.img
        src={assetUrl(imageUrl)}
        alt="Student with graduation cap facing global landmarks"
        className="home-hero__image"
        initial={{ opacity: 0, y: 34 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
      />
    </div>
  );
}
