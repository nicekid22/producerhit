import { Component, type ErrorInfo, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PhButton } from "@/components/PhButton";
import { spacing } from "@/theme/tokens";

type Props = {
  children: ReactNode;
  label: string;
  fallbackTitle?: string;
  fallbackBody?: string;
  retryLabel?: string;
  onReset?: () => void;
};

type State = {
  error: Error | null;
};

/**
 * Isolates GL/audio crashes so one section does not take down the whole app.
 */
export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (__DEV__) {
      console.warn(`[SectionErrorBoundary:${this.props.label}]`, error.message, info.componentStack);
    }
  }

  private reset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <View style={styles.fallback}>
          <Text style={styles.title}>{this.props.fallbackTitle ?? "Something went wrong"}</Text>
          <Text style={styles.body}>
            {this.props.fallbackBody ?? "This section could not load. You can retry or keep using the rest of the app."}
          </Text>
          <PhButton label={this.props.retryLabel ?? "Retry"} variant="secondary" onPress={this.reset} style={styles.btn} />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  fallback: {
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#F5EEF8",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  body: {
    color: "rgba(245,238,248,0.55)",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  btn: { marginTop: spacing.sm, alignSelf: "stretch" },
});
