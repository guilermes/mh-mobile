import { Tabs } from 'expo-router';
import { BottomTabBar } from '../../components/BottomTabBar';

/** A ordem das telas define a posição na barra (Simular frete fica no centro). */
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="anuncios" />
      <Tabs.Screen name="simular-frete" />
      <Tabs.Screen name="insights" />
      <Tabs.Screen name="configuracoes" />
    </Tabs>
  );
}