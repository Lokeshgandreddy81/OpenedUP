import { Router } from "express";
import { z } from "zod";
import { requireSupabaseUser } from "../auth/supabaseAuth.js";
import { validateBody } from "../http/middleware/validate.js";
import { createSignedUpload } from "./supabaseStorage.js";

const SignedUploadRequestSchema = z.object({
  purpose: z.enum(["pdf", "image", "skill-package"]),
  fileName: z.string().trim().min(1).max(300),
  contentType: z.string().trim().toLowerCase().min(1).max(100),
  sizeBytes: z.number().int().positive(),
});

export const uploadRouter = Router();

uploadRouter.post(
  "/uploads/signed",
  requireSupabaseUser,
  validateBody(SignedUploadRequestSchema),
  async (req, res) => {
    try {
      const result = await createSignedUpload({
        ...req.body,
        userId: req.principal!.uid,
      });
      res.status(201).json(result);
    } catch (error: unknown) {
      const statusCode =
        error && typeof error === "object" && "statusCode" in error
          ? Number((error as { statusCode: unknown }).statusCode)
          : 503;
      res.status(Number.isInteger(statusCode) && statusCode >= 400 && statusCode < 600 ? statusCode : 503).json({
        error: error instanceof Error ? error.message : "Could not prepare this upload.",
        requestId: req.id,
      });
    }
  }
);
