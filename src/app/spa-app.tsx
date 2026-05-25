"use client";

import App from "../App";
import { apiBaseUrl } from "../lib/runtime";
import { setBaseUrl } from "@workspace/api-client-react";

setBaseUrl(apiBaseUrl || null);

export default function SpaApp() {
  return <App />;
}
