export interface BundleFileEntry {
  path: string;
  text: string;
}

const BINARY_RE = /\.(png|jpe?g|gif|webp|ico|woff2?|pdf|gz|zip)$/i;

/**
 * Normaliza rutas de la File API.
 * Un selector de carpeta antepone el nombre del directorio; se quita si es común.
 */
export function bundleMapFromRelativePaths(entries: readonly BundleFileEntry[]): Map<string, string> {
  const normalized = entries.map((entry) => ({
    path: entry.path.replace(/\\/g, "/").replace(/^\/+/, ""),
    text: entry.text,
  }));
  const paths = normalized.map((entry) => entry.path).filter((path) => path.length > 0);
  const nested = paths.length > 0 && paths.every((path) => path.includes("/"));
  const roots = new Set(paths.map((path) => path.split("/")[0]));
  const strip = nested && roots.size === 1 && !paths.includes("manifest.yaml");
  const map = new Map<string, string>();
  for (const entry of normalized) {
    if (!entry.path) continue;
    const key = strip ? entry.path.split("/").slice(1).join("/") : entry.path;
    if (!key || BINARY_RE.test(key)) continue;
    map.set(key, entry.text);
  }
  return map;
}
