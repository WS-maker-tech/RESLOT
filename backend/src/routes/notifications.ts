import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { sendPushToUser, sendPushToUsers } from "../push";

const notificationsRouter = new Hono<{ Variables: { userPhone: string } }>();

// POST /api/notifications/send - Send push notification to user(s)
notificationsRouter.post(
  "/send",
  zValidator(
    "json",
    z.object({
      userPhone: z.string().optional(),
      userPhones: z.array(z.string()).optional(),
      title: z.string().min(1),
      body: z.string().min(1),
      data: z.record(z.string(), z.unknown()).optional(),
    })
  ),
  async (c) => {
    const { userPhone, userPhones, title, body, data } = c.req.valid("json");

    if (!userPhone && (!userPhones || userPhones.length === 0)) {
      return c.json(
        { error: { message: "userPhone or userPhones required", code: "BAD_REQUEST" } },
        400
      );
    }

    if (userPhones && userPhones.length > 0) {
      await sendPushToUsers(userPhones, title, body, data);
      return c.json({ data: { success: true, sent: userPhones.length } });
    }

    if (userPhone) {
      const sent = await sendPushToUser(userPhone, title, body, data);
      return c.json({ data: { success: sent, sent: sent ? 1 : 0 } });
    }

    return c.json({ data: { success: false, sent: 0 } });
  }
);

export { notificationsRouter };
