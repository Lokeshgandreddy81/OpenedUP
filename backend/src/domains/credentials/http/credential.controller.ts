import type { Request, Response } from "express";
import type {
  ProviderCredentialRequest,
  ProviderEndpointRequest,
} from "@charan-interiors/contracts";
import {
  deleteProviderCredential,
  listProviderCredentials,
  saveProviderCredential,
  getProviderCredential,
} from "../application/credentialVault.js";

export function listCredentials(req: Request, res: Response): void {
  res.json({ providers: listProviderCredentials(req.principal!.uid) });
}
export function putCredential(req: Request, res: Response): void {
  const body = req.body as ProviderCredentialRequest;
  saveProviderCredential(req.principal!.uid, body.provider, {
    apiKey: body.apiKey,
    ...(body.baseUrl ? { baseUrl: body.baseUrl } : {}),
  });
  res.status(204).end();
}
export function updateCredentialEndpoint(req: Request, res: Response): void {
  const body = req.body as ProviderEndpointRequest;
  const credential = getProviderCredential(req.principal!.uid, body.provider);
  if (!credential) {
    res.status(404).json({ error: "No saved provider credential exists." });
    return;
  }
  saveProviderCredential(req.principal!.uid, body.provider, {
    ...credential,
    baseUrl: body.baseUrl,
  });
  res.status(204).end();
}
export function removeCredential(req: Request, res: Response): void {
  deleteProviderCredential(
    req.principal!.uid,
    req.params["provider"] as ProviderCredentialRequest["provider"]
  );
  res.status(204).end();
}
