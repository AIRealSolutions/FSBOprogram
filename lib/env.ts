export function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} environment variable`);
  return value;
}

export function optionalEnv(name: string) {
  return process.env[name] ?? null;
}

