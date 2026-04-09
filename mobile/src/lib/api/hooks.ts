import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { supabase } from "@/lib/supabase";
import type {
  Restaurant,
  Reservation,
  UserProfile,
  Watch,
  WatchFilterOptions,
  SavedRestaurant,
  CardStatus,
  CheckoutSessionResult,
  CreditsPurchaseResult,
  MissedReservation,
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
    queryFn: () => api.restaurants.getAll(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRestaurant(id: string) {
  return useQuery({
    queryKey: ["restaurant", id],
    queryFn: () => api.restaurants.getOne(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useReservation(id: string) {
  return useQuery({
    queryKey: ["reservation", id],
    queryFn: () => api.reservations.getOne(id),
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
    queryFn: () => api.reservations.getAll(params),
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Missed Reservations — TODO: implement when Supabase schema supports it
export function useMissedReservations(_city?: string) {
  return useQuery({
    queryKey: ["missedReservations", _city],
    queryFn: async (): Promise<MissedReservation[]> => [],
    staleTime: 2 * 60 * 1000,
  });
}

// ─── My Reservations ──────────────────────────────────
export function useMyReservations(phone: string) {
  return useQuery({
    queryKey: ["myReservations", phone],
    queryFn: () => api.reservations.getMine(),
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
    }) => api.reservations.create(body),
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
    mutationFn: async ({
      reservationId,
    }: {
      reservationId: string;
      claimerPhone?: string; // kept for API compat; userId resolved from Supabase Auth
    }) => {
      const { data } = await supabase.auth.getUser();
      const claimerId = data.user?.id;
      if (!claimerId) throw new Error("Not authenticated");
      return api.reservations.claim(reservationId, claimerId);
    },
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
      api.reservations.cancel(reservationId),
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
      api.reservations.cancelClaim(reservationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["myReservations"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["reservation"] });
    },
  });
}

// ─── Profile ──────────────────────────────────────────
export function useProfile(phone?: string | null) {
  return useQuery({
    queryKey: ["profile", phone],
    queryFn: () => api.profile.get(),
    enabled: !!phone,
    staleTime: 60 * 1000,
  });
}

// ─── Activity Alerts — TODO: implement when Supabase schema supports it
export function useActivityAlerts(phone: string) {
  return useQuery({
    queryKey: ["activityAlerts", phone],
    queryFn: async (): Promise<ActivityAlert[]> => [],
    enabled: !!phone,
    staleTime: 5 * 60 * 1000,
  });
}

// TODO: implement useMarkAlertsRead when activity_alerts table is available in Supabase
export function useMarkAlertsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (_body: { phone?: string; alertIds?: string[] }): Promise<{ success: boolean }> => ({
      success: true,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activityAlerts"] });
    },
  });
}

// ─── Restaurant Alerts — TODO: implement when Supabase schema supports it
export function useRestaurantAlerts(phone: string) {
  return useQuery({
    queryKey: ["restaurantAlerts", phone],
    queryFn: async (): Promise<RestaurantAlertWithRestaurant[]> => [],
    enabled: !!phone,
    staleTime: 60 * 1000,
  });
}

// TODO: implement when restaurant_alerts table is available in Supabase
export function useAddRestaurantAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (_body: {
      userPhone: string;
      restaurantId: string;
    }): Promise<RestaurantAlertWithRestaurant> => {
      throw new Error("Not implemented yet");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["restaurantAlerts"] });
    },
  });
}

// TODO: implement when restaurant_alerts table is available in Supabase
export function useRemoveRestaurantAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (_alertId: string): Promise<{ success: boolean }> => {
      throw new Error("Not implemented yet");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["restaurantAlerts"] });
    },
  });
}

// ─── Watches (bevakningar) ────────────────────────────
export function useWatches(phone: string | null | undefined) {
  return useQuery({
    queryKey: ["watches", phone],
    queryFn: () => api.watches.getAll(),
    enabled: !!phone,
    staleTime: 60 * 1000,
  });
}

interface AddWatchData {
  userPhone?: string;
  restaurantId?: string;
  date?: string;
  partySize?: number;
  notes?: string;
  filterOptions?: WatchFilterOptions;
}

export function useAddWatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddWatchData) => api.watches.create(data),
    onSuccess: (_: Watch, variables: AddWatchData) => {
      queryClient.invalidateQueries({ queryKey: ["watches", variables.userPhone] });
      queryClient.invalidateQueries({ queryKey: ["watches"] });
    },
  });
}

