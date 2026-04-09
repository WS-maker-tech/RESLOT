import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "./auth-store";
import type { Reservation } from "./api/types";

export function usePendingFeedback() {
  const router = useRouter();
  const token = useAuthStore((s) => s.supabaseAccessToken);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL!;
  const hasPrompted = useRef(false);

  const { data: reservations } = useQuery({
    queryKey: ["my-reservations-feedback-check"],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/api/reservations/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      const json = await res.json();
      return (json.data ?? []) as Reservation[];
    },
    enabled: !!token && isLoggedIn,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!reservations?.length || hasPrompted.current) return;

    const now = new Date();
    const needsFeedback = reservations.find((r) => {
      if (r.status !== "completed") return false;
      if (r.feedback) return false;
      if (!r.claimerPhone) return false;
      const dateStr = new Date(r.reservationDate).toISOString().slice(0, 10);
      const reservationDateTime = new Date(`${dateStr}T${r.reservationTime}:00`);
      return reservationDateTime < now;
    });

    if (needsFeedback) {
      hasPrompted.current = true;
      router.push({
        pathname: "/feedback",
        params: {
          reservationId: needsFeedback.id,
          restaurantName: needsFeedback.restaurant?.name ?? "Restaurangen",
        },
      });
    }
  }, [reservations]);
}
