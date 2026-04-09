// Supabase-only API client - no backend dependency
// All calls go directly to Supabase (Auth + Database)

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
        .from("users")
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
        .from("users")
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
        .from("users")
        .update({ push_token: token })
        .eq("id", userId);
      
      if (error) throw new Error(error.message);
    },
    async delete(): Promise<void> {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", userId);
      
      if (error) throw new Error(error.message);
    },
  },

  // ─── Reservations ───────────────────────────────────────
  reservations: {
    async getAll(params?: { city?: string; neighborhood?: string; date?: string }): Promise<Reservation[]> {
      let query = supabase.from("reservations").select("*, restaurant:restaurants(*)");
      
      if (params?.city) query = query.eq("restaurant.city", params.city);
      if (params?.date) query = query.eq("date", params.date);
      
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data as Reservation[];
    },
    async getMine(): Promise<Reservation[]> {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("reservations")
        .select("*, restaurant:restaurants(*)")
        .or(`original_holder_id.eq.${userId},claimer_id.eq.${userId}`);
      
      if (error) throw new Error(error.message);
      return data as Reservation[];
    },
    async getOne(id: string): Promise<Reservation> {
      const { data, error } = await supabase
        .from("reservations")
        .select("*, restaurant:restaurants(*)")
        .eq("id", id)
        .single();
      
      if (error) throw new Error(error.message);
      return data as Reservation;
    },
    async create(reservation: any): Promise<Reservation> {
      const { data, error } = await supabase
        .from("reservations")
        .insert([reservation])
        .select("*, restaurant:restaurants(*)")
        .single();
      
      if (error) throw new Error(error.message);
      return data as Reservation;
    },
    async claim(reservationId: string, claimerId: string): Promise<Reservation> {
      const { data, error } = await supabase
        .from("reservations")
        .update({ claimer_id: claimerId, status: "claimed", claimed_at: new Date().toISOString() })
        .eq("id", reservationId)
        .select("*, restaurant:restaurants(*)")
        .single();
      
      if (error) throw new Error(error.message);
      return data as Reservation;
    },
    async cancel(reservationId: string): Promise<Reservation> {
      const { data, error } = await supabase
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", reservationId)
        .select("*, restaurant:restaurants(*)")
        .single();
      
      if (error) throw new Error(error.message);
      return data as Reservation;
    },
    async cancelClaim(reservationId: string): Promise<Reservation> {
      const { data, error } = await supabase
        .from("reservations")
        .update({ claimer_id: null, status: "active", claimed_at: null })
        .eq("id", reservationId)
        .select("*, restaurant:restaurants(*)")
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
        .from("feedbacks")
        .insert([{ reservation_id: reservationId, user_id: userId, worked, comment }])
        .select("id, worked")
        .single();
      
      if (error) throw new Error(error.message);
      return data as { id: string; worked: boolean };
    },
  },

  // ─── Restaurants ────────────────────────────────────────
  restaurants: {
    async getAll(params?: { city?: string; neighborhood?: string; search?: string }): Promise<Restaurant[]> {
      let query = supabase.from("restaurants").select("*");
      
      if (params?.city) query = query.eq("city", params.city);
      if (params?.neighborhood && params.neighborhood !== "Alla") {
        // Assuming a neighborhood column exists in restaurants table
        // If not, this may need adjustment
      }
      if (params?.search) query = query.ilike("name", `%${params.search}%`);
      
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data as Restaurant[];
    },
    async getOne(id: string): Promise<Restaurant & { reservations: Reservation[] }> {
      const { data: restaurant, error: restaurantError } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", id)
        .single();
      
      if (restaurantError) throw new Error(restaurantError.message);
      
      const { data: reservations, error: reservError } = await supabase
        .from("reservations")
        .select("*")
        .eq("restaurant_id", id);
      
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
        .from("watches")
        .select("*, restaurant:restaurants(*)")
        .eq("user_id", userId);
      
      if (error) throw new Error(error.message);
      return data as Watch[];
    },
    async create(watch: any): Promise<Watch> {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("watches")
        .insert([{ ...watch, user_id: userId }])
        .select("*, restaurant:restaurants(*)")
        .single();
      
      if (error) throw new Error(error.message);
      return data as Watch;
    },
    async delete(id: string): Promise<{ success: boolean }> {
      const { error } = await supabase
        .from("watches")
        .delete()
        .eq("id", id);
      
      if (error) throw new Error(error.message);
      return { success: true };
    },
  },
};
