import React, { useMemo } from "react";
import { View, Text, ScrollView, Pressable, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { C, FONTS, SPACING, RADIUS } from "@/lib/theme";
import { LAST_UPDATED } from "@/lib/legal-content";

type MarkdownNode =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "divider" }
  | { type: "list-item"; text: string }
  | { type: "table-header"; cells: string[] }
  | { type: "table-row"; cells: string[] };

function parseMarkdown(content: string): MarkdownNode[] {
  const lines = content.split("\n");
  const nodes: MarkdownNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) continue;
    if (trimmed === "---") {
      nodes.push({ type: "divider" });
      continue;
    }
    if (trimmed.startsWith("### ")) {
      nodes.push({ type: "h3", text: trimmed.slice(4) });
      continue;
    }
    if (trimmed.startsWith("## ")) {
      nodes.push({ type: "h2", text: trimmed.slice(3) });
      continue;
    }
    if (trimmed.startsWith("# ")) {
      nodes.push({ type: "h1", text: trimmed.slice(2) });
      continue;
    }
    if (trimmed.startsWith("- ")) {
      nodes.push({ type: "list-item", text: trimmed.slice(2) });
      continue;
    }
    // Table separator row
    if (/^\|[-|\s]+\|$/.test(trimmed)) continue;
    // Table rows
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const cells = trimmed
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      const prev = nodes[nodes.length - 1];
      if (prev && (prev.type === "table-header" || prev.type === "table-row")) {
        nodes.push({ type: "table-row", cells });
      } else {
        nodes.push({ type: "table-header", cells });
      }
      continue;
    }
    nodes.push({ type: "paragraph", text: trimmed });
  }

  return nodes;
}

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text
      style={{
        fontFamily: FONTS.regular,
        fontSize: 14,
        lineHeight: 22,
        color: C.textSecondary,
      }}
    >
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <Text
              key={i}
              style={{ fontFamily: FONTS.semiBold, color: C.textPrimary }}
            >
              {part.slice(2, -2)}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

function MarkdownRenderer({ content }: { content: string }) {
  const nodes = useMemo(() => parseMarkdown(content), [content]);

  return (
    <>
      {nodes.map((node, i) => {
        switch (node.type) {
          case "h1":
            return (
              <Text
                key={i}
                style={{
                  fontFamily: FONTS.displayBold,
                  fontSize: 22,
                  color: C.textPrimary,
                  letterSpacing: -0.5,
                  marginTop: i === 0 ? 0 : 24,
                  marginBottom: 8,
                }}
              >
                {node.text}
              </Text>
            );
          case "h2":
            return (
              <Text
                key={i}
                style={{
                  fontFamily: FONTS.displayBold,
                  fontSize: 17,
                  color: C.textPrimary,
                  letterSpacing: -0.3,
                  marginTop: 20,
                  marginBottom: 6,
                }}
              >
                {node.text}
              </Text>
            );
          case "h3":
            return (
              <Text
                key={i}
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: 15,
                  color: C.textPrimary,
                  letterSpacing: -0.2,
                  marginTop: 14,
                  marginBottom: 4,
                }}
              >
                {node.text}
              </Text>
            );
          case "divider":
            return (
              <View
                key={i}
                style={{
                  height: 1,
                  backgroundColor: C.divider,
                  marginVertical: 16,
                }}
              />
            );
          case "list-item":
            return (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  paddingLeft: 4,
                  marginBottom: 4,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.regular,
                    fontSize: 14,
                    color: C.textTertiary,
                    marginRight: 8,
                    lineHeight: 22,
                  }}
                >
                  {"\u2022"}
                </Text>
                <View style={{ flex: 1 }}>
                  <RichText text={node.text} />
                </View>
              </View>
            );
          case "table-header":
            return (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  backgroundColor: "rgba(0,0,0,0.03)",
                  borderRadius: 8,
                  padding: 10,
                  marginTop: 8,
                  gap: 8,
                }}
              >
                {node.cells.map((cell, ci) => (
                  <Text
                    key={ci}
                    style={{
                      flex: 1,
                      fontFamily: FONTS.semiBold,
                      fontSize: 12,
                      color: C.textPrimary,
                      letterSpacing: 0.2,
                    }}
                    numberOfLines={2}
                  >
                    {cell}
                  </Text>
                ))}
              </View>
            );
          case "table-row":
            return (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderBottomWidth: 0.5,
                  borderBottomColor: C.divider,
                  gap: 8,
                }}
              >
                {node.cells.map((cell, ci) => (
                  <Text
                    key={ci}
                    style={{
                      flex: 1,
                      fontFamily: FONTS.regular,
                      fontSize: 12,
                      color: C.textSecondary,
                      lineHeight: 18,
                    }}
                  >
                    {cell}
                  </Text>
                ))}
              </View>
            );
          case "paragraph":
            return (
              <View key={i} style={{ marginBottom: 6 }}>
                <RichText text={node.text} />
              </View>
            );
          default:
            return null;
        }
      })}
    </>
  );
}

interface LegalModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

export function LegalModal({ visible, onClose, title, content }: LegalModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={{ flex: 1, backgroundColor: C.bg }}
        edges={["top", "bottom"]}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.md,
            borderBottomWidth: 0.5,
            borderBottomColor: C.divider,
            backgroundColor: C.bg,
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.displayBold,
              fontSize: 18,
              color: C.textPrimary,
              letterSpacing: -0.3,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Pressable
            testID="legal-modal-close"
            accessibilityLabel="Stäng"
            onPress={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: C.overlayLight,
              alignItems: "center",
              justifyContent: "center",
              marginLeft: SPACING.sm,
            }}
          >
            <X size={18} color={C.textSecondary} strokeWidth={2.5} />
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: SPACING.lg,
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          <MarkdownRenderer content={content} />

          {/* Last updated footer */}
          <View
            style={{
              marginTop: 28,
              paddingTop: 16,
              borderTopWidth: 0.5,
              borderTopColor: C.divider,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.medium,
                fontSize: 12,
                color: C.textTertiary,
                letterSpacing: 0.2,
              }}
            >
              Senast uppdaterad: {LAST_UPDATED}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
