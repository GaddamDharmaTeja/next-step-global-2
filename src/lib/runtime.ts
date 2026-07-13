import type { SyntheticEvent } from "react";

export const appBasePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
export const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
export const fallbackImageDataUrl =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='420' viewBox='0 0 640 420'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23ffffff'/%3E%3Cstop offset='1' stop-color='%23f6f8fb'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='640' height='420' rx='28' fill='url(%23a)'/%3E%3Crect x='46' y='46' width='548' height='328' rx='24' fill='none' stroke='%23e2e8f0' stroke-width='3' stroke-dasharray='12 12'/%3E%3Cpath d='M205 275l72-82 52 58 39-42 96 66H205z' fill='%23d8e0eb'/%3E%3Ccircle cx='420' cy='150' r='30' fill='%23edf2f7'/%3E%3Ctext x='320' y='338' text-anchor='middle' font-family='Arial, sans-serif' font-size='19' font-weight='700' fill='%238294a8'%3EImage unavailable%3C/text%3E%3C/svg%3E";

export function applyImageFallback(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = fallbackImageDataUrl;
}

export function withBasePath(path: string) {
  if (!path.startsWith("/")) {
    return path;
  }

  return `${appBasePath}${path}`;
}

export function assetUrl(url?: string | null) {
  if (!url) {
    return "";
  }

  if (/^(?:https?:)?\/\//.test(url) || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }

  if (apiBaseUrl && url.startsWith("/uploads/")) {
    return `${apiBaseUrl}${url}`;
  }

  return withBasePath(url);
}
