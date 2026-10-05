import machinesData from '../data/machines.json';
import { brands } from '../data/brands';

// Canonical casing for every image that ships in /public. The API returns the
// paths stored in the database, and the host is case-sensitive: a stored
// "/images/machines/aries3.png" would 404 even though ARIES3.png is deployed.
const bundled = new Map<string, string>();
for (const m of machinesData as { image?: string }[]) {
  if (m.image) bundled.set(m.image.toLowerCase(), m.image);
}
for (const b of brands) bundled.set(b.image.toLowerCase(), b.image);

/** Normalizes an image path from the API or static data to the file that is actually deployed. */
export const resolveImage = (src: string | null | undefined): string | undefined => {
  if (!src) return undefined;
  if (/^(https?:)?\/\//i.test(src) || src.startsWith('data:')) return src;
  const path = src.startsWith('/') ? src : `/${src}`;
  return bundled.get(path.toLowerCase()) ?? path;
};
