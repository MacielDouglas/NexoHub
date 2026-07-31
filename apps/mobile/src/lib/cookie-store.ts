let _getCookie: () => Promise<string>;

export function getCookie(): Promise<string> {
  if (!_getCookie) throw new Error("auth client not initialized");
  return _getCookie();
}

export function setAuthClient(client: {
  getCookie: () => Promise<string>;
}) {
  _getCookie = client.getCookie.bind(client);
}