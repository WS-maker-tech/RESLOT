import AsyncStorage from "@react-native-async-storage/async-storage";

const DRAFT_KEY = "@reslot/submit-draft";

export type SubmitDraft<T> = {
  state: T;
  savedAt: number;
};

export async function saveDraft<T>(state: T): Promise<void> {
  try {
    const payload: SubmitDraft<T> = { state, savedAt: Date.now() };
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  } catch {}
}

export async function loadDraft<T>(): Promise<SubmitDraft<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SubmitDraft<T>;
  } catch {
    return null;
  }
}

export async function clearDraft(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DRAFT_KEY);
  } catch {}
}
