declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    GEMINI_API_KEY?: string;
    GEMINI_MODEL?: string;
    AI_PROVIDER?: string;
    OLLAMA_API_KEY?: string;
    OLLAMA_MODEL?: string;
    TRYON_API_URL?: string;
    TRYON_API_KEY?: string;
  }
}
