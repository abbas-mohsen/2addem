import crypto from 'node:crypto';

const COMBINING_MARKS = /[̀-ͯ]/g;

export function slugify(value) {
  return String(value)
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
}

/* Slugs must stay unique across a collection, so callers pass a probe that
   reports whether a candidate is taken; we suffix until one is free. */
export async function uniqueSlug(base, exists) {
  const root = slugify(base) || crypto.randomBytes(4).toString('hex');
  let candidate = root;

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    if (!(await exists(candidate))) return candidate;
    candidate = `${root}-${crypto.randomBytes(2).toString('hex')}`;
  }

  return `${root}-${Date.now().toString(36)}`;
}
