import { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

type Source = "personal" | "olist";

export default function SourceScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const [selected, setSelected] = useState<Source>(from === "olist" ? "olist" : "personal");

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.sheet}>
        <Text style={styles.title}>Select Data Source</Text>
        <Text style={styles.subtitle}>Choose what you want to explore.</Text>
        <Pressable accessibilityRole="radio" accessibilityState={{ selected: selected === "personal" }} style={[styles.option, selected === "personal" && styles.selected]} onPress={() => setSelected("personal")}>
          <View style={styles.icon}><Ionicons name="person" size={20} color="#4F46E5" /></View>
          <View style={styles.copy}><Text style={styles.name}>My Transactions</Text><Text style={styles.detail}>Your personal spending, voice, receipt, manual</Text></View>
          <Ionicons name={selected === "personal" ? "checkmark-circle" : "ellipse-outline"} size={22} color="#4F46E5" />
        </Pressable>
        <Pressable accessibilityRole="radio" accessibilityState={{ selected: selected === "olist" }} style={[styles.option, selected === "olist" && styles.selected]} onPress={() => setSelected("olist")}>
          <View style={styles.icon}><Ionicons name="bar-chart" size={20} color="#4F46E5" /></View>
          <View style={styles.copy}><Text style={styles.name}>Olist E-commerce (Demo)</Text><Text style={styles.detail}>Brazilian e-commerce dataset (2016–2018)</Text></View>
          <Ionicons name={selected === "olist" ? "checkmark-circle" : "ellipse-outline"} size={22} color="#4F46E5" />
        </Pressable>
        <Pressable style={styles.continue} onPress={() => router.replace(selected === "personal" ? "/" : "/olist")}><Text style={styles.continueText}>Continue</Text></Pressable>
        <Pressable style={styles.cancel} onPress={() => router.back()}><Text style={styles.cancelText}>Cancel</Text></Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F5F6FD", justifyContent: "center", padding: 20 },
  sheet: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 22, maxWidth: 440, width: "100%", alignSelf: "center", shadowColor: "#161B46", shadowOpacity: 0.12, shadowRadius: 18, elevation: 5 },
  title: { color: "#171B42", fontSize: 22, fontWeight: "800", textAlign: "center", marginBottom: 6 },
  subtitle: { color: "#69718B", fontSize: 13, textAlign: "center", marginBottom: 22 },
  option: { minHeight: 80, borderWidth: 1, borderColor: "#E4E7F3", borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 11 },
  selected: { backgroundColor: "#F6F5FF", borderColor: "#6D63FF" },
  icon: { width: 38, height: 38, borderRadius: 10, backgroundColor: "#EEECFF", alignItems: "center", justifyContent: "center" },
  copy: { flex: 1 },
  name: { fontWeight: "700", fontSize: 14, color: "#171B42" },
  detail: { fontSize: 11, lineHeight: 16, color: "#69718B", marginTop: 3 },
  continue: { backgroundColor: "#4F46E5", borderRadius: 10, minHeight: 46, alignItems: "center", justifyContent: "center", marginTop: 22 },
  continueText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  cancel: { alignItems: "center", padding: 11 },
  cancelText: { color: "#69718B", fontSize: 13 },
});
