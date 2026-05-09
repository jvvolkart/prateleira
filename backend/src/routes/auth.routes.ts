import { Router } from "express";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { Company, User } from "../models";
import { signToken } from "../auth/jwt";
import { requireTenant } from "../middleware/tenant.middleware";

const router = Router();

router.post("/register", async (req, res) => {
  let createdCompanyId: mongoose.Types.ObjectId | null = null;
  try {
    const { email, password, company_name } = req.body as {
      email?: string;
      password?: string;
      company_name?: string;
    };
    if (!email || !password || !company_name) {
      res
        .status(400)
        .json({ error: "email, password, and company_name are required" });
      return;
    }
    const name = String(company_name).trim();
    if (name.length < 2 || name.length > 120) {
      res.status(400).json({
        error: "company_name must be between 2 and 120 characters",
      });
      return;
    }
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail) {
      res.status(400).json({ error: "invalid email" });
      return;
    }

    const company = await Company.create({ name });
    createdCompanyId = company._id as mongoose.Types.ObjectId;

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      company_id: company._id,
      email: normalizedEmail,
      passwordHash,
      role: "admin",
    });
    const token = signToken(user);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
      },
    });
  } catch (e: unknown) {
    if (createdCompanyId) {
      await Company.deleteOne({ _id: createdCompanyId }).catch(() => {});
    }
    if (
      e &&
      typeof e === "object" &&
      "code" in e &&
      Number((e as { code: unknown }).code) === 11000
    ) {
      res.status(409).json({ error: "email already registered" });
      return;
    }
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(401).json({ error: "invalid credentials" });
      return;
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ error: "invalid credentials" });
      return;
    }

    const token = signToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
});

router.get("/me", ...requireTenant, (req, res) => {
  const u = req.user;
  const tenant = req.company_id;
  if (!u || !tenant) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  res.json({
    user: {
      id: u.userId,
      email: u.email,
      role: u.role,
      company_id: tenant,
    },
  });
});

export const authRouter = router;
