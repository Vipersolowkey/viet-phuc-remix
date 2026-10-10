import { env } from "cloudflare:workers";
export function database() {
  if (!env.DB) throw new Error("Lookbook database unavailable");
  return env.DB;
}
