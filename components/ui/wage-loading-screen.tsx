import React, { useEffect, useRef } from "react";
import {
  View,
  Animated,
  StyleSheet,
  Dimensions,
} from "react-native";
import { WageLogo } from "./wage-logo";

const { width } = Dimensions.get("window");

interface WageLoadingScreenProps {
  onFinish?: () => void;
  minDurationMs?: number;
}

/**
 * Minimalist Loading Screen for Wage
 * Pure, clean, and unadorned.
 */
export function WageLoadingScreen({
  onFinish,
  minDurationMs = 900,
}: WageLoadingScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Subtle fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();

    // Minimal progress bar
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: minDurationMs,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && onFinish) {
        onFinish();
      }
    });
  }, [fadeAnim, progressAnim, minDurationMs, onFinish]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.center}>
        {/* Exact Logo as provided */}
        <WageLogo size={150} />

        {/* Minimalist hairline progress indicator */}
        <View style={styles.track}>
          <Animated.View style={[styles.bar, { width: progressWidth }]} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  track: {
    width: Math.min(width * 0.35, 120),
    height: 2,
    backgroundColor: "#F0EFEA",
    borderRadius: 1,
    overflow: "hidden",
    marginTop: 28,
  },
  bar: {
    height: "100%",
    backgroundColor: "#FFBD59",
    borderRadius: 1,
  },
});
