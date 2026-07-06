/**
 * Catalog assembly (pure). Merges a normalized component.def (types) with a
 * validated metadata object (prose + categorization) into one catalog entry,
 * and derives the facets the preview nav/search need.
 */

/** Machine name → human-readable title fallback ("navbar-mega" → "Navbar Mega"). */
function titleCaseName(machineName) {
  return String(machineName)
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** usage_type → the category a component is also cross-listed under. Extend to add collections. */
export const USAGE_COLLECTIONS = { card: "Cards", nav: "Navigation", overlay: "Overlays", form: "Forms" };

/**
 * Derive the extra categories a component appears under, from its usage_type tags.
 * Skips the component's own primary category and dedups.
 * @param {any} categorization
 * @returns {string[]}
 */
export function deriveSecondaryCategories(categorization) {
  const primary = categorization && categorization.category;
  const usage = (categorization && categorization.usage_type) || [];
  const out = [];
  for (const u of usage) {
    const target = USAGE_COLLECTIONS[u];
    if (target && target !== primary && !out.includes(target)) out.push(target);
  }
  return out;
}

/**
 * @param {{ id: string, path: string, def: any, metadata: any }} input
 */
export function buildEntry({ id, path, def, metadata }) {
  const propUsage = metadata.props || {};
  const slotUsage = metadata.slots || {};
  return {
    id,
    path,
    name: def.name,
    display_name: metadata.name || titleCaseName(def.name),
    props: def.props.map((p) => ({ ...p, usage: propUsage[p.name] || "" })),
    slots: def.slots.map((s) => ({ ...s, usage: slotUsage[s.name] || "" })),
    short_description: metadata.short_description,
    long_visual_description: metadata.long_visual_description || "",
    use_cases: metadata.use_cases || [],
    recommended_for: metadata.recommended_for || [],
    avoid_for: metadata.avoid_for || [],
    markets: metadata.markets || [],
    example_usage: metadata.example_usage || "",
    example_prompts: metadata.example_prompts || [],
    lifecycle: metadata.lifecycle,
    content_model: metadata.content_model || "",
    theming: metadata.theming || { tokens_used: [] },
    editorial_guidance: metadata.editorial_guidance || "",
    categorization: metadata.categorization,
    secondary_categories: deriveSecondaryCategories(metadata.categorization),
    screenshots: metadata.screenshots || {},
    relationships: {
      parents: (metadata.relationships && metadata.relationships.parents) || [],
      children: (metadata.relationships && metadata.relationships.children) || [],
      related: (metadata.relationships && metadata.relationships.related) || [],
    },
  };
}

/**
 * Resolve relationship references (id or name → canonical id) and derive reverse
 * links so authors only declare a relationship once (parent↔child, related↔related).
 * @param {any[]} entries
 */
export function linkRelationships(entries) {
  const idSet = new Set(entries.map((e) => e.id));
  const nameToId = new Map(entries.map((e) => [e.name, e.id]));
  const byId = new Map(entries.map((e) => [e.id, e]));
  const resolve = (v) => (idSet.has(v) ? v : nameToId.get(v) || v);
  const add = (arr, v) => { if (v && !arr.includes(v)) arr.push(v); };

  for (const e of entries) {
    e.relationships.parents = e.relationships.parents.map(resolve);
    e.relationships.children = e.relationships.children.map(resolve);
    e.relationships.related = e.relationships.related.map(resolve);
  }
  for (const e of entries) {
    for (const c of e.relationships.children) { const t = byId.get(c); if (t) add(t.relationships.parents, e.id); }
    for (const p of e.relationships.parents) { const t = byId.get(p); if (t) add(t.relationships.children, e.id); }
    for (const r of e.relationships.related) { const t = byId.get(r); if (t) add(t.relationships.related, e.id); }
  }
  return entries;
}

/**
 * Group entries into the navigation facets the preview needs.
 * @param {any[]} entries
 */
export function deriveFacets(entries) {
  /** @type {Record<string, Set<string>>} */
  const categories = {};
  const atomicTypes = new Set();
  const usageTypes = new Set();
  for (const e of entries) {
    const c = e.categorization || {};
    if (c.category) {
      categories[c.category] ||= new Set();
      if (c.subcategory) categories[c.category].add(c.subcategory);
    }
    for (const s of e.secondary_categories || []) categories[s] ||= new Set();
    if (c.atomic_type) atomicTypes.add(c.atomic_type);
    for (const u of c.usage_type || []) usageTypes.add(u);
  }
  return {
    categories: Object.fromEntries(
      Object.entries(categories).map(([k, v]) => [k, [...v].sort()]),
    ),
    atomic_types: [...atomicTypes].sort(),
    usage_types: [...usageTypes].sort(),
  };
}

/**
 * @param {any[]} entries
 * @param {{ generatedAt?: string|null }} [meta]
 */
export function assembleCatalog(entries, meta = {}) {
  const sorted = [...entries].sort((a, b) => a.id.localeCompare(b.id));
  linkRelationships(sorted);
  return {
    generatedAt: meta.generatedAt ?? null,
    count: sorted.length,
    facets: deriveFacets(sorted),
    components: sorted,
  };
}
