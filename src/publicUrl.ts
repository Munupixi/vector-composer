/** Keep public files under the configured Vite base, including project GitHub Pages. */
export function publicUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}
