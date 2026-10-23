import { Router } from "express";
import { ParsePdfChaptersRequestSchema } from "@charan-interiors/contracts";
import { handleParsePdfChapters } from "./pdf.controller.js";
import { validateBody } from "../../../platform/http/middleware/validate.js";

export const pdfRouter = Router();

pdfRouter.post(
  "/parse-pdf-chapters",
  validateBody(ParsePdfChaptersRequestSchema),
  handleParsePdfChapters
);
