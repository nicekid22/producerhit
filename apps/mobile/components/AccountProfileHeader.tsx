import { useMemo } from "react";

import { StyleSheet, Text, View } from "react-native";

import { PhCard } from "@/components/PhCard";

import { useTheme } from "@/theme/ThemeProvider";

import { spacing } from "@/theme/tokens";



type Props = {

  email?: string | null;

  plan: string;

  loading?: boolean;

};



export function AccountProfileHeader({ email, plan, loading = false }: Props) {

  const { colors, typography, radius } = useTheme();

  const initial = useMemo(() => {

    const e = (email ?? "?").trim();

    return (e[0] ?? "?").toUpperCase();

  }, [email]);



  const isPro = plan.toLowerCase() !== "free";

  const planLabel = plan.toUpperCase();



  return (

    <PhCard elevated style={styles.wrap}>

      <View style={styles.row}>

        <View

          style={[

            styles.avatar,

            {

              backgroundColor: colors.pillActiveBg,

              borderColor: colors.pillActiveText,

              borderRadius: radius.pill,

            },

          ]}

        >

          <Text style={[typography.title, { color: colors.pillActiveText, fontSize: 22 }]}>{initial}</Text>

        </View>

        <View style={styles.meta}>

          <View style={styles.planRow}>

            <View

              style={[

                styles.planPill,

                {

                  backgroundColor: isPro ? colors.accentPrimary : colors.pillActiveBg,

                  borderRadius: radius.pill,

                },

              ]}

            >

              <Text

                style={[

                  typography.micro,

                  { color: isPro ? colors.text : colors.pillActiveText, fontWeight: "700" },

                ]}

              >

                {planLabel}

              </Text>

            </View>

            {isPro ? <View style={[styles.liveDot, { backgroundColor: colors.success }]} /> : null}

          </View>

          <Text style={[typography.subtitle, { color: colors.text, marginTop: 6 }]} numberOfLines={1}>

            {loading ? "…" : email ?? "—"}

          </Text>

        </View>

      </View>

    </PhCard>

  );

}



const styles = StyleSheet.create({

  wrap: { padding: spacing.lg },

  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },

  avatar: {

    width: 56,

    height: 56,

    alignItems: "center",

    justifyContent: "center",

    borderWidth: StyleSheet.hairlineWidth,

  },

  meta: { flex: 1, minWidth: 0 },

  planRow: { flexDirection: "row", alignItems: "center", gap: 6 },

  planPill: { paddingHorizontal: 10, paddingVertical: 4 },

  liveDot: { width: 6, height: 6, borderRadius: 3 },

});

