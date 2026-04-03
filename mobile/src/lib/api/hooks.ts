import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type {
  Restaurant,
  Reservation,
  MissedReservation,
  UserProfile,
  ActivityAlert,
  RestaurantAlertWithRestaurant,
  Watch,
  WatchFilterOptions,
  SavedRestaurant,
  CardStatus,
  CheckoutSessionResult,
  CreditsPurchaseResult,
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
    staleTime: 5 * 60 * 1000,
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
    staleTime: 5 * 60 * 1000,
  });
}

export function useReservation(id: string) {
  return useQuery({
    queryKey: ["reservation", id],
    queryFn: () => api.get<Reservation>(`/api/reservations/${id}`),
    enabled: !!id,
    staleTime: 30 * 1000,
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
    staleTime: 30 * 1000,
  });
}

// ─── Missed Reservations (loss aversion) ─────────────
export function useMissedReservations(city?: string) {
  return useQuery({
    queryKey: ["missedReservations", city],
    queryFn: async () => {
      const qs = city ? `?city=${encodeURIComponent(city)}` : "";
      return api.get<MissedReservation[]>(`/api/reservations/missed${qs}`);
    },
    staleTime: 2 * 60 * 1000,
  });
}

// ─── My Reservations ──────────────────────────────────
export function useMyReservations(phone: string) {
  return useQuery({
    queryKey: ["myReservations", phone],
    queryFn: () =>
      api.get<Reservation[]>(`/api/reservations/mine`),
    enabled: !!phone,
    staleTime: 30 * 1000,
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
      cancellationWindowHours?: number;
      extraInfo?: string;
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

// ─── Cancel Claim (grace period) ─────────────────────
export function useCancelClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reservationId: string) =>
      api.post<Reservation>(`/api/reservations/${reservationId}/cancel-claim`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["myReservations"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["reservation"] });
    },
  });
}

// ─── Profile ──────────────────────────────────────────
export function useProfile(phone: string) {
  return useQuery({
    queryKey: ["profile", phone],
    queryFn: () =>
      api.get<UserProfile>(`/api/profile`),
    enabled: !!phone,
    staleTime: 60 * 1000,
  });
}

// ─── Activity Alerts ──────────────────────────────────
export function useActivityAlerts(phone: string) {
  return useQuery({
    queryKey: ["activityAlerts", phone],
    queryFn: () =>
      api.get<ActivityAlert[]>(`/api/alerts`),
    enabled: !!phone,
    staleTime: 30 * 1000,
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
      api.get<RestaurantAlertWithRestaurant[]>(`/api/alerts/restaurant-alerts`),
    enabled: !!phone,
    staleTime: 60 * 1000,
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

// ---- Watches (bevakningar) ----
export function useWatches(phone: string | null | undefined) {
  return useQuery({
    queryKey: ["watches", phone],
    queryFn: () => api.get<Watch[]>(`/api/watches`),
    enabled: !!phone,
    staleTime: 60 * 1000,
  });
}

interface AddWatchData {
  userPhone: string;
  restaurantId?: string;
  date?: string;
  partySize?: number;
  notes?: string;
  filterOptions?: WatchFilterOptions;
}

export function useAddWatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddWatchData) => api.post<Watch>("/api/watches", data),
    onSuccess: (_: Watch, variables: AddWatchData) => {
      queryClient.invalidateQueries({ queryKey: ["watches", variables.userPhone] });
    },
  });
}

export function useDeleteWatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; userPhone: string }) =>
      api.delete<{ success: boolean }>(`/api/watches/${id}`),
    onSuccess: (_: { success: boolean }, variables: { id: string; userPhone: string }) => {
      queryClient.invalidateQueries({ queryKey: ["watches", variables.userPhone] });
    },
  });
}

// ─── New on Reslot (discovery) ────────────────────────
export function useNewOnReslot() {
  return useQuery({
    queryKey: ["newOnReslot"],
    queryFn: () => api.get<Restaurant[]>("/api/restaurants/new-on-reslot"),
    staleTime: 5 * 60 * 1000,
  });
}

// ---- Credits purchase ----
export function usePurchaseCredits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { phone: string; quantity: number }) =>
      api.post<CreditsPurchaseResult>("/api/credits/purchase", data),
    onSuccess: (_: CreditsPurchaseResult, variables: { phone: string; quantity: number }) => {
      queryClient.invalidateQueries({ queryKey: ["profile", variables.phone] });
      queryClient.invalidateQueries({ queryKey: ["activityAlerts", variables.phone] });
    },
  });
}

// ---- Card setup ----
export function useCardStatus(phone: string | null | undefined) {
  return useQuery({
    queryKey: ["cardStatus", phone],
    queryFn: () => api.get<CardStatus>("/api/credits/card-status"),
    enabled: !!phone,
    staleTime: 30 * 1000,
  });
}

export function useSetupCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<CheckoutSessionResult>("/api/credits/setup-card", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cardStatus"] });
    },
  });
}

// ---- Referral ----
export function useReferralCode(phone: string | null | undefined) {
  return useQuery({
    queryKey: ["referralCode", phone],
    queryFn: () => api.get<{ referralCode: string }>(`/api/referral/code`),
    enabled: !!phone,
    staleTime: 10 * 60 * 1000,
  });
}

export function useUseReferralCode() {
  return useMutation({
    mutationFn: (data: { phone: string; referralCode: string }) =>
      api.post<{ success: boolean }>("/api/referral/use", data),
  });
}

// ─── Push Notifications ──────────────────────────────
export function useSavePushToken() {
  return useMutation({
    mutationFn: (data: { token: string }) =>
      api.post<{ success: boolean }>("/api/profile/push-token", data),
  });
}

// ─── Support ─────────────────────────────────────────
export function useSubmitSupportMessage() {
  return useMutation({
    mutationFn: (data: { message: string; phone?: string; email?: string }) =>
      api.post<{ success: boolean }>("/api/support", data),
  });
}

// ─── Saved Restaurants ───────────────────────────────
export function useSavedRestaurants(phone: string | null | undefined) {
  return useQuery({
    queryKey: ["savedRestaurants", phone],
    queryFn: () => api.get<SavedRestaurant[]>("/api/saved-restaurants"),
    enabled: !!phone,
    staleTime: 60 * 1000,
  });
}

export function useSaveRestaurant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { restaurantId: string }) =>
      api.post<SavedRestaurant>("/api/saved-restaurants", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["savedRestaurants"] });
    },
  });
}

export function useUnsaveRestaurant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (restaurantId: string) =>
      api.delete<{ success: boolean }>(`/api/saved-restaurants/${restaurantId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["savedRestaurants"] });
    },
  });
}

