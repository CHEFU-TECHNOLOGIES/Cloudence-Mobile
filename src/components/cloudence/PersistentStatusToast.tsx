import React, { useCallback, useEffect, useRef, useState } from "react";
import type { GestureResponderHandlers } from "react-native";
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { RefreshCw } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../constants/theme";

type Props = {
  message: string;
  isError: boolean;
  onRetry?: () => void;
};

export default function PersistentStatusToast({
  message,
  isError,
  onRetry,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [translation] = useState(() => new Animated.ValueXY());
  const [panHandlers, setPanHandlers] = useState<GestureResponderHandlers>({});
  const positionRef = useRef({ x: 0, y: 0 });
  const gestureStartRef = useRef({ x: 0, y: 0 });
  const toastSizeRef = useRef({ width: 0, height: 0 });
  const boundsRef = useRef({ minX: 0, maxX: 0, minY: 0, maxY: 0 });
  const bottomOffset = Math.max(insets.bottom, 12) + 8;

  const updateBounds = useCallback(() => {
    const { width, height } = toastSizeRef.current;
    if (!width || !height) return;

    const left = (screenWidth - width) / 2;
    const top = screenHeight - bottomOffset - height;
    boundsRef.current = {
      minX: 12 - left,
      maxX: screenWidth - 12 - left - width,
      minY: insets.top + 8 - top,
      maxY: screenHeight - insets.bottom - top - height,
    };
    positionRef.current = {
      x: clamp(positionRef.current.x, boundsRef.current.minX, boundsRef.current.maxX),
      y: clamp(positionRef.current.y, boundsRef.current.minY, boundsRef.current.maxY),
    };
    translation.setValue(positionRef.current);
  }, [bottomOffset, insets.bottom, insets.top, screenHeight, screenWidth, translation]);

  useEffect(() => {
    updateBounds();
  }, [updateBounds]);

  useEffect(() => {
    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          gestureStartRef.current = { ...positionRef.current };
        },
        onPanResponderMove: (_event, gesture) => {
          const bounds = boundsRef.current;
          const nextPosition = {
            x: clamp(
              gestureStartRef.current.x + gesture.dx,
              bounds.minX,
              bounds.maxX,
            ),
            y: clamp(
              gestureStartRef.current.y + gesture.dy,
              bounds.minY,
              bounds.maxY,
            ),
          };
          positionRef.current = nextPosition;
          translation.setValue(nextPosition);
        },
        onPanResponderTerminationRequest: () => false,
      });
    setPanHandlers(panResponder.panHandlers);
  }, [translation]);

  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      animationType="none"
      presentationStyle="overFullScreen"
      onRequestClose={() => {}}
    >
      <View pointerEvents="box-none" style={styles.modalFill}>
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.position,
            { bottom: bottomOffset },
            { transform: translation.getTranslateTransform() },
          ]}
        >
          <View
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              toastSizeRef.current = { width, height };
              updateBounds();
            }}
            accessibilityRole={isError ? "alert" : "summary"}
            style={[styles.container, isError && styles.errorContainer]}
          >
            <View
              {...panHandlers}
              accessibilityRole="button"
              accessibilityLabel="Move status message"
              accessibilityHint="Drag to move this status message"
              style={styles.dragHandleTouchArea}
            >
              <View style={styles.dragHandle} />
            </View>
            <View style={styles.contentRow}>
              <View style={[styles.statusMark, isError && styles.errorMark]} />
              <Text
                numberOfLines={2}
                style={[styles.message, isError && styles.errorMessage]}
              >
                {message}
              </Text>
              {isError && onRetry && (
                <Pressable
                  onPress={onRetry}
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading workspace"
                  style={({ pressed }) => [
                    styles.retryButton,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <RefreshCw size={14} color={theme.colors.brand} />
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              )}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalFill: { flex: 1 },
  position: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1000,
    elevation: 20,
    paddingHorizontal: 14,
  },
  container: {
    width: "100%",
    maxWidth: 520,
    minHeight: 54,
    paddingHorizontal: 12,
    paddingTop: 2,
    paddingBottom: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "#172B4D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  dragHandleTouchArea: {
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dragHandle: {
    width: 34,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#AAB8BA",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  errorContainer: {
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  statusMark: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.brand,
  },
  errorMark: { backgroundColor: theme.colors.error },
  message: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.secondaryText,
    fontSize: 11,
    lineHeight: 15,
  },
  errorMessage: { color: theme.colors.error },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    paddingVertical: 5,
  },
  retryText: {
    color: theme.colors.brand,
    fontSize: 12,
    fontWeight: "700",
  },
});

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
