let getCookieImpl: (() => Promise<string>) | null = null;

export function setAuthClient(client: { getCookie?: () => Promise<string> }) {
  if (typeof client.getCookie === "function") {
    getCookieImpl = client.getCookie.bind(client);
  }
}

export async function getCookie(): Promise<string> {
  if (!getCookieImpl) {
    return "";
  }

  const value = await getCookieImpl();
  return typeof value === "string" ? value : "";
}
