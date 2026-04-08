import app from "../src/app";
import { handle } from "@hono/node-server/vercel";

export const config = { api: { bodyParser: false } };

export default handle(app);
