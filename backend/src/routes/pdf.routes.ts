import { Router } from "express";
import { ParsePdfChaptersRequestSchema } from "@charan-interiors/shared";
import { handleParsePdfChapters } from "../controllers/pdf.controller.js";
import { validateBody } from "../middleware/validate.js";

export const pdfRouter = Router();

pdfRouter.post(
  "/parse-pdf-chapters",
  validateBody(ParsePdfChaptersRequestSchema),
  handleParsePdfChapters
);
