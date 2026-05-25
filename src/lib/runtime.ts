export const appBasePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
export const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");

export function withBasePath(path: string) {
  if (!path.startsWith("/")) {
    return path;
  }

  return `${appBasePath}${path}`;
}
