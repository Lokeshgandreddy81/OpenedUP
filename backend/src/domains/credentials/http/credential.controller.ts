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
  getVaultAttestationFingerprint,
  verifyVaultHealth,
} from "../application/credentialVault.js";
import { normalizeBaseUrl } from "../../chat/providers/llm.service.js";

function getAuthenticatedUid(req: Request, res: Response): string | null {
  const uid = req.principal?.uid;
  if (!uid) {
    res
      .status(401)
      .json({ error: "Unauthorized: Missing user authentication.", requestId: req.id });
    return null;
  }
  return uid;
}

export function getAttestation(req: Request, res: Response): void {
  const uid = getAuthenticatedUid(req, res);
  if (!uid) return;
  const attestation = getVaultAttestationFingerprint();
  const health = verifyVaultHealth();
  res.json({ attestation, health });
}

export async function listCredentials(req: Request, res: Response): Promise<void> {
  const uid = getAuthenticatedUid(req, res);
  if (!uid) return;
  res.json({ providers: await listProviderCredentials(uid) });
}

export async function putCredential(req: Request, res: Response): Promise<void> {
  const uid = getAuthenticatedUid(req, res);
  if (!uid) return;
  const body = req.body as ProviderCredentialRequest;
  let baseUrl: string | undefined;
  if (body.baseUrl !== undefined) {
    try {
      baseUrl = normalizeBaseUrl(body.baseUrl);
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : "Provider base URL is invalid.",
      });
      return;
    }
  }
  if (baseUrl === undefined) {
    try {
      baseUrl = (await getProviderCredential(uid, body.provider))?.baseUrl;
    } catch (err) {
      // Replacing a key is also the recovery path for an entry encrypted by a lost key.
      if (!(err instanceof CredentialDecryptionError)) throw err;
    }
  }
  await saveProviderCredential(uid, body.provider, {
    apiKey: body.apiKey,
    ...(baseUrl ? { baseUrl } : {}),
  });
  res.status(204).end();
}

export async function updateCredentialEndpoint(req: Request, res: Response): Promise<void> {
  const uid = getAuthenticatedUid(req, res);
  if (!uid) return;
  const body = req.body as ProviderEndpointRequest;
  let baseUrl: string;
  try {
    baseUrl = normalizeBaseUrl(body.baseUrl);
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Provider base URL is invalid.",
    });
    return;
  }
  try {
    const updated = await updateProviderEndpoint(uid, body.provider, baseUrl);
    if (!updated) {
      res.status(404).json({ error: "No saved provider credential exists." });
      return;
    }
    res.status(204).end();
  } catch (err) {
    if (err instanceof CredentialDecryptionError) {
      res.status(422).json({
        error:
          "Existing credential cannot be decrypted (key mismatch or corrupted data). Please re-enter the API key.",
      });
      return;
    }
    throw err;
  }
}

export async function removeCredential(req: Request, res: Response): Promise<void> {
  const uid = getAuthenticatedUid(req, res);
  if (!uid) return;
  const provider = req.params["provider"] as ProviderId;
  if (!PROVIDER_IDS.includes(provider)) {
    res.status(400).json({ error: "Invalid provider specified.", requestId: req.id });
    return;
  }
  await deleteProviderCredential(uid, provider);
  res.status(204).end();
}

export { getProviderCredential };
