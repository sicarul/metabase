export type TagType = (typeof TAG_TYPES)[number];

export const TAG_TYPES = [
  "action",
  "alert",
  "api-key",
  "bookmark",
  "card",
  "cloud-migration",
  "collection",
  "dashboard",
  "database",
  "field",
  "field-values",
  "indexed-entity",
  "metric",
  "permissions-group",
  "persisted-info",
  "persisted-model",
  "revision",
  "schema",
  "segment",
  "snippet",
  "subscription",
  "table",
  "task",
  "timeline",
  "timeline-event",
  "user",
] as const;

export const TAG_TYPE_MAPPING = {
  collection: "collection",
  card: "card",
  dashboard: "dashboard",
  database: "database",
  "indexed-entity": "indexed-entity",
  table: "table",
  dataset: "card",
  action: "action",
  segment: "segment",
  metric: "metric",
  snippet: "snippet",
  pulse: "subscription",
} as const;
