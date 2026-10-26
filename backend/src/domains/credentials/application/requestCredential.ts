import type { Request } from "express";
import { getModelMeta, type ChatRequest, type ProviderId } from "@charan-interiors/contracts";
import { sanitizeApiKey, sanitizeBaseUrl } from "../../../platform/config/index.js";
import { getProviderCredential } from "./credentialVault.js";

export type ProviderModelRequest = Pick<ChatRequest, "model" | "customModel" | "customProvider">;

export function providerForModelRequest(payload: ProviderModelRequest): ProviderId {
  return payload.model === "custom-model"
    ? payload.customProvider || "custom"
    : getModelMeta(payload.model).provider;
}

export function resolveRequestProviderCredential(
  req: Request,
  payload: ProviderModelRequest
): { apiKey: string | undefined; baseUrl: string | undefined } {
  const rawKey = Array.isArray(req.headers["x-provider-key"])
    ? req.headers["x-provider-key"][0]
    : req.headers["x-provider-key"];
  const rawBaseUrl = Array.isArray(req.headers["x-provider-base-url"])
    ? req.headers["x-provider-base-url"][0]
    : req.headers["x-provider-base-url"];
  const headerApiKey = sanitizeApiKey(rawKey);
  const headerBaseUrl = sanitizeBaseUrl(rawBaseUrl);
  const provider = providerForModelRequest(payload);

  let savedCredential = null;
  if (req.principal?.uid) {
    try {
      savedCredential = getProviderCredential(req.principal.uid, provider);
    } catch {
      // An unavailable vault entry cannot be used for this request.
    }
  }

  return {
    apiKey: headerApiKey?.trim() || savedCredential?.apiKey,
    baseUrl: headerBaseUrl?.trim() || savedCredential?.baseUrl,
  };
}