export function useDeleteWatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; userPhone?: string }) =>
      api.watches.delete(id),
    onSuccess: (_: { success: boolean }, variables: { id: string; userPhone?: string }) => {
      queryClient.invalidateQueries({ queryKey: ["watches", variables.userPhone] });
      queryClient.invalidateQueries({ queryKey: ["watches"] });
    },
  });
}

// ─── New on Reslot (discovery) ────────────────────────
// TODO: add a "new" filter/query to api.restaurants.getAll when schema supports it
export function useNewOnReslot() {
  return useQuery({
    queryKey: ["newOnReslot"],
    queryFn: () => api.restaurants.getAll(),
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Credits purchase — TODO: implement with Stripe later
export function usePurchaseCredits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_data: {
      phone: string;
      quantity: number;
    }): Promise<CreditsPurchaseResult> => {
      throw new Error("Credits purchase not implemented yet (Stripe)");
    },
    onSuccess: (_: CreditsPurchaseResult, variables: { phone: string; quantity: number }) => {
      queryClient.invalidateQueries({ queryKey: ["profile", variables.phone] });
      queryClient.invalidateQueries({ queryKey: ["activityAlerts", variables.phone] });
    },
  });
}

// ─── Card setup — TODO: implement with Stripe later
export function useCardStatus(phone: string | null | undefined) {
  return useQuery({
    queryKey: ["cardStatus", phone],
    queryFn: async (): Promise<CardStatus> => ({
      hasCard: false,
      cardLast4: null,
      cardBrand: null,
    }),
    enabled: !!phone,
    staleTime: 5 * 60 * 1000,
  });
}

// TODO: implement with Stripe later
export function useSetupCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<CheckoutSessionResult> => {
      throw new Error("Card setup not implemented yet (Stripe)");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cardStatus"] });
    },
  });
}

// ─── Referral — TODO: implement when referral system is in Supabase
export function useReferralCode(phone: string | null | undefined) {
  return useQuery({
    queryKey: ["referralCode", phone],
    queryFn: async (): Promise<{ referralCode: string }> => ({ referralCode: "" }),
    enabled: !!phone,
    staleTime: 10 * 60 * 1000,
  });
}

// TODO: implement referral use when schema supports it
export function useUseReferralCode() {
  return useMutation({
    mutationFn: async (_data: {
      phone: string;
      referralCode: string;
    }): Promise<{ success: boolean }> => {
      throw new Error("Referral not implemented yet");
    },
  });
}

// ─── Push Notifications ──────────────────────────────
export function useSavePushToken() {
  return useMutation({
    mutationFn: ({ token }: { token: string }) =>
      api.profile.savePushToken(token).then(() => ({ success: true })),
  });
}

// ─── Feedback ─────────────────────────────────────────
export function useSubmitFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      reservationId,
      worked,
      comment,
    }: {
      reservationId: string;
      worked: boolean;
      comment?: string;
    }) => api.feedback.submit(reservationId, worked, comment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myReservations"] });
    },
  });
}

// ─── Support — TODO: implement support channel in Supabase or external service
export function useSubmitSupportMessage() {
  return useMutation({
    mutationFn: async (_data: {
      message: string;
      phone?: string;
      email?: string;
    }): Promise<{ success: boolean }> => {
      throw new Error("Support messages not implemented yet");
    },
  });
}

// ─── Report Reservation — TODO: implement when reports table is in Supabase
export function useReportReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (_params: {
      reservationId: string;
      reason: string;
      details?: string;
    }): Promise<{ id: string; reason: string; status: string }> => {
      throw new Error("Reservation reporting not implemented yet");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservation"] });
      qc.invalidateQueries({ queryKey: ["myReservations"] });
    },
  });
}

// ─── Saved Restaurants — TODO: implement when saved_restaurants table is in Supabase
export function useSavedRestaurants(phone: string | null | undefined) {
  return useQuery({
    queryKey: ["savedRestaurants", phone],
    queryFn: async (): Promise<SavedRestaurant[]> => [],
    enabled: !!phone,
    staleTime: 60 * 1000,
  });
}

// TODO: implement when saved_restaurants table is in Supabase
export function useSaveRestaurant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (_data: { restaurantId: string }): Promise<SavedRestaurant> => {
      throw new Error("Saved restaurants not implemented yet");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["savedRestaurants"] });
    },
  });
}

// TODO: implement when saved_restaurants table is in Supabase
export function useUnsaveRestaurant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (_restaurantId: string): Promise<{ success: boolean }> => {
      throw new Error("Saved restaurants not implemented yet");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["savedRestaurants"] });
    },
  });
}
