import type { Request, Response } from "express";
import {
  PROVIDER_IDS,
  type ProviderCredentialRequest,
  type ProviderEndpointRequest,
  type ProviderId,
} from "@charan-interiors/contracts";
import {
  deleteProviderCredential,
  listProviderCredentials,
  saveProviderCredential,
  getProviderCredential,
  updateProviderEndpoint,
  CredentialDecryptionError,
} from "../application/credentialVault.js";

function getAuthenticatedUid(req: Request, res: Response): string | null {
  const uid = req.principal?.uid;
  if (!uid) {
    res.status(401).json({ error: "Unauthorized: Missing user authentication.", requestId: req.id });
    return null;
  }
  return uid;
}

export function listCredentials(req: Request, res: Response): void {
  const uid = getAuthenticatedUid(req, res);
  if (!uid) return;
  res.json({ providers: listProviderCredentials(uid) });
}

export function putCredential(req: Request, res: Response): void {
  const uid = getAuthenticatedUid(req, res);
  if (!uid) return;
  const body = req.body as ProviderCredentialRequest;
  saveProviderCredential(uid, body.provider, {
    apiKey: body.apiKey,
    ...(body.baseUrl ? { baseUrl: body.baseUrl } : {}),
  });
  res.status(204).end();
}

export function updateCredentialEndpoint(req: Request, res: Response): void {
  const uid = getAuthenticatedUid(req, res);
  if (!uid) return;
  const body = req.body as ProviderEndpointRequest;
  try {
    const updated = updateProviderEndpoint(uid, body.provider, body.baseUrl);
    if (!updated) {
      res.status(404).json({ error: "No saved provider credential exists." });
      return;
    }
    res.status(204).end();
  } catch (err) {
    if (err instanceof CredentialDecryptionError) {
      res.status(422).json({
        error: "Existing credential cannot be decrypted (key mismatch or corrupted data). Please re-enter the API key.",
      });
      return;
    }
    throw err;
  }
}

export function removeCredential(req: Request, res: Response): void {
  const uid = getAuthenticatedUid(req, res);
  if (!uid) return;
  const provider = req.params["provider"] as ProviderId;
  if (!PROVIDER_IDS.includes(provider)) {
    res.status(400).json({ error: "Invalid provider specified.", requestId: req.id });
    return;
  }
  deleteProviderCredential(uid, provider);
  res.status(204).end();
}

export { getProviderCredential };

