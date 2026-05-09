import { Router } from "express";
import mongoose from "mongoose";
import { Product } from "../models";
import { requireTenant } from "../middleware/tenant.middleware";
import { requireAdmin } from "../middleware/admin.middleware";
import { productImageUpload } from "../lib/upload";

const router = Router();

function parsePrice(raw: unknown): number | null {
  const n =
    typeof raw === "string" ? Number(raw) : typeof raw === "number" ? raw : NaN;
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

router.get("/", ...requireTenant, async (req, res) => {
  const company_id = req.company_id;
  if (!company_id) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const products = await Product.find({ company_id }).sort({ createdAt: -1 }).lean();
  res.json({ products });
});

router.get("/:id", ...requireTenant, async (req, res) => {
  const company_id = req.company_id;
  if (!company_id) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ error: "invalid id" });
    return;
  }
  const product = await Product.findOne({ _id: id, company_id }).lean();
  if (!product) {
    res.status(404).json({ error: "not found" });
    return;
  }
  res.json({ product });
});

router.post(
  "/",
  ...requireTenant,
  requireAdmin,
  productImageUpload.single("image"),
  async (req, res) => {
    const company_id = req.company_id;
    if (!company_id) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const category =
      typeof req.body.category === "string" ? req.body.category.trim() : "";
    const description =
      typeof req.body.description === "string" ? req.body.description : "";
    const price = parsePrice(req.body.price);
    if (!name || price === null) {
      res.status(400).json({ error: "name and valid price are required" });
      return;
    }
    let imageUrl = typeof req.body.imageUrl === "string" ? req.body.imageUrl : "";
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }
    const product = await Product.create({
      company_id,
      name,
      category,
      description,
      price,
      imageUrl,
    });
    res.status(201).json({ product });
  }
);

router.patch(
  "/:id",
  ...requireTenant,
  requireAdmin,
  productImageUpload.single("image"),
  async (req, res) => {
    const company_id = req.company_id;
    if (!company_id) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ error: "invalid id" });
      return;
    }
    const existing = await Product.findOne({ _id: id, company_id });
    if (!existing) {
      res.status(404).json({ error: "not found" });
      return;
    }
    if (typeof req.body.name === "string" && req.body.name.trim()) {
      existing.name = req.body.name.trim();
    }
    if (typeof req.body.description === "string") {
      existing.description = req.body.description;
    }
    if (typeof req.body.category === "string") {
      existing.category = req.body.category.trim();
    }
    if (req.body.price !== undefined) {
      const p = parsePrice(req.body.price);
      if (p === null) {
        res.status(400).json({ error: "invalid price" });
        return;
      }
      existing.price = p;
    }
    if (typeof req.body.imageUrl === "string") {
      existing.imageUrl = req.body.imageUrl;
    }
    if (req.file) {
      existing.imageUrl = `/uploads/${req.file.filename}`;
    }
    await existing.save();
    res.json({ product: existing.toObject() });
  }
);

router.delete("/:id", ...requireTenant, requireAdmin, async (req, res) => {
  const company_id = req.company_id;
  if (!company_id) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ error: "invalid id" });
    return;
  }
  const result = await Product.deleteOne({ _id: id, company_id });
  if (result.deletedCount === 0) {
    res.status(404).json({ error: "not found" });
    return;
  }
  res.status(204).send();
});

export const productsRouter = router;
