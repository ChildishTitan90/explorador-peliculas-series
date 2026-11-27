export async function authRequest(action, body) {
  const response = await fetch("/api/auth/" + action, {
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
    const error = new Error(data.error || "No pudimos completar la solicitud.");
    error.status = response.status;
    throw error;
  }
  return data;
}
