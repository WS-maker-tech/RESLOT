/**
 * /dev-components — intern designsystem-katalog.
 *
 * Visar alla primitives i alla varianter för visuell QA, utveckling och PR-review.
 * Inte länkad i navbaren — nås direkt via URL: /dev-components
 *
 * Uppdateras kontinuerligt allteftersom nya primitives läggs till i mobile/src/components/ui/.
 */

import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Stack } from "expo-router";
import { ChevronRight, Heart, Mail, MapPin, Phone, Star } from "lucide-react-native";

import {
  Button,
  Card,
  FormField,
  Input,
  ListItem,
  Tag,
  type TagVariant,
} from "@/components/ui";
import { C, FONTS, ICON, SPACING, TYPO } from "@/lib/theme";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: SPACING.xxxl, rowGap: SPACING.md }}>
      <Text style={TYPO.eyebrow}>{title}</Text>
      <View style={{ rowGap: SPACING.md }}>{children}</View>
    </View>
  );
}

function Subhead({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontFamily: FONTS.semiBold,
        fontSize: 13,
        color: C.textSecondary,
        marginTop: SPACING.sm,
      }}
    >
      {children}
    </Text>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        columnGap: SPACING.sm,
        rowGap: SPACING.sm,
        alignItems: "center",
      }}
    >
      {children}
    </View>
  );
}

const TAG_VARIANTS: TagVariant[] = [
  "brand",
  "success",
  "warning",
  "danger",
  "info",
  "gold",
  "neutral",
];

export default function DevComponentsScreen() {
  const [text, setText] = useState("");
  const [phone, setPhone] = useState("");
  const [errorText, setErrorText] = useState("");

  return (
    <>
      <Stack.Screen
        options={{
          title: "/dev-components",
          headerStyle: { backgroundColor: C.bg },
          headerTitleStyle: { fontFamily: FONTS.semiBold, fontSize: 16, color: C.textPrimary },
        }}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: C.bg }}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxxl * 2 }}
        testID="dev-components-screen"
      >
        <Text style={[TYPO.displayXL, { marginBottom: SPACING.xs }]}>Designsystem</Text>
        <Text style={[TYPO.body, { marginBottom: SPACING.xxxl }]}>
          Reslot primitives — Sprint 1 foundation. Uppdateras allteftersom nya komponenter byggs.
        </Text>

        {/* BUTTON */}
        <Section title="Button">
          <Subhead>Variants (md)</Subhead>
          <Row>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="link">Link</Button>
          </Row>
          <Subhead>Sizes (primary)</Subhead>
          <Row>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </Row>
          <Subhead>States</Subhead>
          <Row>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
          </Row>
          <Subhead>Med ikoner</Subhead>
          <Row>
            <Button leftIcon={<Heart size={16} color={C.dark} />}>Spara</Button>
            <Button rightIcon={<ChevronRight size={16} color={C.dark} />}>Vidare</Button>
          </Row>
        </Section>

        {/* CARD */}
        <Section title="Card">
          <Card variant="flat">
            <Text style={TYPO.h3}>Flat</Text>
            <Text style={TYPO.body}>Bgcard + radius, ingen skugga.</Text>
          </Card>
          <Card variant="raised">
            <Text style={TYPO.h3}>Raised</Text>
            <Text style={TYPO.body}>SHADOW.raised — fristående kort.</Text>
          </Card>
          <Card variant="interactive" onPress={() => {}}>
            <Text style={TYPO.h3}>Interactive</Text>
            <Text style={TYPO.body}>Pressable + scale 0.99 on press.</Text>
          </Card>
        </Section>

        {/* INPUT + FORMFIELD */}
        <Section title="Input + FormField">
          <FormField label="Text">
            <Input value={text} onChangeText={setText} placeholder="Standard text" />
          </FormField>
          <FormField label="Telefonnummer" required helper="Inkl. landskod, t.ex. +46 70 123 45 67">
            <Input variant="phone" value={phone} onChangeText={setPhone} placeholder="+46 ..." />
          </FormField>
          <FormField label="Med fel" error="Detta fält måste fyllas i">
            <Input value={errorText} onChangeText={setErrorText} hasError placeholder="Felfält" />
          </FormField>
          <FormField label="Multiline">
            <Input multiline placeholder="Skriv en längre kommentar..." />
          </FormField>
        </Section>

        {/* TAG */}
        <Section title="Tag">
          <Subhead>Soft (default)</Subhead>
          <Row>
            {TAG_VARIANTS.map((v) => (
              <Tag key={`s-${v}`} variant={v}>
                {v}
              </Tag>
            ))}
          </Row>
          <Subhead>Solid</Subhead>
          <Row>
            {TAG_VARIANTS.map((v) => (
              <Tag key={`o-${v}`} variant={v} appearance="solid">
                {v}
              </Tag>
            ))}
          </Row>
          <Subhead>Uppercase + size sm</Subhead>
          <Row>
            <Tag variant="success" size="sm" uppercase>
              Verifierad
            </Tag>
            <Tag variant="brand" size="sm" uppercase>
              Ikväll
            </Tag>
            <Tag variant="danger" size="sm" uppercase>
              Snart slut
            </Tag>
          </Row>
        </Section>

        {/* LISTITEM */}
        <Section title="ListItem">
          <Card variant="flat" padding="none">
            <ListItem
              leftIcon={<Mail size={ICON.size.md} color={C.pistachio} />}
              title="Email"
              subtitle="william@reslot.se"
              showChevron
              divider
              onPress={() => {}}
            />
            <ListItem
              leftIcon={<Phone size={ICON.size.md} color={C.pistachio} />}
              title="Telefon"
              subtitle="+46 70 123 45 67"
              trailing={
                <Tag variant="success" size="sm">
                  Verifierad
                </Tag>
              }
              divider
              onPress={() => {}}
            />
            <ListItem
              leftIcon={<MapPin size={ICON.size.md} color={C.pistachio} />}
              title="Stad"
              trailing={<Text style={{ fontFamily: FONTS.medium, color: C.textSecondary }}>Stockholm</Text>}
              divider
              onPress={() => {}}
            />
            <ListItem
              leftIcon={<Star size={ICON.size.md} color={C.gold} />}
              title="Premium-medlem"
              subtitle="Inga annonser, prioritet på drops"
              showChevron
              onPress={() => {}}
            />
          </Card>
          <Subhead>Densities</Subhead>
          <Card variant="flat" padding="none">
            <ListItem title="Tight" subtitle="paddingV: SPACING.sm" density="tight" divider />
            <ListItem title="Cozy (default)" subtitle="paddingV: SPACING.md" density="cozy" divider />
            <ListItem title="Comfortable" subtitle="paddingV: SPACING.lg" density="comfortable" />
          </Card>
        </Section>

        <Text style={[TYPO.caption, { textAlign: "center", marginTop: SPACING.lg }]}>
          /dev-components — Sprint 1 (foundation)
        </Text>
      </ScrollView>
    </>
  );
}
