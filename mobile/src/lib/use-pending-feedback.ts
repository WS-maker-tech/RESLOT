import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "./api/api";
import type { Reservation } from "./api/types";

export function usePendingFeedback() {
  const router = useRouter();
  const hasPrompted = useRef(false);

  const { data: reservations } = useQuery({
    queryKey: ["my-reservations-feedback-check"],
    queryFn: async () => {
      try {
        return await api.reservations.getMine();
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!reservations?.length || hasPrompted.current) return;

    const now = new Date();
    const needsFeedback = reservations.find((r) => {
      if (r.status !== "completed") return false;
      if (r.feedback) return false;
      if (!r.claimer_id) return false;
      const dateStr = new Date(r.date).toISOString().slice(0, 10);
      const reservationDateTime = new Date(`${dateStr}T${r.time}:00`);
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
