import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import {
  useRouter,
  useLocalSearchParams,
} from "expo-router";
import { saveExpense } from "../utils/storage";

export default function ConfirmScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    amount: string;
    currency: string;
    category: string;
    description: string;
    location: string;
    date: string;
  }>();

  async function handleSave() {
    const expense = {
      id: Date.now().toString(),
      amount: parseFloat(params.amount),
      currency: params.currency || "VND",
      category: params.category || "Other",
      description: params.description,
      location: params.location || "",
      date: params.date,
    };

    try {
      console.log("💾 Saving expense:", expense);

      await saveExpense(expense);

      console.log("✅ Expense saved successfully");

      router.replace("/history");
    } catch (err) {
      console.error("❌ Save expense error:", err);

      Alert.alert(
        "Error",
        "Could not save the expense. Please try again."
      );
    }
  }

  function handleEdit() {
    router.back();
  }

  function formatAmount(
    amount: string,
    currency: string
  ) {
    const value = Number(amount);

    if (currency === "EUR") {
      return `€${value.toLocaleString()}`;
    }

    if (currency === "USD") {
      return `$${value.toLocaleString()}`;
    }

    return `₫${value.toLocaleString()}`;
  }

  return (
    <View style={styles.container}>
      <View style={styles.phone}>
        <Text style={styles.eyebrow}>
          TRANSACTION
        </Text>

        <Text style={styles.heading}>
          Review your expense
        </Text>

        <Text style={styles.subtitle}>
          Check the details before saving.
        </Text>

        <View style={styles.card}>
          <Row
            label="Amount"
            value={formatAmount(
              params.amount,
              params.currency || "VND"
            )}
            highlight
          />

          <Row
            label="Category"
            value={params.category || "Other"}
          />

          <Row
            label="Description"
            value={params.description || "—"}
          />

          <Row
            label="Location"
            value={params.location || "—"}
          />

          <Row
            label="Date"
            value={params.date || "—"}
          />
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Text style={styles.saveButtonText}>
            Save expense
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEdit}
          activeOpacity={0.75}
        >
          <Text style={styles.editButtonText}>
            ← Edit details
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Row({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>
        {label}
      </Text>

      <Text
        style={[
          styles.rowValue,
          highlight && styles.rowValueHighlight,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6FB",
    alignItems: "center",
  },

  phone: {
    flex: 1,
    width: "100%",
    maxWidth: 430,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingTop: 24,
  },

  eyebrow: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.9,
    color: "#5547FF",
  },

  heading: {
    marginTop: 5,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: "#1F2552",
  },

  subtitle: {
    marginTop: 4,
    marginBottom: 22,
    fontSize: 11,
    color: "#98A2B3",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E9EBF3",
  },

  row: {
    minHeight: 54,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F2F6",
  },

  rowLabel: {
    fontSize: 11,
    color: "#667085",
    fontWeight: "500",
  },

  rowValue: {
    flex: 1,
    marginLeft: 20,
    fontSize: 12,
    color: "#252A45",
    fontWeight: "600",
    textAlign: "right",
  },

  rowValueHighlight: {
    color: "#5547FF",
    fontSize: 18,
    fontWeight: "700",
  },

  saveButton: {
    marginTop: 20,
    height: 46,
    backgroundColor: "#5547FF",
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  editButton: {
    marginTop: 10,
    height: 44,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E1E4EC",
    backgroundColor: "#FFFFFF",
  },

  editButtonText: {
    color: "#667085",
    fontSize: 11,
    fontWeight: "600",
  },
});