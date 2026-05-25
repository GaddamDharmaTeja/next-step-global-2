"use client";

import dynamic from "next/dynamic";

const SpaApp = dynamic(() => import("./spa-app"), {
  ssr: false,
});

export default function SpaAppClient() {
  return <SpaApp />;
}
