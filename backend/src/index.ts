import "dotenv/config";
import { createApp } from "./app";
import { connectDb } from "./db";
import "./models";

async function main(): Promise<void> {
  await connectDb();
  const port = Number(process.env.PORT) || 4000;
  const app = createApp();
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
