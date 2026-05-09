jest.mock("../chat/run-chat", () => ({
  runChat: jest.fn().mockResolvedValue("mocked assistant reply"),
}));

import bcrypt from "bcrypt";
import request from "supertest";
import { runChat } from "../chat/run-chat";
import { signToken } from "../auth/jwt";
import { createApp } from "../app";
import { Company, User } from "../models";

const app = createApp();
const runChatMock = runChat as jest.MockedFunction<typeof runChat>;

describe("chat", () => {
  beforeEach(() => {
    runChatMock.mockResolvedValue("mocked assistant reply");
  });

  it("returns reply JSON when OpenAI is mocked", async () => {
    const company = await Company.create({ name: "ChatCo" });
    const user = await User.create({
      company_id: company._id,
      email: "chat@co.com",
      passwordHash: await bcrypt.hash("x", 10),
      role: "user",
    });
    const token = signToken(user);

    const res = await request(app)
      .post("/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({ message: "hello" });

    expect(res.status).toBe(200);
    expect(res.body.reply).toBe("mocked assistant reply");
    expect(runChatMock).toHaveBeenCalled();
    const args = runChatMock.mock.calls[0];
    expect(args[1]).toBe(String(company._id));
  });

  it("requires auth", async () => {
    const res = await request(app).post("/chat").send({ message: "x" });
    expect(res.status).toBe(401);
  });
});
