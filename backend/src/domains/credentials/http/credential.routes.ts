import { Router } from "express";
import {
  ProviderCredentialRequestSchema,
  ProviderEndpointRequestSchema,
} from "@charan-interiors/contracts";
import { validateBody } from "../../../platform/http/middleware/validate.js";
import { createRateLimiter } from "../../../platform/http/middleware/rateLimiter.js";
import {
  listCredentials,
  putCredential,
  removeCredential,
  updateCredentialEndpoint,
  getAttestation,
} from "./credential.controller.js";

export const credentialRouter = Router();

// Rate limiter for read requests (60 requests / minute)
const readRateLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 60,
  message: "Too many credential requests. Please wait and try again.",
});

// Stricter rate limiter for write/mutation operations (20 requests / minute)
const mutationRateLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 20,
  message: "Too many credential mutation attempts. Please wait and try again.",
});

credentialRouter.use(readRateLimiter);

credentialRouter.get("/", listCredentials);
credentialRouter.get("/attestation", getAttestation);
credentialRouter.put(
  "/",
  mutationRateLimiter,
  validateBody(ProviderCredentialRequestSchema),
  putCredential
);
credentialRouter.patch(
  "/",
  mutationRateLimiter,
  validateBody(ProviderEndpointRequestSchema),
  updateCredentialEndpoint
);
credentialRouter.delete("/:provider", mutationRateLimiter, removeCredential);
