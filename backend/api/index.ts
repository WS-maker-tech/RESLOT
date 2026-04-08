import { app } from "../src/index";
import { handle } from "@hono/node-server/vercel";

export const config = { api: { bodyParser: false } };

export default handle(app);
