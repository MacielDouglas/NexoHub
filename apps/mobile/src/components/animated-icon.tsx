import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

const DURATION = 600;

interface AnimatedSplashOverlayProps {
  ready: boolean;
}

export function AnimatedSplashOverlay({ ready }: AnimatedSplashOverlayProps) {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);
  const [opacity] = useState(() => new Animated.Value(1));
  const laidOut = useRef(false);

  useEffect(() => {
    if (!animate) return;
    Animated.timing(opacity, {
      toValue: 0,
      duration: DURATION,
      easing: Easing.out(Easing.elastic(0.7)),
      useNativeDriver: true,
    }).start(() => setVisible(false));
  }, [animate, opacity]);

  useEffect(() => {
    if (ready && laidOut.current && !animate) {
      SplashScreen.hideAsync().finally(() => {
        setAnimate(true);
      });
    }
  }, [ready, animate]);

  if (!visible) return null;

  const image = <Image style={styles.image} source={require('@/assets/images/expo-logo.png')} />;

  return animate ? (
    <Animated.View style={[styles.splashOverlay, { opacity }]}>
      {image}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        laidOut.current = true;
        if (ready) {
          SplashScreen.hideAsync().finally(() => {
            setAnimate(true);
          });
        }
      }}
      style={styles.splashOverlay}>
      {image}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: 76,
    height: 71,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#208AEF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});
