const scopes = globalThis as { browser?: typeof chrome; chrome?: typeof chrome };

export const api: typeof chrome = scopes.browser ?? scopes.chrome ?? ({} as typeof chrome);
