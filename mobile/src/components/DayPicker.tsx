import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Calendar } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { C, FONTS, RADIUS, SPACING } from "../lib/theme";

const DAY_NAMES = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

export function generateDays(): { label: string; date: number; fullDate: Date; isToday: boolean }[] {
  const today = new Date();
  const days: { label: string; date: number; fullDate: Date; isToday: boolean }[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayOfWeek = d.getDay();
    const mapped = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    days.push({
      label: DAY_NAMES[mapped],
      date: d.getDate(),
      fullDate: new Date(d),
      isToday: i === 0,
    });
  }
  return days;
}

interface DayPickerProps {
  selectedDate: Date;
  onSelect: (date: Date) => void;
  onOpenCalendar: () => void;
  days: ReturnType<typeof generateDays>;
}

export const DayPicker = React.memo(function DayPicker({
  selectedDate,
  onSelect,
  onOpenCalendar,
  days,
}: DayPickerProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scroll}
      >
        {days.map((day: ReturnType<typeof generateDays>[number], index: number) => {
          const isSelected = selectedDate.toDateString() === day.fullDate.toDateString();
          return (
            <Pressable
              key={`${day.label}-${day.date}`}
              testID={`day-picker-${index}`}
              accessibilityLabel={`Välj ${day.label} ${day.date}`}
              onPress={() => {
                onSelect(day.fullDate);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={[
                styles.dayButton,
                { backgroundColor: isSelected ? C.coral : "transparent" },
                ...(isSelected ? [{
                  shadowColor: C.coral,
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.25,
                  shadowRadius: 6,
                  elevation: 3,
                }] : []),
              ]}
            >
              <Text
                style={[
                  styles.dayLabel,
                  { color: isSelected ? "rgba(17,24,39,0.6)" : C.textTertiary },
                ]}
              >
                {day.label}
              </Text>
              <Text
                style={[
                  styles.dayDate,
                  { color: isSelected ? "#111827" : C.textPrimary },
                ]}
              >
                {day.date}
              </Text>
              {day.isToday && !isSelected ? (
                <View style={styles.todayDot} />
              ) : (
                <View style={styles.todayDotPlaceholder} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Calendar button */}
      <Pressable
        onPress={onOpenCalendar}
        testID="open-calendar-button"
        accessibilityLabel="Öppna kalender"
        style={styles.calendarButton}
      >
        <Calendar size={14} color={C.textSecondary} strokeWidth={2} />
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  scroll: {
    flexGrow: 1,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 12,
    paddingBottom: 16,
  },
  dayButton: {
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    marginRight: 6,
    minWidth: 54,
  },
  dayLabel: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dayDate: {
    fontFamily: FONTS.bold,
    fontSize: 19,
    marginTop: 2,
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: C.coral,
    marginTop: 4,
  },
  todayDotPlaceholder: {
    width: 4,
    height: 4,
    marginTop: 4,
  },
  calendarButton: {
    marginRight: 16,
    marginLeft: 4,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.bgCard,
    borderWidth: 1,
    borderColor: C.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
});
