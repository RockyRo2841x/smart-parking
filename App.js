import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import BigLotScreen from "./screens/BigLotScreen";
import HomeScreen from "./screens/HomeScreen";
import SmallLotScreen from "./screens/SmallLotScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="SmallLot" component={SmallLotScreen} />
        <Stack.Screen name="BigLot" component={BigLotScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
