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
import { ChevronRight, Heart, Inbox, Mail, MapPin, Phone, Star } from "lucide-react-native";

import {
  Avatar,
  AvatarGroup,
  Button,
  Card,
  Chip,
  CountdownPill,
  Divider,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  ListItem,
  Rating,
  Stepper,
  Tabs,
  Tag,
  Toast,
  type TabItem,
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

type DemoTabKey = "alla" | "aktiva" | "klara";

export default function DevComponentsScreen() {
  const [text, setText] = useState("");
  const [phone, setPhone] = useState("");
  const [errorText, setErrorText] = useState("");
  const [demoRating, setDemoRating] = useState(4);
  const [demoChip, setDemoChip] = useState(true);
  const [demoTab, setDemoTab] = useState<DemoTabKey>("alla");
  const [toastVisible, setToastVisible] = useState(false);

  const demoTabs: TabItem<DemoTabKey>[] = [
    { key: "alla", label: "Alla", badge: 24 },
    { key: "aktiva", label: "Aktiva", badge: 3 },
    { key: "klara", label: "Klara" },
  ];

  // Mock-tider för CountdownPill demo
  const inOneHour = new Date(Date.now() + 60 * 60 * 1000);
  const inFifteenMin = new Date(Date.now() + 15 * 60 * 1000);
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

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

        {/* SPRINT 6 PRIMITIVES */}

        <Section title="Avatar (Sprint 6)">
          <Subhead>Sizes</Subhead>
          <Row>
            <Avatar size="xs" name="William Svanqvist" />
            <Avatar size="sm" name="William Svanqvist" />
            <Avatar size="md" name="William Svanqvist" />
            <Avatar size="lg" name="William Svanqvist" />
            <Avatar size="xl" name="William Svanqvist" />
          </Row>
          <Subhead>Med bild + bordered</Subhead>
          <Row>
            <Avatar
              size="lg"
              source="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200"
              bordered
            />
            <Avatar size="lg" name="Anna Andersson" bordered />
          </Row>
          <Subhead>AvatarGroup</Subhead>
          <AvatarGroup
            size="md"
            avatars={[
              { name: "William" },
              { name: "Anna" },
              { name: "Bob" },
              { name: "Carla" },
              { name: "David" },
              { name: "Eva" },
            ]}
            max={4}
          />
        </Section>

        <Section title="Tabs (Sprint 6)">
          <Tabs items={demoTabs} active={demoTab} onChange={setDemoTab} />
          <Text style={TYPO.body}>Aktiv: {demoTab}</Text>
        </Section>

        <Section title="Chip (Sprint 6)">
          <Subhead>Toggle</Subhead>
          <Row>
            <Chip
              label="Stockholm"
              selected={demoChip}
              onToggle={setDemoChip}
              showCheckWhenSelected
            />
            <Chip label="Göteborg" selected={false} onToggle={() => {}} />
            <Chip label="Malmö" selected={false} onToggle={() => {}} />
          </Row>
          <Subhead>Removable</Subhead>
          <Row>
            <Chip label="Italienskt" selected removable onRemove={() => {}} />
            <Chip label="Sushi" selected removable onRemove={() => {}} />
          </Row>
        </Section>

        <Section title="CountdownPill (Sprint 6)">
          <Subhead>Olika tids-stadier</Subhead>
          <Row>
            <CountdownPill targetAt={inOneHour} />
            <CountdownPill targetAt={inFifteenMin} prefix="Försvinner om" />
            <CountdownPill targetAt={fiveMinAgo} prefix="Tagen för" />
          </Row>
        </Section>

        <Section title="Rating (Sprint 6)">
          <Subhead>Display med numeric</Subhead>
          <Rating value={4.6} showNumeric />
          <Subhead>Interaktiv (klickbara stjärnor)</Subhead>
          <Rating value={demoRating} onChange={setDemoRating} starSize={28} />
          <Text style={TYPO.body}>Vald: {demoRating}/5</Text>
        </Section>

        <Section title="Stepper (Sprint 6)">
          <Stepper current={2} total={6} showLabel size="md" />
          <Stepper current={4} total={6} showLabel size="sm" />
        </Section>

        <Section title="Divider (Sprint 6)">
          <Card variant="flat" padding="md">
            <Text style={TYPO.body}>Hairline (default)</Text>
            <Divider variant="hairline" spacingY="sm" />
            <Text style={TYPO.body}>Thin 1px</Text>
            <Divider variant="thin" spacingY="sm" />
            <Text style={TYPO.body}>Med label</Text>
            <Divider variant="thin" label="eller" spacingY="md" />
            <Text style={TYPO.body}>(Section = whitespace separator, syns ej här)</Text>
          </Card>
        </Section>

        <Section title="EmptyState (Sprint 6)">
          <Card variant="flat" padding="none">
            <EmptyState
              icon={<Inbox size={36} color={C.pistachio} strokeWidth={ICON.strokeWidth} />}
              title="Inga bokningar än"
              body="När du lägger upp eller övertar en bokning visas den här."
              cta={{ label: "Lägg upp bokning", onPress: () => {} }}
              secondaryCta={{ label: "Läs mer", onPress: () => {} }}
            />
          </Card>
        </Section>

        <Section title="ErrorState (Sprint 6)">
          <Card variant="flat" padding="none">
            <ErrorState variant="network" onRetry={() => {}} />
          </Card>
        </Section>

        <Section title="Toast (Sprint 6)">
          <Row>
            <Button onPress={() => setToastVisible(true)}>Visa toast</Button>
          </Row>
          <Toast
            visible={toastVisible}
            variant="success"
            message="Bokning sparad"
            detail="Vi skickar en bekräftelse till din e-post."
            onDismiss={() => setToastVisible(false)}
            position="bottom"
            duration={3500}
          />
        </Section>

        <Text style={[TYPO.caption, { textAlign: "center", marginTop: SPACING.lg }]}>
          /dev-components — Sprint 1 + Sprint 6 (17 primitives totalt)
        </Text>
      </ScrollView>
    </>
  );
}
