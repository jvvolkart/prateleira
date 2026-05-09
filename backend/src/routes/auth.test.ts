import bcrypt from "bcrypt";
import request from "supertest";
import { createApp } from "../app";
import { Company, User } from "../models";

const app = createApp();

describe("auth", () => {
  it("logs in with valid credentials", async () => {
    const company = await Company.create({ name: "Acme" });
    const hash = await bcrypt.hash("secret12", 10);
    await User.create({
      company_id: company._id,
      email: "alice@test.com",
      passwordHash: hash,
      role: "user",
    });

    const res = await request(app).post("/auth/login").send({
      email: "alice@test.com",
      password: "secret12",
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe("alice@test.com");
  });

  it("registers and creates a new company", async () => {
    const res = await request(app).post("/auth/register").send({
      email: "newbie@test.com",
      password: "password123",
      company_name: "Globex",
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe("admin");
    const companies = await Company.find({ name: "Globex" });
    expect(companies).toHaveLength(1);
    expect(String(res.body.user.company_id)).toBe(String(companies[0]!._id));
  });

  it("rejects registering same email under another company", async () => {
    await request(app).post("/auth/register").send({
      email: "once@test.com",
      password: "password123",
      company_name: "Company A",
    });

    const res = await request(app).post("/auth/register").send({
      email: "once@test.com",
      password: "otherpass456",
      company_name: "Company B",
    });

    expect(res.status).toBe(409);
  });
});
