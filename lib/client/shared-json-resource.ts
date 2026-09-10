export type SharedJsonResource<T> = {
  load: () => Promise<T | null>;
  reset: () => void;
};

export function createSharedJsonResource<T>(options: {
  url: string;
  ttlMs: number;
  parse: (res: Response) => Promise<T | null>;
  fetchImpl?: typeof fetch;
}): SharedJsonResource<T> {
  const fetchFn = options.fetchImpl ?? fetch;
  let inflight: Promise<T | null> | null = null;
  let cached: { at: number; value: T | null } | null = null;

  return {
    load() {
      if (cached && Date.now() - cached.at < options.ttlMs) {
        return Promise.resolve(cached.value);
      }
      if (inflight) return inflight;
      inflight = fetchFn(options.url, { cache: "no-store" })
        .then((res) => options.parse(res))
        .catch(() => null)
        .then((value) => {
          if (value != null) cached = { at: Date.now(), value };
          return value;
        })
        .finally(() => {
          inflight = null;
        });
      return inflight;
    },
    reset() {
      inflight = null;
      cached = null;
    },
  };
}
