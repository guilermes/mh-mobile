import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabBar } from '../components/BottomTabBar';
import { HomeScreen } from '../screens/Homescreen';
import {
  AnunciosScreen,
  ConfiguracoesScreen,
  InsightsScreen,
  SimularFreteScreen,
} from '../screens/PlaceholderScreen';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

/** Navegação exibida após o login. A ordem define a posição na barra. */
export function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Anuncios" component={AnunciosScreen} />
      <Tab.Screen name="SimularFrete" component={SimularFreteScreen} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="Configuracoes" component={ConfiguracoesScreen} />
    </Tab.Navigator>
  );
}