type EventPayload = Record<string, string | number | boolean | null | undefined>;

const eventBuffer: Array<{name: string; payload: EventPayload; at: string}> = [];

export const trackEvent = (name: string, payload: EventPayload = {}): void => {
  eventBuffer.push({name, payload, at: new Date().toISOString()});
  if (__DEV__) {
    // Keep lightweight local instrumentation for now.
    // eslint-disable-next-line no-console
    console.log('[analytics]', name, payload);
  }
};

export const getTrackedEvents = (): Array<{name: string; payload: EventPayload; at: string}> => {
  return eventBuffer;
};
