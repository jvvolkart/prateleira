import "express-async-errors";
import cors from "cors";
import express, { type Express } from "express";
import { UPLOAD_DIR } from "./lib/upload";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { authRouter } from "./routes/auth.routes";
import { chatRouter } from "./routes/chat.routes";
import { productsRouter } from "./routes/products.routes";

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use("/uploads", express.static(UPLOAD_DIR));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/auth", authRouter);
  app.use("/products", productsRouter);
  app.use("/chat", chatRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
