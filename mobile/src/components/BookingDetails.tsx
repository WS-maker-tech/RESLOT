import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Calendar, Clock, Users, MapPin } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { C, FONTS, SPACING, RADIUS } from "../lib/theme";

// --- Booking detail pill ---
const BookingPill = React.memo(function BookingPill({
  icon,
  label,
  value,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delay: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      style={styles.pill}
    >
      <View style={styles.pillIcon}>
        {icon}
      </View>
      <View style={styles.pillTextContainer}>
        <Text style={styles.pillLabel}>
          {label}
        </Text>
        <Text style={styles.pillValue}>
          {value}
        </Text>
      </View>
    </Animated.View>
  );
});

interface BookingDetailsProps {
  displayDate: string;
  displayTime: string;
  partySize: number;
  seatTypeLabel: string | null;
}

export const BookingDetails = React.memo(function BookingDetails({
  displayDate,
  displayTime,
  partySize,
  seatTypeLabel,
}: BookingDetailsProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(80).springify()}
      style={styles.container}
    >
      <Text style={styles.title}>
        Bokningsdetaljer
      </Text>
      <View style={styles.pillList}>
        <BookingPill
          icon={<Calendar size={17} color={C.gold} strokeWidth={2} />}
          label="Datum"
          value={displayDate}
          delay={100}
        />
        <BookingPill
          icon={<Clock size={17} color={C.gold} strokeWidth={2} />}
          label="Tid"
          value={displayTime}
          delay={140}
        />
        <BookingPill
          icon={<Users size={17} color={C.gold} strokeWidth={2} />}
          label="Antal gäster"
          value={`${partySize} personer`}
          delay={180}
        />
        {seatTypeLabel ? (
          <BookingPill
            icon={<MapPin size={17} color={C.gold} strokeWidth={2} />}
            label="Plats"
            value={seatTypeLabel}
            delay={220}
          />
        ) : null}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 20,
  },
  title: {
    fontFamily: FONTS.displayBold,
    fontSize: 18,
    color: C.textPrimary,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  pillList: {
    gap: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.bgCard,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 0.5,
    borderColor: C.borderLight,
  },
  pillIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(201,169,110,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  pillTextContainer: {
    flex: 1,
  },
  pillLabel: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: C.textTertiary,
    marginBottom: 1,
  },
  pillValue: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: C.textPrimary,
  },
});
