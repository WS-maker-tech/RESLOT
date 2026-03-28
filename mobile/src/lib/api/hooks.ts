import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type {
  Restaurant,
  Reservation,
  UserProfile,
  ActivityAlert,
  RestaurantAlertWithRestaurant,
} from "./types";

// ─── Restaurants ───────────────────────────────────────
export function useRestaurants(params?: {
  city?: string;
  neighborhood?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["restaurants", params?.city, params?.neighborhood, params?.search],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.city) queryParams.set("city", params.city);
      if (params?.neighborhood && params.neighborhood !== "Alla")
        queryParams.set("neighborhood", params.neighborhood);
      if (params?.search) queryParams.set("search", params.search);
      const qs = queryParams.toString();
      return api.get<Restaurant[]>(`/api/restaurants${qs ? `?${qs}` : ""}`);
    },
  });
}

export function useRestaurant(id: string) {
  return useQuery({
    queryKey: ["restaurant", id],
    queryFn: () =>
      api.get<Restaurant & { reservations: Reservation[] }>(
        `/api/restaurants/${id}`
      ),
    enabled: !!id,
  });
}

export function useReservation(id: string) {
  return useQuery({
    queryKey: ["reservation", id],
    queryFn: () => api.get<Reservation>(`/api/reservations/${id}`),
    enabled: !!id,
  });
}

// ─── Reservations (feed) ──────────────────────────────
export function useReservations(params?: {
  city?: string;
  neighborhood?: string;
  date?: string;
}) {
  return useQuery({
    queryKey: ["reservations", params?.city, params?.neighborhood, params?.date],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.city) queryParams.set("city", params.city);
      if (params?.neighborhood && params.neighborhood !== "Alla")
        queryParams.set("neighborhood", params.neighborhood);
      if (params?.date) queryParams.set("date", params.date);
      const qs = queryParams.toString();
      return api.get<Reservation[]>(`/api/reservations${qs ? `?${qs}` : ""}`);
    },
  });
}

// ─── My Reservations ──────────────────────────────────
export function useMyReservations(phone: string) {
  return useQuery({
    queryKey: ["myReservations", phone],
    queryFn: () =>
      api.get<Reservation[]>(`/api/reservations/mine?phone=${encodeURIComponent(phone)}`),
    enabled: !!phone,
  });
}

// ─── Submit Reservation ───────────────────────────────
export function useSubmitReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      restaurantId: string;
      submitterPhone: string;
      submitterFirstName: string;
      submitterLastName: string;
      reservationDate: string;
      reservationTime: string;
      partySize: number;
      seatType: string;
      nameOnReservation: string;
      cancelFee?: number;
      prepaidAmount?: number;
      verificationLink?: string;
    }) => api.post<Reservation>("/api/reservations", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["myReservations"] });
    },
  });
}

// ─── Claim Reservation ────────────────────────────────
export function useClaimReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      reservationId,
      claimerPhone,
    }: {
      reservationId: string;
      claimerPhone: string;
    }) =>
      api.post<Reservation>(`/api/reservations/${reservationId}/claim`, {
        claimerPhone,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["myReservations"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["restaurant"] });
    },
  });
}

// ─── Cancel Reservation ───────────────────────────────
export function useCancelReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reservationId: string) =>
      api.patch<Reservation>(`/api/reservations/${reservationId}/cancel`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["myReservations"] });
    },
  });
}

// ─── Profile ──────────────────────────────────────────
export function useProfile(phone: string) {
  return useQuery({
    queryKey: ["profile", phone],
    queryFn: () =>
      api.get<UserProfile>(`/api/profile?phone=${encodeURIComponent(phone)}`),
    enabled: !!phone,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      phone: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      avatar?: string;
      selectedCity?: string;
    }) => api.put<UserProfile>("/api/profile", body),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["profile", vars.phone] });
    },
  });
}

// ─── Activity Alerts ──────────────────────────────────
export function useActivityAlerts(phone: string) {
  return useQuery({
    queryKey: ["activityAlerts", phone],
    queryFn: () =>
      api.get<ActivityAlert[]>(
        `/api/alerts?phone=${encodeURIComponent(phone)}`
      ),
    enabled: !!phone,
  });
}

export function useMarkAlertsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { phone?: string; alertIds?: string[] }) =>
      api.post<{ success: boolean }>("/api/alerts/read", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activityAlerts"] });
    },
  });
}

// ─── Restaurant Alerts ────────────────────────────────
export function useRestaurantAlerts(phone: string) {
  return useQuery({
    queryKey: ["restaurantAlerts", phone],
    queryFn: () =>
      api.get<RestaurantAlertWithRestaurant[]>(
        `/api/alerts/restaurant-alerts?phone=${encodeURIComponent(phone)}`
      ),
    enabled: !!phone,
  });
}

export function useAddRestaurantAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { userPhone: string; restaurantId: string }) =>
      api.post<RestaurantAlertWithRestaurant>(
        "/api/alerts/restaurant-alerts",
        body
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["restaurantAlerts"] });
    },
  });
}

export function useRemoveRestaurantAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) =>
      api.delete<{ success: boolean }>(
        `/api/alerts/restaurant-alerts/${alertId}`
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["restaurantAlerts"] });
    },
  });
}
