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
      try {
        const queryParams = new URLSearchParams();
        if (params?.city) queryParams.set("city", params.city);
        if (params?.neighborhood && params.neighborhood !== "Alla")
          queryParams.set("neighborhood", params.neighborhood);
        if (params?.search) queryParams.set("search", params.search);
        const qs = queryParams.toString();
        return await api.get<Restaurant[]>(`/api/restaurants${qs ? `?${qs}` : ""}`) ?? [];
      } catch { return [] as Restaurant[]; }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRestaurant(id: string) {
  return useQuery({
    queryKey: ["restaurant", id],
    queryFn: async () => {
      try { return await api.get<Restaurant & { reservations: Reservation[] }>(`/api/restaurants/${id}`); }
      catch { return null; }
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useReservation(id: string) {
  return useQuery({
    queryKey: ["reservation", id],
    queryFn: async () => {
      try { return await api.get<Reservation>(`/api/reservations/${id}`); }
      catch { return null; }
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
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
      try {
        const queryParams = new URLSearchParams();
        if (params?.city) queryParams.set("city", params.city);
        if (params?.neighborhood && params.neighborhood !== "Alla")
          queryParams.set("neighborhood", params.neighborhood);
        if (params?.date) queryParams.set("date", params.date);
        const qs = queryParams.toString();
        return await api.get<Reservation[]>(`/api/reservations${qs ? `?${qs}` : ""}`) ?? [];
      } catch { return [] as Reservation[]; }
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Missed Reservations (loss aversion) ─────────────
export function useMissedReservations(city?: string) {
  return useQuery({
    queryKey: ["missedReservations", city],
    queryFn: async () => {
      try {
        const qs = city ? `?city=${encodeURIComponent(city)}` : "";
        return await api.get<MissedReservation[]>(`/api/reservations/missed${qs}`) ?? [];
      } catch { return [] as MissedReservation[]; }
    },
    staleTime: 2 * 60 * 1000,
  });
}

// ─── My Reservations ──────────────────────────────────
export function useMyReservations(phone: string) {
  return useQuery({
    queryKey: ["myReservations", phone],
    queryFn: async () => {
      try { return await api.get<Reservation[]>(`/api/reservations/mine`) ?? []; }
      catch { return [] as Reservation[]; }
    },
    enabled: !!phone,
    staleTime: 5 * 60 * 1000,
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
    queryFn: async () => {
      try {
        return await api.get<UserProfile>(`/api/profile`);
      } catch {
        return null;
      }
    },
    enabled: !!phone,
    staleTime: 60 * 1000,
  });
}

// ─── Activity Alerts ──────────────────────────────────
export function useActivityAlerts(phone: string) {
  return useQuery({
    queryKey: ["activityAlerts", phone],
    queryFn: async () => {
      try { return await api.get<ActivityAlert[]>(`/api/alerts`) ?? []; }
      catch { return [] as ActivityAlert[]; }
    },
    enabled: !!phone,
    staleTime: 5 * 60 * 1000,
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
    queryFn: async () => {
      try { return await api.get<RestaurantAlertWithRestaurant[]>(`/api/alerts/restaurant-alerts`) ?? []; }
      catch { return [] as RestaurantAlertWithRestaurant[]; }
    },
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
    queryFn: async () => {
      try { return await api.get<Watch[]>(`/api/watches`) ?? []; }
      catch { return [] as Watch[]; }
    },
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
    queryFn: async () => {
      try {
        return await api.get<Restaurant[]>("/api/restaurants/new-on-reslot") ?? [];
      } catch {
        return [];
      }
    },
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
    queryFn: async () => {
      try { return await api.get<CardStatus>("/api/credits/card-status"); }
      catch { return null; }
    },
    enabled: !!phone,
    staleTime: 5 * 60 * 1000,
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
    queryFn: async () => {
      try { return await api.get<{ referralCode: string }>(`/api/referral/code`); }
      catch { return { referralCode: '' }; }
    },
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

// ─── Feedback ─────────────────────────────────────────
export function useSubmitFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reservationId, worked, comment }: { reservationId: string; worked: boolean; comment?: string }) =>
      api.post<{ id: string; worked: boolean }>(`/api/reservations/${reservationId}/feedback`, { worked, comment }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myReservations"] });
    },
  });
}

// ─── Support ─────────────────────────────────────────
export function useSubmitSupportMessage() {
  return useMutation({
    mutationFn: (data: { message: string; phone?: string; email?: string }) =>
      api.post<{ success: boolean }>("/api/support", data),
  });
}

// ─── Report Reservation ─────────────────────────────
export function useReportReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reservationId, reason, details }: { reservationId: string; reason: string; details?: string }) =>
      api.post<{ id: string; reason: string; status: string }>(`/api/reservations/${reservationId}/report`, { reason, details }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservation"] });
      qc.invalidateQueries({ queryKey: ["myReservations"] });
    },
  });
}

// ─── Saved Restaurants ───────────────────────────────
export function useSavedRestaurants(phone: string | null | undefined) {
  return useQuery({
    queryKey: ["savedRestaurants", phone],
    queryFn: async () => {
      try { return await api.get<SavedRestaurant[]>("/api/saved-restaurants") ?? []; }
      catch { return [] as SavedRestaurant[]; }
    },
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

