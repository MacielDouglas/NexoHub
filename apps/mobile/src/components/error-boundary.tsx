import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "./themed-text";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error.message, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ThemedText type="title">Algo deu errado</ThemedText>
          <ThemedText type="default" style={styles.message}>
            {this.state.error?.message ?? "Erro desconhecido"}
          </ThemedText>
          <ThemedText
            type="small"
            style={styles.hint}
          >
            Reinicie o aplicativo.
          </ThemedText>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  message: {
    marginTop: 12,
    textAlign: "center",
    color: "#666",
  },
  hint: {
    marginTop: 8,
    textAlign: "center",
    color: "#999",
  },
});
