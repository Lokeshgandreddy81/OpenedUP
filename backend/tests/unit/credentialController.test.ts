import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

const vault = vi.hoisted(() => ({
  getProviderCredential: vi.fn(),
  saveProviderCredential: vi.fn(),
  deleteProviderCredential: vi.fn(),
  listProviderCredentials: vi.fn(),
}));

vi.mock("../../src/domains/credentials/application/credentialVault.js", () => vault);

import { updateCredentialEndpoint } from "../../src/domains/credentials/http/credential.controller.js";

function responseStub() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
    end: vi.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
}

describe("update a saved provider endpoint", () => {
  beforeEach(() => vi.clearAllMocks());

  it("changes the endpoint while preserving the encrypted account key", () => {
    vault.getProviderCredential.mockReturnValue({
      apiKey: "account-secret",
      baseUrl: "https://api.openai.com/v1",
    });
    const req = {
      principal: { uid: "user-1" },
      body: { provider: "openai", baseUrl: "https://proxy.example/v1" },
    } as unknown as Request;
    const res = responseStub() as unknown as Response;

    updateCredentialEndpoint(req, res);

    expect(vault.getProviderCredential).toHaveBeenCalledWith("user-1", "openai");
    expect(vault.saveProviderCredential).toHaveBeenCalledWith("user-1", "openai", {
      apiKey: "account-secret",
      baseUrl: "https://proxy.example/v1",
    });
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it("does not create an endpoint without an existing account credential", () => {
    vault.getProviderCredential.mockReturnValue(null);
    const req = {
      principal: { uid: "user-1" },
      body: { provider: "openai", baseUrl: "https://proxy.example/v1" },
    } as unknown as Request;
    const res = responseStub() as unknown as Response;

    updateCredentialEndpoint(req, res);

    expect(vault.saveProviderCredential).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
