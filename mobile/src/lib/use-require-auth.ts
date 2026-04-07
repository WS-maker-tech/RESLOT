import { useAuthStore } from "./auth-store";

/**
 * Returns a wrapper that checks if the user is logged in.
 * If not, opens the auth modal (splash → phone → OTP → ...).
 * If yes, runs the callback immediately.
 *
 * Usage:
 *   const requireAuth = useRequireAuth();
 *   <Pressable onPress={requireAuth(() => claimReservation(id))} />
 */
export function useRequireAuth() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  return (action?: () => void) => () => {
    if (isLoggedIn) {
      action?.();
    } else {
      openAuthModal();
    }
  };
}
