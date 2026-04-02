import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={22} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}
    >


         <Tabs.Screen
        name="tab1"
        options={{
          title: 'Information',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon 
              name={focused ? "info-circle" : "info-circle"} 
              color={color} 
            />
          ),
        }}
      />
            <Tabs.Screen
        name="tab2"
        options={{
          title: 'Compare Schools',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon 
              name={focused ? "balance-scale" : "balance-scale"} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="login"
        options={{
          title: 'login',
          href: null,
        }}
      />
      <Tabs.Screen
        name="register"
        options={{
          title: 'Register',
          href: null,
        }}
      />
       <Tabs.Screen 
        name="school/[id]" 
        options={{
          title: 'School Details',
          href: null
        }}
      />
    </Tabs>
  );
}