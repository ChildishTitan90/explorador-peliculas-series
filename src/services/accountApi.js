export async function accountRequest(action, body) {
  const response = await fetch("/api/account/" + action, {
    credentials: "same-origin",
    cache: "no-store",
    ...(body === undefined ? {} : {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || "No pudimos guardar tus datos.");
    error.status = response.status;
    throw error;
  }
  return data;
}

export const titleIdentity = (item) => ({
  kind: item.media_type, id: item.id,
  seriesId: item.seriesId, season: item.season, episode: item.episode,
});
