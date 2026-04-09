// Supabase-only API client - no backend dependency
// All calls go directly to Supabase (Auth + Database)
// Note: Table names use PascalCase (Reservation, Restaurant, UserProfile, etc)
// Column names use camelCase (reservationDate, restaurantId, submitterPhone, etc)

import { supabase } from "@/lib/supabase";
import type {
  Restaurant,
  Reservation,
  UserProfile,
  ActivityAlert,
  Watch,
  SavedRestaurant,
  CardStatus,
  MissedReservation,
} from "./types";

// Helper: get current user ID from Supabase Auth
async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

// Supabase API namespace — direct table access
export const api = {
  // ─── Profile ────────────────────────────────────────────
  profile: {
    async get(): Promise<UserProfile> {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("UserProfile")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (error) throw new Error(error.message);
      return data as UserProfile;
    },
    async update(profile: Partial<UserProfile>): Promise<UserProfile> {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("UserProfile")
        .update(profile)
        .eq("id", userId)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data as UserProfile;
    },
    async savePushToken(token: string): Promise<void> {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("UserProfile")
        .update({ pushToken: token })
        .eq("id", userId);
      
      if (error) throw new Error(error.message);
    },
    async delete(): Promise<void> {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("UserProfile")
        .delete()
        .eq("id", userId);
      
      if (error) throw new Error(error.message);
    },
  },

  // ─── Reservations ───────────────────────────────────────
  reservations: {
    async getAll(params?: { city?: string; neighborhood?: string; date?: string }): Promise<Reservation[]> {
      let query = supabase.from("Reservation").select("*, Restaurant:restaurantId(id, name, city, address, latitude, longitude, image, neighborhood)");
      
      // For city filter, we need to join and filter on Restaurant
      if (params?.city || params?.date) {
        // Get all reservations first, then filter client-side
        const { data, error } = await query;
        if (error) throw new Error(error.message);
        
        let filtered = (data || []) as Reservation[];
        if (params?.city) {
          filtered = filtered.filter((r: any) => r.Restaurant?.city === params.city);
        }
        if (params?.date) {
          filtered = filtered.filter((r: any) => r.reservationDate === params.date);
        }
        return filtered;
      }
      
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data || []) as Reservation[];
    },
    async getMine(): Promise<Reservation[]> {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("Reservation")
        .select("*, Restaurant:restaurantId(id, name, city, address, latitude, longitude, image, neighborhood)")
        .or("submitterPhone.eq." + userId + ",claimerPhone.eq." + userId);
      
      if (error) throw new Error(error.message);
      return (data || []) as Reservation[];
    },
    async getOne(id: string): Promise<Reservation> {
      const { data, error } = await supabase
        .from("Reservation")
        .select("*, Restaurant:restaurantId(id, name, city, address, latitude, longitude, image, neighborhood)")
        .eq("id", id)
        .single();
      
      if (error) throw new Error(error.message);
      return data as Reservation;
    },
    async create(reservation: any): Promise<Reservation> {
      const { data, error } = await supabase
        .from("Reservation")
        .insert([reservation])
        .select("*, Restaurant:restaurantId(id, name, city, address, latitude, longitude, image, neighborhood)")
        .single();
      
      if (error) throw new Error(error.message);
      return data as Reservation;
    },
    async claim(reservationId: string, claimerId: string): Promise<Reservation> {
      const { data, error } = await supabase
        .from("Reservation")
        .update({ claimerPhone: claimerId, status: "claimed", claimedAt: new Date().toISOString() })
        .eq("id", reservationId)
        .select("*, Restaurant:restaurantId(id, name, city, address, latitude, longitude, image, neighborhood)")
        .single();
      
      if (error) throw new Error(error.message);
      return data as Reservation;
    },
    async cancel(reservationId: string): Promise<Reservation> {
      const { data, error } = await supabase
        .from("Reservation")
        .update({ status: "cancelled" })
        .eq("id", reservationId)
        .select("*, Restaurant:restaurantId(id, name, city, address, latitude, longitude, image, neighborhood)")
        .single();
      
      if (error) throw new Error(error.message);
      return data as Reservation;
    },
    async cancelClaim(reservationId: string): Promise<Reservation> {
      const { data, error } = await supabase
        .from("Reservation")
        .update({ claimerPhone: null, status: "active", claimedAt: null })
        .eq("id", reservationId)
        .select("*, Restaurant:restaurantId(id, name, city, address, latitude, longitude, image, neighborhood)")
        .single();
      
      if (error) throw new Error(error.message);
      return data as Reservation;
    },
  },

  // ─── Feedback ───────────────────────────────────────────
  feedback: {
    async submit(reservationId: string, worked: boolean, comment?: string): Promise<{ id: string; worked: boolean }> {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("ReservationFeedback")
        .insert([{ reservationId, userId, worked }])
        .select("id, worked")
        .single();
      
      if (error) throw new Error(error.message);
      return data as { id: string; worked: boolean };
    },
  },

  // ─── Restaurants ────────────────────────────────────────
  restaurants: {
    async getAll(params?: { city?: string; neighborhood?: string; search?: string }): Promise<Restaurant[]> {
      let query = supabase.from("Restaurant").select("*");
      
      if (params?.city) query = query.eq("city", params.city);
      if (params?.neighborhood && params.neighborhood !== "Alla") {
        query = query.eq("neighborhood", params.neighborhood);
      }
      if (params?.search) query = query.ilike("name", "%" + params.search + "%");
      
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data || []) as Restaurant[];
    },
    async getOne(id: string): Promise<Restaurant & { reservations: Reservation[] }> {
      const { data: restaurant, error: restaurantError } = await supabase
        .from("Restaurant")
        .select("*")
        .eq("id", id)
        .single();
      
      if (restaurantError) throw new Error(restaurantError.message);
      
      const { data: reservations, error: reservError } = await supabase
        .from("Reservation")
        .select("*")
        .eq("restaurantId", id);
      
      if (reservError) throw new Error(reservError.message);
      
      return { ...restaurant, reservations: reservations || [] } as Restaurant & { reservations: Reservation[] };
    },
  },

  // ─── Watches (Bevakningar) ──────────────────────────────
  watches: {
    async getAll(): Promise<Watch[]> {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("Watch")
        .select("*, Restaurant:restaurantId(id, name, city, address, latitude, longitude, image, neighborhood)")
        .eq("userPhone", userId);
      
      if (error) throw new Error(error.message);
      return (data || []) as Watch[];
    },
    async create(watch: any): Promise<Watch> {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("Watch")
        .insert([{ ...watch, userPhone: userId }])
        .select("*, Restaurant:restaurantId(id, name, city, address, latitude, longitude, image, neighborhood)")
        .single();
      
      if (error) throw new Error(error.message);
      return data as Watch;
    },
    async delete(id: string): Promise<{ success: boolean }> {
      const { error } = await supabase
        .from("Watch")
        .delete()
        .eq("id", id);
      
      if (error) throw new Error(error.message);
      return { success: true };
    },
  },
};
