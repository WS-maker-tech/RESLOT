import { Link, Stack } from "expo-router";
import { View } from "react-native";
import { Heading } from "@/components/Heading";
import { C } from "@/lib/theme";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Sidan hittades inte" }} />
      <View
        testID="not-found-screen"
        style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20, backgroundColor: C.cream }}
      >
        <Heading variant="eyebrow" tone="inkSoft" align="center" style={{ marginBottom: 6 }}>
          404
        </Heading>
        <Heading variant="display" tone="ink" align="center">
          {`*Hicka*.`}
        </Heading>
        <Heading variant="h3" tone="inkSoft" align="center" style={{ marginTop: 12 }}>
          Sidan finns inte längre.
        </Heading>
        <Link href="/" testID="go-home-link" style={{ marginTop: 32 }}>
          <Heading variant="h3" tone="forest">Tillbaka till hem</Heading>
        </Link>
      </View>
    </>
  );
}
