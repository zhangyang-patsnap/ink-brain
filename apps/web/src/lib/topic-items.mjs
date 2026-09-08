export const topicKinds = ["articles", "projects", "tools"];

export function topicItems(data) {
  if (Array.isArray(data?.items)) return data.items;
  return topicKinds.flatMap((kind) =>
    (data?.references?.[kind] ?? []).map((id) => ({ kind, id })),
  );
}
