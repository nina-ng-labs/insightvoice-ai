import AsyncStorage from "@react-native-async-storage/async-storage";

export type Expense = {
  id: string;
  amount: number;
  currency?: string;
  category: string;
  description: string;
  date: string;
  location: string;
};

const STORAGE_KEY = "expenses";

export async function loadExpenses(): Promise<Expense[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as Expense[];
}

export async function saveExpense(expense: Expense): Promise<void> {
  const existing = await loadExpenses();
  const updated = [expense, ...existing];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
