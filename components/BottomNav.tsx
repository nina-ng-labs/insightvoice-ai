import { usePathname, useRouter } from "expo-router";
import {
  View,
  Text,
  Pressable,
} from "react-native";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const items = [
    {
      label: "Home",
      path: "/",
    },
    {
      label: "Transactions",
      path: "/history",
    },
    {
      label: "Analytics",
      path: "/analytics",
    },
    {
      label: "More",
      path: "/more",
    },
  ] as const;

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
        paddingTop: 9,
        paddingBottom: 12,
      }}
    >
      {items.map((item) => {
        const active =
          item.path === "/"
            ? pathname === "/"
            : pathname.startsWith(item.path);

        return (
          <Pressable
            key={item.label}
            onPress={() => router.push(item.path as any)}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 6,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: active ? "800" : "600",
                color: active
                  ? "#4F46E5"
                  : "#9CA3AF",
              }}
            >
              {item.label}
            </Text>

            {active && (
              <View
                style={{
                  marginTop: 5,
                  width: 5,
                  height: 5,
                  borderRadius: 999,
                  backgroundColor: "#4F46E5",
                }}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}