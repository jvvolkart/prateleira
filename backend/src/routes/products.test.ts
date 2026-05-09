import bcrypt from "bcrypt";
import request from "supertest";
import { signToken } from "../auth/jwt";
import { createApp } from "../app";
import { Company, Product, User } from "../models";

const app = createApp();

describe("products", () => {
  it("lists only products for the tenant", async () => {
    const c1 = await Company.create({ name: "T1" });
    const c2 = await Company.create({ name: "T2" });
    await Product.create({
      company_id: c1._id,
      name: "Alpha",
      description: "",
      price: 10,
      imageUrl: "",
    });
    await Product.create({
      company_id: c2._id,
      name: "Beta",
      description: "",
      price: 20,
      imageUrl: "",
    });

    const user = await User.create({
      company_id: c1._id,
      email: "u@t1.com",
      passwordHash: await bcrypt.hash("x", 10),
      role: "user",
    });
    const token = signToken(user);

    const res = await request(app)
      .get("/products")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].name).toBe("Alpha");
  });

  it("blocks product create for non-admin", async () => {
    const company = await Company.create({ name: "Co" });
    const user = await User.create({
      company_id: company._id,
      email: "plain@co.com",
      passwordHash: await bcrypt.hash("x", 10),
      role: "user",
    });
    const token = signToken(user);

    const res = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "application/json")
      .send({ name: "Thing", price: 9.99 });

    expect(res.status).toBe(403);
  });
});
