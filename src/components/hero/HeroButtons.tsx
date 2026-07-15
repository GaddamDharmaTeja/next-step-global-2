"use client";

import { motion } from "framer-motion";
import { CalendarDays, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

type HeroButtonsProps = {
  primaryText?: string | null;
  secondaryText?: string | null;
};

export function HeroButtons({ primaryText, secondaryText }: HeroButtonsProps) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.div
      className="home-hero__actions"
      aria-label="Hero actions"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay: 0.18, ease: "easeOut" }}
    >
      <Button className="home-hero__button home-hero__button--primary" onClick={() => scrollTo("contact")}>
        <CalendarDays className="home-hero__button-icon" aria-hidden="true" />
        {primaryText || "Get Free Assessment"}
      </Button>
      <Button className="home-hero__button home-hero__button--secondary" variant="outline" onClick={() => scrollTo("services")}>
        <GraduationCap className="home-hero__button-icon" aria-hidden="true" />
        {secondaryText || "Explore Services"}
      </Button>
    </motion.div>
  );
}
