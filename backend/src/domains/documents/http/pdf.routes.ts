import { Router } from "express";
import { ParsePdfChaptersRequestSchema } from "@charan-interiors/contracts";
import { handleParsePdfChapters } from "./pdf.controller.js";
import { validateBody } from "../../../platform/http/middleware/validate.js";
import { asyncHandler } from "../../../platform/http/middleware/asyncHandler.js";

export const pdfRouter = Router();

pdfRouter.post(
  "/parse-pdf-chapters",
  validateBody(ParsePdfChaptersRequestSchema),
  asyncHandler(handleParsePdfChapters)
);
