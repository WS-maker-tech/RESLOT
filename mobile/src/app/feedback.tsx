import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { ThumbsUp, ThumbsDown, X, CheckCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { C, FONTS, SPACING, RADIUS, SHADOW } from "@/lib/theme";
import { api } from "@/lib/api/api";

export default function FeedbackScreen() {
  const router = useRouter();
  const { reservationId, restaurantName } = useLocalSearchParams<{
    reservationId: string;
    restaurantName: string;
  }>();

  const [worked, setWorked] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: async (data: { worked: boolean; comment?: string }) => {
      if (!reservationId) throw new Error("No reservation ID");
      return api.feedback.submit(reservationId, data.worked, data.comment);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
      setTimeout(() => router.back(), 1200);
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const handleSelect = (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setWorked(value);
  };

  const handleSubmit = () => {
    if (worked === null) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    mutation.mutate({
      worked,
      comment: comment.trim() || undefined,
    });
  };

  if (submitted) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Animated.View entering={FadeIn.duration(300)} style={{ alignItems: "center" }}>
            <CheckCircle size={56} color={C.success} strokeWidth={1.8} />
            <Text
              style={{
                fontFamily: FONTS.displayBold,
                fontSize: 24,
                color: C.textPrimary,
                marginTop: SPACING.md,
                letterSpacing: -0.5,
              }}
            >
              Tack!
            </Text>
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: 15,
                color: C.textSecondary,
                marginTop: SPACING.xs,
              }}
            >
              Din feedback hjälper oss bli bättre.
            </Text>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 12,
          }}
        >
          <View style={{ width: 36 }} />
          <Text
            style={{
              fontFamily: FONTS.displayBold,
              fontSize: 17,
              color: C.textPrimary,
              letterSpacing: -0.3,
            }}
          >
            Feedback
          </Text>
          <Pressable
            testID="feedback-close"
            accessibilityLabel="Stäng"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: C.overlayLight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} color={C.textSecondary} strokeWidth={2} />
          </Pressable>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flex: 1,
            paddingHorizontal: 20,
            paddingTop: 32,
          }}
        >
          <Animated.View entering={FadeInDown.springify()} style={{ alignItems: "center" }}>
            <Text
              style={{
                fontFamily: FONTS.displayBold,
                fontSize: 24,
                color: C.textPrimary,
                letterSpacing: -0.5,
                textAlign: "center",
              }}
            >
              Fungerade bokningen?
            </Text>
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: 15,
                color: C.textSecondary,
                marginTop: SPACING.sm,
                textAlign: "center",
                lineHeight: 22,
              }}
            >
              Hur gick det på {restaurantName ?? "restaurangen"}?
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={{
              flexDirection: "row",
              gap: 16,
              justifyContent: "center",
              marginTop: 36,
            }}
          >
            <Pressable
              testID="feedback-thumbs-up"
              accessibilityLabel="Bokningen fungerade"
              onPress={() => handleSelect(true)}
              style={{
                width: 120,
                height: 120,
                borderRadius: RADIUS.xl,
                backgroundColor: worked === true ? "rgba(34,197,94,0.12)" : C.bgCard,
                borderWidth: worked === true ? 2 : 0.5,
                borderColor: worked === true ? C.successBright : C.divider,
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                ...SHADOW.card,
              }}
            >
              <ThumbsUp
                size={36}
                color={worked === true ? C.successBright : C.textTertiary}
                strokeWidth={worked === true ? 2.2 : 1.8}
                fill={worked === true ? C.successBright : "transparent"}
              />
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: 14,
                  color: worked === true ? C.successBright : C.textTertiary,
                }}
              >
                Ja
              </Text>
            </Pressable>

            <Pressable
              testID="feedback-thumbs-down"
              accessibilityLabel="Bokningen fungerade inte"
              onPress={() => handleSelect(false)}
              style={{
                width: 120,
                height: 120,
                borderRadius: RADIUS.xl,
                backgroundColor: worked === false ? C.errorBg : C.bgCard,
                borderWidth: worked === false ? 2 : 0.5,
                borderColor: worked === false ? C.error : C.divider,
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                ...SHADOW.card,
              }}
            >
              <ThumbsDown
                size={36}
                color={worked === false ? C.error : C.textTertiary}
                strokeWidth={worked === false ? 2.2 : 1.8}
                fill={worked === false ? C.error : "transparent"}
              />
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: 14,
                  color: worked === false ? C.error : C.textTertiary,
                }}
              >
                Nej
              </Text>
            </Pressable>
          </Animated.View>

          {worked !== null ? (
            <Animated.View entering={FadeInDown.springify()} style={{ marginTop: 28 }}>
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: 14,
                  color: C.textSecondary,
                  marginBottom: SPACING.sm,
                }}
              >
                Vill du berätta mer? (valfritt)
              </Text>
              <TextInput
                testID="feedback-comment"
                placeholder={
                  worked
                    ? "T.ex. Allt gick smidigt..."
                    : "T.ex. Restaurangen kunde inte hitta bokningen..."
                }
                placeholderTextColor={C.textTertiary}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: 14,
                  color: C.textPrimary,
                  backgroundColor: C.bgInput,
                  borderRadius: RADIUS.md,
                  padding: 12,
                  minHeight: 80,
                  lineHeight: 20,
                }}
              />
            </Animated.View>
          ) : null}

          {worked !== null ? (
            <Animated.View entering={FadeInDown.delay(50).springify()} style={{ marginTop: 20 }}>
              <Pressable
                testID="feedback-submit"
                accessibilityLabel="Skicka feedback"
                onPress={handleSubmit}
                disabled={mutation.isPending}
                style={{
                  backgroundColor: C.coral,
                  borderRadius: RADIUS.md,
                  paddingVertical: 15,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: mutation.isPending ? 0.7 : 1,
                }}
              >
                {mutation.isPending ? (
                  <ActivityIndicator size="small" color={C.dark} />
                ) : (
                  <Text
                    style={{
                      fontFamily: FONTS.bold,
                      fontSize: 16,
                      color: C.dark,
                    }}
                  >
                    Skicka
                  </Text>
                )}
              </Pressable>

              {mutation.isError ? (
                <Text
                  style={{
                    fontFamily: FONTS.regular,
                    fontSize: 13,
                    color: C.error,
                    textAlign: "center",
                    marginTop: SPACING.sm,
                  }}
                >
                  Något gick fel. Försök igen.
                </Text>
              ) : null}
            </Animated.View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
