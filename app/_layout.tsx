import { Stack } from "expo-router";
export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F7F8FC" } }}>
    <Stack.Screen name="index" />
    <Stack.Screen name="history" />
    <Stack.Screen name="analytics" />
    <Stack.Screen name="more" />
    <Stack.Screen name="confirm" />
    <Stack.Screen name="olist" />
    <Stack.Screen name="source" options={{ presentation: "modal" }} />
  </Stack>;
}
