import { Router } from "express";
import {
  ProviderCredentialRequestSchema,
  ProviderEndpointRequestSchema,
} from "@charan-interiors/contracts";
import { validateBody } from "../../../platform/http/middleware/validate.js";
import {
  listCredentials,
  putCredential,
  removeCredential,
  updateCredentialEndpoint,
} from "./credential.controller.js";

export const credentialRouter = Router();
credentialRouter.get("/", listCredentials);
credentialRouter.put("/", validateBody(ProviderCredentialRequestSchema), putCredential);
credentialRouter.patch("/", validateBody(ProviderEndpointRequestSchema), updateCredentialEndpoint);
credentialRouter.delete("/:provider", removeCredential);
