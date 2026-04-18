export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function makePropertySlug(parts: {
  addressLine1: string;
  city: string;
  state: string;
  postalCode?: string;
}) {
  // Example: "123-coastal-drive-southport-nc-28461"
  const base = slugify(`${parts.addressLine1} ${parts.city} ${parts.state}`);
  const zip = parts.postalCode ? slugify(parts.postalCode) : '';
  return zip ? `${base}-${zip}` : base;
}

