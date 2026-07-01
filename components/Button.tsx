import React, { useState } from "react";
import {
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  View,
  Animated,
  GestureResponderEvent,
} from "react-native";

interface ButtonProps {
  title?: string;
  onPress?: (event: GestureResponderEvent) => void;
  color?: string;
}

export default function Button({
  title = "Start Lesson",
  onPress,
  color = "#6366f1",
}: ButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const animatedValue = new Animated.Value(0);

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(animatedValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    setIsPressed(false);
    Animated.spring(animatedValue, {
      toValue: 0,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();

    if (onPress) {
      onPress(event);
    }
  };

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 4], // Pressed state moves down 4 units
  });

  const shadowElevation = isPressed ? 2 : 6;

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.button,
          {
            backgroundColor: color,
            transform: [{ translateY }],
            elevation: shadowElevation,
          },
        ]}
      >
        <Text style={styles.text}>{title}</Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#6366f1",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
  },

  text: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
});
