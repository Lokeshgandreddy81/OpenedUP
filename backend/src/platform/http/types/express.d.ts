import type { Principal } from "../../auth/firebaseAuth.js";

declare global {
  namespace Express {
    interface Request {
      principal?: Principal;
    }
  }
}

export {};
