import React, { useEffect, useState } from 'react';
import Gradient from '@/assets/icons/Gradient';
import Logo from '@/assets/icons/Logo';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import { Animated } from 'react-native';

export default function Welcome() {
  const router = useRouter();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.5));

  useEffect(() => {
   
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

   
    const timer = setTimeout(() => {
     
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => {
        router.push('/tabs/tab1');
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Box className="flex-1 items-center justify-center bg-white">
      
      <Box className="absolute h-[1200px] w-[600px]">
        <Gradient />
      </Box>

      
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          alignItems: 'center',
        }}
      >
        
        <Box className="mb-8">
          <Logo width={200} height={400} />
        </Box>

        
        <Text className="text-5xl font-bold text-primary-500 mb-4">
          Welcome
        </Text>
        
        <Text className="text-xl text-foreground">
          Welcome to the school information inquiry system
        </Text>

        
       
      </Animated.View>
    </Box>
  );
}