import { db } from "./db";

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;
}

interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: Record<string, unknown>;
}

/**
 * Send a push notification via Expo's Push API.
 * Returns true if the message was accepted by Expo.
 */
export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<boolean> {
  if (!pushToken || !pushToken.startsWith("ExponentPushToken[")) {
    console.log("[PUSH] Invalid token, skipping:", pushToken);
    return false;
  }

  const message: ExpoPushMessage = {
    to: pushToken,
    title,
    body,
    data,
    sound: "default",
    channelId: "default",
  };

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(message),
    });

    const result = await response.json() as { data: ExpoPushTicket };

    if (result.data.status === "ok") {
      console.log(`[PUSH] Sent to ${pushToken.slice(0, 30)}...: "${title}"`);
      return true;
    } else {
      console.error("[PUSH] Error:", result.data.message);
      // If token is invalid, clear it from the database
      if (result.data.details && (result.data.details as Record<string, string>).error === "DeviceNotRegistered") {
        await db.userProfile.updateMany({
          where: { pushToken },
          data: { pushToken: null },
        });
        console.log("[PUSH] Cleared invalid push token");
      }
      return false;
    }
  } catch (err) {
    console.error("[PUSH] Failed to send:", err);
    return false;
  }
}

/**
 * Send a push notification to a user by their phone number.
 * Looks up their push token from the database.
 */
export async function sendPushToUser(
  userPhone: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<boolean> {
  const profile = await db.userProfile.findUnique({
    where: { phone: userPhone },
    select: { pushToken: true },
  });

  if (!profile?.pushToken) {
    console.log(`[PUSH] No push token for ${userPhone}, skipping`);
    return false;
  }

  return sendPushNotification(profile.pushToken, title, body, data);
}

/**
 * Send push notifications to multiple users.
 */
export async function sendPushToUsers(
  userPhones: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  const profiles = await db.userProfile.findMany({
    where: { phone: { in: userPhones }, pushToken: { not: null } },
    select: { pushToken: true },
  });

  const tokens = profiles
    .map((p) => p.pushToken)
    .filter((t): t is string => !!t);

  if (tokens.length === 0) return;

  // Expo supports batch sending
  const messages: ExpoPushMessage[] = tokens.map((token) => ({
    to: token,
    title,
    body,
    data,
    sound: "default" as const,
    channelId: "default",
  }));

  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });
    console.log(`[PUSH] Batch sent ${messages.length} notifications: "${title}"`);
  } catch (err) {
    console.error("[PUSH] Batch send failed:", err);
  }
}
