import type { Principal } from "../../auth/supabaseAuth.js";

declare global {
  namespace Express {
    interface Request {
      principal?: Principal;
    }
  }
}

export {};
