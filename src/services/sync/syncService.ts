export interface SyncSnapshot {
  createdAt: string;
  version: string;
  payload: string;
}

const xorTransform = (input: string, secret: string): string => {
  if (!secret) {
    return input;
  }

  let out = '';
  for (let i = 0; i < input.length; i += 1) {
    const keyCode = secret.charCodeAt(i % secret.length);
    out += String.fromCharCode(input.charCodeAt(i) ^ keyCode);
  }

  return out;
};

const toHex = (value: string): string =>
  Array.from(value)
    .map((char) => char.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');

const fromHex = (value: string): string => {
  let out = '';
  for (let i = 0; i < value.length; i += 2) {
    out += String.fromCharCode(parseInt(value.slice(i, i + 2), 16));
  }
  return out;
};

export const createSyncSnapshot = (data: unknown, secret: string): SyncSnapshot => {
  const json = JSON.stringify(data);
  const encoded = toHex(xorTransform(json, secret));

  return {
    createdAt: new Date().toISOString(),
    version: '1',
    payload: encoded,
  };
};

export const restoreSyncSnapshot = <T>(snapshot: SyncSnapshot, secret: string): T => {
  const decoded = xorTransform(fromHex(snapshot.payload), secret);
  return JSON.parse(decoded) as T;
};
