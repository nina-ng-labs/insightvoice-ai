import { useCallback, useMemo, useState } from "react";

import {

  View,

  Text,

  ScrollView,

  Pressable,

  StyleSheet,

  Modal,

  TextInput,

  Alert,

} from "react-native";

import { useFocusEffect, useRouter } from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import AsyncStorage from "@react-native-async-storage/async-storage";



import { loadExpenses, Expense } from "../utils/storage";



type Currency = "VND" | "USD" | "EUR";

type Period = "Week" | "Month" | "Year";



type SavingGoal = {

  title: string;

  target: number;

  saved: number;

  deadline: string;

  currency: Currency;

  icon: string;

};



const C = {

  outside: "#F4F6FB",

  white: "#FFFFFF",

  navy: "#1F2552",

  text: "#252A45",

  secondary: "#667085",

  muted: "#98A2B3",

  purple: "#5547FF",

  purpleLight: "#F1EFFF",

  purpleSoft: "#F7F6FF",

  purpleBorder: "#DDD9FF",

  line: "#E9EBF3",

  green: "#159A76",

  red: "#D95C5C",

};



const CURRENCIES: Currency[] = ["VND", "USD", "EUR"];

const PERIODS: Period[] = ["Week", "Month", "Year"];



const CATEGORIES = [

  "Food",

  "Transport",

  "Shopping",

  "Bills & Utilities",

  "Other",

];



const CATEGORY_META: Record<string, any> = {

  Food: {

    icon: "restaurant",

    bg: "#FFF1EE",

    color: "#E76F51",

  },

  Transport: {

    icon: "car",

    bg: "#EEF7FF",

    color: "#2585E8",

  },

  Shopping: {

    icon: "bag-handle",

    bg: "#F4EEFF",

    color: "#805AD5",

  },

  "Bills & Utilities": {

    icon: "receipt",

    bg: "#EAF9F5",

    color: "#0B9B82",

  },

  Other: {

    icon: "wallet",

    bg: "#F2F3F7",

    color: "#69708B",

  },

};



const GOAL_PRESETS = [

  { title: "Travel", icon: "airplane" },

  { title: "Study", icon: "school" },

  { title: "Tech", icon: "laptop" },

  { title: "Fashion", icon: "shirt" },

  { title: "Emergency", icon: "shield-checkmark" },

];



const GOAL_KEY = "insightvoice_saving_goal";



function expenseCurrency(expense: Expense): Currency {

  const value = (expense.currency || "VND").toUpperCase();



  if (value === "USD") return "USD";

  if (value === "EUR") return "EUR";



  return "VND";

}



function expenseCategory(expense: Expense) {

  let category = expense.category || "Other";



  if (category === "Bills") {

    category = "Bills & Utilities";

  }



  return CATEGORIES.includes(category) ? category : "Other";

}



function money(amount: number, currency: Currency) {

  if (currency === "VND") {

    return `₫${Math.round(amount).toLocaleString("en-US")}`;

  }



  if (currency === "USD") {

    return `$${amount.toLocaleString("en-US", {

      maximumFractionDigits: 2,

    })}`;

  }



  return `€${amount.toLocaleString("en-US", {

    maximumFractionDigits: 2,

  })}`;

}



function compactMoney(amount: number, currency: Currency) {

  if (currency !== "VND") {

    return money(amount, currency);

  }



  if (amount >= 1000000) {

    const value = amount / 1000000;



    return `₫${value.toFixed(value >= 10 ? 0 : 1)}M`;

  }



  if (amount >= 1000) {

    return `₫${Math.round(amount / 1000)}K`;

  }



  return `₫${Math.round(amount)}`;

}



function parseDate(value: string) {

  const parts = value?.split("-");



  if (!parts || parts.length !== 3) return null;



  const date = new Date(

    Number(parts[0]),

    Number(parts[1]) - 1,

    Number(parts[2])

  );



  date.setHours(0, 0, 0, 0);



  return Number.isNaN(date.getTime()) ? null : date;

}



function inside(value: string, start: Date, end: Date) {

  const date = parseDate(value);



  if (!date) return false;



  return date >= start && date <= end;

}



function ranges(period: Period) {

  const now = new Date();



  const today = new Date(

    now.getFullYear(),

    now.getMonth(),

    now.getDate()

  );



  if (period === "Week") {

    const currentStart = new Date(today);

    currentStart.setDate(today.getDate() - 6);



    const previousEnd = new Date(currentStart);

    previousEnd.setDate(previousEnd.getDate() - 1);



    const previousStart = new Date(previousEnd);

    previousStart.setDate(previousEnd.getDate() - 6);



    return {

      currentStart,

      currentEnd: today,

      previousStart,

      previousEnd,

    };

  }



  if (period === "Month") {

    const currentStart = new Date(

      today.getFullYear(),

      today.getMonth(),

      1

    );



    const previousStart = new Date(

      today.getFullYear(),

      today.getMonth() - 1,

      1

    );



    const previousMonthDays = new Date(

      today.getFullYear(),

      today.getMonth(),

      0

    ).getDate();



    const previousEnd = new Date(

      previousStart.getFullYear(),

      previousStart.getMonth(),

      Math.min(today.getDate(), previousMonthDays)

    );



    return {

      currentStart,

      currentEnd: today,

      previousStart,

      previousEnd,

    };

  }



  return {

    currentStart: new Date(today.getFullYear(), 0, 1),

    currentEnd: today,



    previousStart: new Date(

      today.getFullYear() - 1,

      0,

      1

    ),



    previousEnd: new Date(

      today.getFullYear() - 1,

      today.getMonth(),

      today.getDate()

    ),

  };

}



function monthsUntil(value: string) {

  const deadline = parseDate(value);



  if (!deadline) return 0;



  const now = new Date();



  const months =

    (deadline.getFullYear() - now.getFullYear()) * 12 +

    deadline.getMonth() -

    now.getMonth();



  return Math.max(1, months);

}



export default function AnalyticsScreen() {

  const router = useRouter();



  const [expenses, setExpenses] = useState<Expense[]>([]);



  const [currency, setCurrency] =

    useState<Currency>("VND");



  const [period, setPeriod] =

    useState<Period>("Month");



  const [goal, setGoal] =

    useState<SavingGoal | null>(null);



  const [goalModal, setGoalModal] = useState(false);



  const [goalTitle, setGoalTitle] = useState("");

  const [goalTarget, setGoalTarget] = useState("");

  const [goalSaved, setGoalSaved] = useState("");

  const [goalDeadline, setGoalDeadline] = useState("");

  const [goalIcon, setGoalIcon] = useState("airplane");



  useFocusEffect(

    useCallback(() => {

      async function load() {

        try {

          const [data, storedGoal] = await Promise.all([

            loadExpenses(),

            AsyncStorage.getItem(GOAL_KEY),

          ]);



          setExpenses(data);



          if (storedGoal) {

            setGoal(JSON.parse(storedGoal));

          }

        } catch (error) {

          console.error("Analytics load error:", error);

        }

      }



      void load();

    }, [])

  );



  const dateRanges = useMemo(

    () => ranges(period),

    [period]

  );



  const current = useMemo(() => {

    return expenses.filter(

      (expense) =>

        expenseCurrency(expense) === currency &&

        inside(

          expense.date,

          dateRanges.currentStart,

          dateRanges.currentEnd

        )

    );

  }, [expenses, currency, dateRanges]);



  const previous = useMemo(() => {

    return expenses.filter(

      (expense) =>

        expenseCurrency(expense) === currency &&

        inside(

          expense.date,

          dateRanges.previousStart,

          dateRanges.previousEnd

        )

    );

  }, [expenses, currency, dateRanges]);



  const total = useMemo(

    () =>

      current.reduce(

        (sum, item) => sum + (Number(item.amount) || 0),

        0

      ),

    [current]

  );



  const previousTotal = useMemo(

    () =>

      previous.reduce(

        (sum, item) => sum + (Number(item.amount) || 0),

        0

      ),

    [previous]

  );



  const totalChange =

    previousTotal > 0

      ? ((total - previousTotal) / previousTotal) * 100

      : null;



  const categoryData = useMemo(() => {

    return CATEGORIES.map((category) => {

      const currentAmount = current

        .filter(

          (item) =>

            expenseCategory(item) === category

        )

        .reduce(

          (sum, item) =>

            sum + (Number(item.amount) || 0),

          0

        );



      const previousAmount = previous

        .filter(

          (item) =>

            expenseCategory(item) === category

        )

        .reduce(

          (sum, item) =>

            sum + (Number(item.amount) || 0),

          0

        );



      return {

        category,

        current: currentAmount,

        previous: previousAmount,

        difference: currentAmount - previousAmount,

      };

    });

  }, [current, previous]);



  const changes = useMemo(() => {

    return [...categoryData]

      .filter((item) => item.difference !== 0)

      .sort(

        (a, b) =>

          Math.abs(b.difference) -

          Math.abs(a.difference)

      )

      .slice(0, 3);

  }, [categoryData]);



  const biggestIncrease = useMemo(() => {

    return [...categoryData]

      .filter((item) => item.difference > 0)

      .sort(

        (a, b) => b.difference - a.difference

      )[0];

  }, [categoryData]);



  const biggestDecrease = useMemo(() => {

    return [...categoryData]

      .filter((item) => item.difference < 0)

      .sort(

        (a, b) => a.difference - b.difference

      )[0];

  }, [categoryData]);



  const activeGoal =

    goal && goal.currency === currency ? goal : null;



  const goalRemaining = activeGoal

    ? Math.max(

        activeGoal.target - activeGoal.saved,

        0

      )

    : 0;



  const goalProgress =

    activeGoal && activeGoal.target > 0

      ? Math.min(

          (activeGoal.saved / activeGoal.target) * 100,

          100

        )

      : 0;



  const goalMonths = activeGoal

    ? monthsUntil(activeGoal.deadline)

    : 0;



  const monthlyGoal =

    activeGoal && goalMonths > 0

      ? goalRemaining / goalMonths

      : 0;



  function comparisonText() {

    if (totalChange === null) {

      return "Not enough previous data yet";

    }



    if (Math.abs(totalChange) < 1) {

      return `About the same as previous ${period.toLowerCase()}`;

    }



    return `${totalChange > 0 ? "↑" : "↓"} ${Math.abs(

      totalChange

    ).toFixed(0)}% vs previous ${period.toLowerCase()}`;

  }



  function buildInsight() {

    // No transactions in selected period

    if (current.length === 0) {

      return {

        title: "No spending yet",

        text: `Add a few transactions and InsightVoice will start analyzing your ${period.toLowerCase()} spending.`,

        action: null,

      };

    }



    // Find biggest category in current period

    const topCurrentCategory = [...categoryData]

      .filter((item) => item.current > 0)

      .sort((a, b) => b.current - a.current)[0];



    // CASE 1:

    // We have previous-period data + goal

    if (

      activeGoal &&

      biggestIncrease &&

      previousTotal > 0

    ) {

      const impact =

        monthlyGoal > 0

          ? (biggestIncrease.difference / monthlyGoal) * 100

          : 0;



      return {

        title: `${biggestIncrease.category} increased the most`,

        text: `You spent ${compactMoney(

          biggestIncrease.difference,

          currency

        )} more on ${biggestIncrease.category} than the previous ${period.toLowerCase()}.`,

        action:

          impact > 0

            ? `That increase equals about ${Math.min(

                impact,

                100

              ).toFixed(0)}% of your monthly saving target for ${

                activeGoal.title

              }.`

            : null,

      };

    }



    // CASE 2:

    // We have previous-period data, but no goal

    if (biggestIncrease && previousTotal > 0) {

      return {

        title: `${biggestIncrease.category} changed the most`,

        text: `You spent ${compactMoney(

          biggestIncrease.difference,

          currency

        )} more on ${biggestIncrease.category} than the previous ${period.toLowerCase()}.`,

        action:

          "This is the biggest spending increase worth watching.",

      };

    }



    // CASE 3:

    // No previous-period data yet,

    // but we DO have current transactions

    if (topCurrentCategory) {

      const share =

        total > 0

          ? (topCurrentCategory.current / total) * 100

          : 0;



      const categoryTransactions = current.filter(

        (item) =>

          expenseCategory(item) ===

          topCurrentCategory.category

      ).length;



      // Current data + saving goal

      if (activeGoal) {

        const goalImpact =

          monthlyGoal > 0

            ? (topCurrentCategory.current / monthlyGoal) * 100

            : 0;



        return {

          title: `${topCurrentCategory.category} is your biggest spending area`,

          text: `${compactMoney(

            topCurrentCategory.current,

            currency

          )} went to ${

            topCurrentCategory.category

          } — about ${share.toFixed(

            0

          )}% of your ${period.toLowerCase()} spending.`,

          action:

            goalImpact > 0

              ? `That's about ${Math.min(

                  goalImpact,

                  100

                ).toFixed(

                  0

                )}% of the amount you need each month for ${

                  activeGoal.title

                }.`

              : null,

        };

      }



      // Current data, no goal

      return {

        title: `${topCurrentCategory.category} is your biggest spending area`,

        text: `${compactMoney(

          topCurrentCategory.current,

          currency

        )} went to ${

          topCurrentCategory.category

        } — about ${share.toFixed(

          0

        )}% of your ${period.toLowerCase()} spending.`,

        action: `${categoryTransactions} transaction${

          categoryTransactions !== 1 ? "s" : ""

        } made up this category.`,

      };

    }



    return {

      title: "Your spending picture is taking shape",

      text: "Keep tracking and InsightVoice will surface the patterns that matter.",

      action: null,

    };

  }



  const insight = buildInsight();



  function openGoal() {

    if (activeGoal) {

      setGoalTitle(activeGoal.title);

      setGoalTarget(String(activeGoal.target));

      setGoalSaved(String(activeGoal.saved));

      setGoalDeadline(activeGoal.deadline);

      setGoalIcon(activeGoal.icon);

    } else {

      setGoalTitle("");

      setGoalTarget("");

      setGoalSaved("");

      setGoalDeadline("");

      setGoalIcon("airplane");

    }



    setGoalModal(true);

  }



  async function saveGoal() {

    const target = Number(

      goalTarget.replace(/,/g, "").trim()

    );



    const saved = Number(

      goalSaved.replace(/,/g, "").trim() || "0"

    );



    if (!goalTitle.trim()) {

      Alert.alert(

        "Goal name required",

        "Please enter a name for your goal."

      );

      return;

    }



    if (!Number.isFinite(target) || target <= 0) {

      Alert.alert(

        "Invalid target",

        "Please enter a valid target amount."

      );

      return;

    }



    if (!goalDeadline.trim()) {

      Alert.alert(

        "Target date required",

        "Please enter a date such as 2027-06-30."

      );

      return;

    }



    const deadline = parseDate(goalDeadline.trim());



    if (!deadline) {

      Alert.alert(

        "Invalid date",

        "Please use YYYY-MM-DD, for example 2027-06-30."

      );

      return;

    }



    const nextGoal: SavingGoal = {

      title: goalTitle.trim(),

      target,

      saved:

        Number.isFinite(saved) && saved >= 0

          ? saved

          : 0,

      deadline: goalDeadline.trim(),

      currency,

      icon: goalIcon,

    };



    try {

      await AsyncStorage.setItem(

        GOAL_KEY,

        JSON.stringify(nextGoal)

      );



      setGoal(nextGoal);

      setGoalModal(false);

    } catch (error) {

      console.error("Save goal error:", error);



      Alert.alert(

        "Couldn't save goal",

        "Please try again."

      );

    }

  }



  return (

    <View style={styles.outside}>

      <View style={styles.phone}>

        <ScrollView

          style={{ flex: 1 }}

          contentContainerStyle={styles.content}

          showsVerticalScrollIndicator={false}

        >

          <View style={styles.header}>

            <Text style={styles.eyebrow}>

              MY TRANSACTIONS

            </Text>



            <Text style={styles.title}>

              Spending Analytics

            </Text>



            <Text style={styles.subtitle}>

              See what changed and what matters.

            </Text>

          </View>



          <View style={styles.filters}>

            <View style={styles.currencyRow}>

              {CURRENCIES.map((item) => {

                const active = item === currency;



                return (

                  <Pressable

                    key={item}

                    onPress={() => setCurrency(item)}

                    style={[

                      styles.currencyButton,

                      active &&

                        styles.currencyButtonActive,

                    ]}

                  >

                    <Text

                      style={[

                        styles.currencyText,

                        active &&

                          styles.currencyTextActive,

                      ]}

                    >

                      {item}

                    </Text>

                  </Pressable>

                );

              })}

            </View>



            <View style={styles.periodRow}>

              {PERIODS.map((item) => {

                const active = item === period;



                return (

                  <Pressable

                    key={item}

                    onPress={() => setPeriod(item)}

                    style={[

                      styles.periodButton,

                      active &&

                        styles.periodButtonActive,

                    ]}

                  >

                    <Text

                      style={[

                        styles.periodText,

                        active &&

                          styles.periodTextActive,

                      ]}

                    >

                      {item}

                    </Text>

                  </Pressable>

                );

              })}

            </View>

          </View>



          {/* 1 — SPENDING */}



          <View style={styles.hero}>

            <View style={styles.heroTop}>

              <Text style={styles.heroEyebrow}>

                {period.toUpperCase()} SPENDING

              </Text>



              <Text style={styles.heroCurrency}>

                {currency}

              </Text>

            </View>



            <Text style={styles.heroAmount}>

              {money(total, currency)}

            </Text>



            <Text

              style={[

                styles.heroChange,

                totalChange !== null &&

                  totalChange < 0 && {

                    color: "#62D5B3",

                  },

                totalChange !== null &&

                  totalChange > 0 && {

                    color: "#FF9A9A",

                  },

              ]}

            >

              {comparisonText()}

            </Text>



            <Text style={styles.heroCount}>

              {current.length} transaction

              {current.length !== 1 ? "s" : ""}

            </Text>

          </View>



          {/* 2 — WHAT CHANGED */}



          <View style={styles.sectionHeading}>

            <View>

              <Text style={styles.sectionTitle}>

                What changed

              </Text>



              <Text style={styles.sectionSubtitle}>

                The biggest differences worth noticing

              </Text>

            </View>

          </View>



          <View style={styles.changeCard}>

            {changes.length === 0 ? (

              <View style={styles.emptyChange}>

                <Ionicons

                  name="analytics-outline"

                  size={20}

                  color={C.muted}

                />



                <Text style={styles.emptyChangeText}>

                  Add more history to compare your spending.

                </Text>

              </View>

            ) : (

              changes.map((item, index) => {

                const meta =

                  CATEGORY_META[item.category];



                const up = item.difference > 0;



                return (

                  <View

                    key={item.category}

                    style={[

                      styles.changeRow,

                      index < changes.length - 1 &&

                        styles.divider,

                    ]}

                  >

                    <View

                      style={[

                        styles.categoryIcon,

                        { backgroundColor: meta.bg },

                      ]}

                    >

                      <Ionicons

                        name={meta.icon}

                        size={15}

                        color={meta.color}

                      />

                    </View>



                    <View style={styles.changeMiddle}>

                      <Text style={styles.changeName}>

                        {item.category}

                      </Text>



                      <Text style={styles.changePrevious}>

                        Previous{" "}

                        {compactMoney(

                          item.previous,

                          currency

                        )}

                      </Text>

                    </View>



                    <View style={styles.changeRight}>

                      <Text

                        style={[

                          styles.changeAmount,

                          {

                            color: up

                              ? C.red

                              : C.green,

                          },

                        ]}

                      >

                        {up ? "↑ " : "↓ "}

                        {compactMoney(

                          Math.abs(item.difference),

                          currency

                        )}

                      </Text>



                      <Text style={styles.changeCurrent}>

                        now{" "}

                        {compactMoney(

                          item.current,

                          currency

                        )}

                      </Text>

                    </View>

                  </View>

                );

              })

            )}

          </View>



          {/* 3 — GOAL */}



          <View style={styles.sectionHeadingRow}>

            <View>

              <Text style={styles.sectionTitle}>

                Your goal

              </Text>



              <Text style={styles.sectionSubtitle}>

                What you're working toward

              </Text>

            </View>



            <Pressable onPress={openGoal}>

              <Text style={styles.editText}>

                {activeGoal ? "Edit" : "Add goal"}

              </Text>

            </Pressable>

          </View>



          {activeGoal ? (

            <View style={styles.goalCard}>

              <View style={styles.goalTop}>

                <View style={styles.goalIcon}>

                  <Ionicons

                    name={activeGoal.icon as any}

                    size={20}

                    color={C.purple}

                  />

                </View>



                <View style={{ flex: 1 }}>

                  <Text style={styles.goalName}>

                    {activeGoal.title}

                  </Text>



                  <Text style={styles.goalDeadline}>

                    Goal · {activeGoal.deadline}

                  </Text>

                </View>



                <Text style={styles.goalPercent}>

                  {goalProgress.toFixed(0)}%

                </Text>

              </View>



              <View style={styles.goalTrack}>

                <View

                  style={[

                    styles.goalFill,

                    {

                      width: `${goalProgress}%`,

                    },

                  ]}

                />

              </View>



              <View style={styles.goalProgressRow}>

                <Text style={styles.goalSaved}>

                  {compactMoney(

                    activeGoal.saved,

                    currency

                  )}{" "}

                  saved

                </Text>



                <Text style={styles.goalTarget}>

                  {compactMoney(

                    activeGoal.target,

                    currency

                  )}

                </Text>

              </View>



              <View style={styles.goalPlan}>

                <View>

                  <Text style={styles.goalPlanLabel}>

                    TO STAY ON TRACK

                  </Text>



                  <Text style={styles.goalMonthly}>

                    {compactMoney(

                      monthlyGoal,

                      currency

                    )}

                    <Text style={styles.goalMonthlySmall}>

                      {" "}

                      / month

                    </Text>

                  </Text>

                </View>



                <View style={styles.goalTime}>

                  <Ionicons

                    name="calendar-outline"

                    size={13}

                    color={C.purple}

                  />



                  <Text style={styles.goalTimeText}>

                    {goalMonths} months left

                  </Text>

                </View>

              </View>



              <Text style={styles.goalRemaining}>

                {compactMoney(

                  goalRemaining,

                  currency

                )}{" "}

                left to reach your goal

              </Text>

            </View>

          ) : (

            <Pressable

              style={styles.emptyGoal}

              onPress={openGoal}

            >

              <View style={styles.emptyGoalIcon}>

                <Ionicons

                  name="flag"

                  size={21}

                  color={C.purple}

                />

              </View>



              <Text style={styles.emptyGoalTitle}>

                What are you saving for?

              </Text>



              <Text style={styles.emptyGoalText}>

                A trip, a laptop, studying abroad — connect

                today's spending to something you want.

              </Text>



              <View style={styles.createGoal}>

                <Text style={styles.createGoalText}>

                  Create a goal

                </Text>



                <Ionicons

                  name="arrow-forward"

                  size={13}

                  color={C.white}

                />

              </View>

            </Pressable>

          )}



          {/* 4 — INSIGHTVOICE */}



          <View style={styles.insightCard}>

            <View style={styles.insightTop}>

              <View style={styles.sparkle}>

                <Ionicons

                  name="sparkles"

                  size={16}

                  color={C.purple}

                />

              </View>



              <View>

                <Text style={styles.insightBrand}>

                  INSIGHTVOICE

                </Text>



                <Text style={styles.insightCaption}>

                  One thing worth knowing

                </Text>

              </View>

            </View>



            <Text style={styles.insightTitle}>

              {insight.title}

            </Text>



            <Text style={styles.insightText}>

              {insight.text}

            </Text>



          </View>

        </ScrollView>



        <View style={styles.nav}>

          <NavButton

            label="Home"

            icon="home"

            onPress={() => router.replace("/")}

          />



          <NavButton

            label="Transactions"

            icon="list"

            onPress={() =>

              router.replace("/history")

            }

          />



          <NavButton

            label="Analytics"

            icon="bar-chart"

            active

            onPress={() => {}}

          />

        </View>



        <Modal

          visible={goalModal}

          transparent

          animationType="slide"

          onRequestClose={() =>

            setGoalModal(false)

          }

        >

          <View style={styles.modalOverlay}>

            <View style={styles.modalCard}>

              <ScrollView

                showsVerticalScrollIndicator={false}

              >

                <Text style={styles.modalEyebrow}>

                  YOUR GOAL

                </Text>



                <Text style={styles.modalTitle}>

                  What are you saving for?

                </Text>



                <Text style={styles.modalSubtitle}>

                  Give your everyday spending a reason.

                </Text>



                <ScrollView

                  horizontal

                  showsHorizontalScrollIndicator={false}

                  contentContainerStyle={

                    styles.presetRow

                  }

                >

                  {GOAL_PRESETS.map((preset) => {

                    const active =

                      goalIcon === preset.icon;



                    return (

                      <Pressable

                        key={preset.title}

                        onPress={() => {

                          setGoalIcon(

                            preset.icon

                          );



                          if (!goalTitle) {

                            setGoalTitle(

                              preset.title

                            );

                          }

                        }}

                        style={[

                          styles.preset,

                          active &&

                            styles.presetActive,

                        ]}

                      >

                        <Ionicons

                          name={preset.icon as any}

                          size={17}

                          color={

                            active

                              ? C.white

                              : C.purple

                          }

                        />



                        <Text

                          style={[

                            styles.presetText,

                            active &&

                              styles.presetTextActive,

                          ]}

                        >

                          {preset.title}

                        </Text>

                      </Pressable>

                    );

                  })}

                </ScrollView>



                <Text style={styles.inputLabel}>

                  Goal name

                </Text>



                <TextInput

                  value={goalTitle}

                  onChangeText={setGoalTitle}

                  placeholder="e.g. Maldives Trip"

                  placeholderTextColor="#A0A5B8"

                  style={styles.input}

                />



                <Text style={styles.inputLabel}>

                  Target amount · {currency}

                </Text>



                <TextInput

                  value={goalTarget}

                  onChangeText={setGoalTarget}

                  keyboardType="numeric"

                  placeholder={

                    currency === "VND"

                      ? "30,000,000"

                      : "3,000"

                  }

                  placeholderTextColor="#A0A5B8"

                  style={styles.input}

                />



                <Text style={styles.inputLabel}>

                  Already saved

                </Text>



                <TextInput

                  value={goalSaved}

                  onChangeText={setGoalSaved}

                  keyboardType="numeric"

                  placeholder="0"

                  placeholderTextColor="#A0A5B8"

                  style={styles.input}

                />



                <Text style={styles.inputLabel}>

                  Target date

                </Text>



                <TextInput

                  value={goalDeadline}

                  onChangeText={setGoalDeadline}

                  placeholder="YYYY-MM-DD"

                  placeholderTextColor="#A0A5B8"

                  style={styles.input}

                />



                <View style={styles.modalButtons}>

                  <Pressable

                    onPress={() =>

                      setGoalModal(false)

                    }

                    style={styles.cancelButton}

                  >

                    <Text style={styles.cancelText}>

                      Cancel

                    </Text>

                  </Pressable>



                  <Pressable

                    onPress={saveGoal}

                    style={styles.saveButton}

                  >

                    <Text style={styles.saveText}>

                      Save goal

                    </Text>

                  </Pressable>

                </View>

              </ScrollView>

            </View>

          </View>

        </Modal>

      </View>

    </View>

  );

}



function NavButton({

  label,

  icon,

  active = false,

  onPress,

}: {

  label: string;

  icon: any;

  active?: boolean;

  onPress: () => void;

}) {

  return (

    <Pressable

      onPress={onPress}

      style={styles.navButton}

    >

      <Ionicons

        name={

          active ? icon : `${icon}-outline`

        }

        size={19}

        color={

          active ? C.purple : "#8189A4"

        }

      />



      <Text

        style={[

          styles.navText,

          active && styles.navTextActive,

        ]}

      >

        {label}

      </Text>

    </Pressable>

  );

}



const styles = StyleSheet.create({

  outside: {

    flex: 1,

    backgroundColor: C.outside,

    alignItems: "center",

  },



  phone: {

    flex: 1,

    width: "100%",

    maxWidth: 390,

    backgroundColor: C.white,

  },



  content: {

    paddingBottom: 32,

  },



  header: {

    paddingHorizontal: 18,

    paddingTop: 18,

  },



  eyebrow: {

    fontSize: 9,

    fontWeight: "700",

    letterSpacing: 0.9,

    color: C.purple,

  },



  title: {

    marginTop: 4,

    fontSize: 24,

    lineHeight: 30,

    fontWeight: "700",

    color: C.navy,

  },



  subtitle: {

    marginTop: 4,

    fontSize: 11.5,

    color: C.muted,

  },



  filters: {

    marginTop: 21,

    paddingHorizontal: 18,

  },



  currencyRow: {

    height: 40,

    padding: 3,

    borderRadius: 11,

    backgroundColor: "#F3F4F8",

    flexDirection: "row",

  },



  currencyButton: {

    flex: 1,

    borderRadius: 8,

    alignItems: "center",

    justifyContent: "center",

  },



  currencyButtonActive: {

    backgroundColor: C.purple,

  },



  currencyText: {

    fontSize: 10.5,

    fontWeight: "600",

    color: C.secondary,

  },



  currencyTextActive: {

    color: C.white,

  },



  periodRow: {

    marginTop: 9,

    flexDirection: "row",

    gap: 7,

  },



  periodButton: {

    flex: 1,

    height: 32,

    borderRadius: 16,

    borderWidth: 1,

    borderColor: C.line,

    alignItems: "center",

    justifyContent: "center",

  },



  periodButtonActive: {

    borderColor: C.purpleBorder,

    backgroundColor: C.purpleLight,

  },



  periodText: {

    fontSize: 9.5,

    color: C.muted,

  },



  periodTextActive: {

    color: C.purple,

    fontWeight: "700",

  },



  hero: {

    marginTop: 18,

    marginHorizontal: 18,

    padding: 17,

    borderRadius: 16,

    backgroundColor: "#F7F6FF",

    borderWidth: 1,

    borderColor: "#E7E4FF",

  },



  heroTop: {

    flexDirection: "row",

    justifyContent: "space-between",

  },



  heroEyebrow: {

    fontSize: 9,

    fontWeight: "600",

    letterSpacing: 0.7,

    color: C.purple,

  },



  heroCurrency: {

    fontSize: 9,

    fontWeight: "600",

    color: C.muted,

  },



  heroAmount: {

    marginTop: 8,

    fontSize: 24,

    lineHeight: 30,

    fontWeight: "700",

    color: C.navy,

  },



  heroChange: {

    marginTop: 7,

    fontSize: 10.5,

    fontWeight: "500",

    color: C.secondary,

  },



  heroCount: {

    marginTop: 5,

    fontSize: 9,

    color: C.muted,

  },



  sectionHeading: {

    marginTop: 25,

    paddingHorizontal: 18,

  },



  sectionHeadingRow: {

    marginTop: 27,

    paddingHorizontal: 18,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

  },



  sectionTitle: {

    fontSize: 15,

    fontWeight: "600",

    color: C.navy,

  },



  sectionSubtitle: {

    marginTop: 3,

    fontSize: 9.5,

    color: C.muted,

  },



  changeCard: {

    marginTop: 11,

    marginHorizontal: 18,

    borderWidth: 1,

    borderColor: C.line,

    borderRadius: 14,

    overflow: "hidden",

  },



  changeRow: {

    minHeight: 62,

    paddingHorizontal: 13,

    flexDirection: "row",

    alignItems: "center",

  },



  divider: {

    borderBottomWidth: 1,

    borderBottomColor: "#F0F1F5",

  },



  categoryIcon: {

    width: 33,

    height: 33,

    borderRadius: 9,

    alignItems: "center",

    justifyContent: "center",

  },



  changeMiddle: {

    flex: 1,

    marginLeft: 10,

  },



  changeName: {

    fontSize: 11.5,

    fontWeight: "700",

    color: C.text,

  },



  changePrevious: {

    marginTop: 3,

    fontSize: 8.5,

    color: C.muted,

  },



  changeRight: {

    alignItems: "flex-end",

  },



  changeAmount: {

    fontSize: 11,

    fontWeight: "700",

  },



  changeCurrent: {

    marginTop: 3,

    fontSize: 8.5,

    color: C.muted,

  },



  emptyChange: {

    minHeight: 82,

    padding: 15,

    alignItems: "center",

    justifyContent: "center",

  },



  emptyChangeText: {

    marginTop: 6,

    fontSize: 9.5,

    color: C.muted,

  },



  editText: {

    fontSize: 10,

    fontWeight: "700",

    color: C.purple,

  },



  goalCard: {

    marginTop: 11,

    marginHorizontal: 18,

    padding: 16,

    borderRadius: 16,

    borderWidth: 1,

    borderColor: C.purpleBorder,

    backgroundColor: C.purpleSoft,

  },



  goalTop: {

    flexDirection: "row",

    alignItems: "center",

  },



  goalIcon: {

    width: 39,

    height: 39,

    marginRight: 10,

    borderRadius: 11,

    backgroundColor: C.white,

    alignItems: "center",

    justifyContent: "center",

  },



  goalName: {

    fontSize: 14,

    fontWeight: "700",

    color: C.navy,

  },



  goalDeadline: {

    marginTop: 3,

    fontSize: 8.5,

    color: C.muted,

  },



  goalPercent: {

    fontSize: 17,

    fontWeight: "800",

    color: C.purple,

  },



  goalTrack: {

    height: 8,

    marginTop: 15,

    borderRadius: 99,

    backgroundColor: "#E3E0FA",

    overflow: "hidden",

  },



  goalFill: {

    height: "100%",

    borderRadius: 99,

    backgroundColor: C.purple,

  },



  goalProgressRow: {

    marginTop: 7,

    flexDirection: "row",

    justifyContent: "space-between",

  },



  goalSaved: {

    fontSize: 9,

    fontWeight: "600",

    color: C.secondary,

  },



  goalTarget: {

    fontSize: 9,

    color: C.muted,

  },



  goalPlan: {

    marginTop: 15,

    paddingTop: 14,

    borderTopWidth: 1,

    borderTopColor: C.purpleBorder,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

  },



  goalPlanLabel: {

    fontSize: 7.5,

    fontWeight: "600",

    letterSpacing: 0.7,

    color: C.muted,

  },



  goalMonthly: {

    marginTop: 4,

    fontSize: 18,

    fontWeight: "700",

    color: C.navy,

  },



  goalMonthlySmall: {

    fontSize: 9.5,

    fontWeight: "500",

    color: C.muted,

  },



  goalTime: {

    paddingHorizontal: 9,

    paddingVertical: 6,

    borderRadius: 20,

    backgroundColor: C.white,

    flexDirection: "row",

    alignItems: "center",

    gap: 4,

  },



  goalTimeText: {

    fontSize: 8.5,

    fontWeight: "600",

    color: C.secondary,

  },



  goalRemaining: {

    marginTop: 8,

    fontSize: 9,

    color: C.secondary,

  },



  emptyGoal: {

    marginTop: 11,

    marginHorizontal: 18,

    padding: 20,

    borderRadius: 16,

    borderWidth: 1,

    borderColor: C.purpleBorder,

    backgroundColor: C.purpleSoft,

    alignItems: "center",

  },



  emptyGoalIcon: {

    width: 44,

    height: 44,

    borderRadius: 22,

    backgroundColor: C.white,

    alignItems: "center",

    justifyContent: "center",

  },



  emptyGoalTitle: {

    marginTop: 10,

    fontSize: 13,

    fontWeight: "800",

    color: C.navy,

  },



  emptyGoalText: {

    marginTop: 5,

    maxWidth: 270,

    textAlign: "center",

    fontSize: 9.5,

    lineHeight: 14,

    color: C.muted,

  },



  createGoal: {

    marginTop: 13,

    height: 34,

    paddingHorizontal: 14,

    borderRadius: 9,

    backgroundColor: C.purple,

    flexDirection: "row",

    alignItems: "center",

    gap: 6,

  },



  createGoalText: {

    fontSize: 9.5,

    fontWeight: "700",

    color: C.white,

  },



  insightCard: {

    marginTop: 27,

    marginHorizontal: 18,

    padding: 16,

    borderRadius: 16,

    backgroundColor: "#F8F7FF",

    borderWidth: 1,

    borderColor: "#E4E1FF",

  },



  insightTop: {

    flexDirection: "row",

    alignItems: "center",

    gap: 9,

  },



  sparkle: {

    width: 31,

    height: 31,

    borderRadius: 9,

    backgroundColor: C.white,

    alignItems: "center",

    justifyContent: "center",

  },



  insightBrand: {

    fontSize: 8.5,

    fontWeight: "700",

    letterSpacing: 0.8,

    color: C.purple,

  },



  insightCaption: {

    marginTop: 2,

    fontSize: 9,

    color: C.muted,

  },



  insightTitle: {

    marginTop: 13,

    fontSize: 14,

    lineHeight: 20,

    fontWeight: "700",

    color: C.navy,

  },



  insightText: {

    marginTop: 5,

    fontSize: 10.5,

    lineHeight: 16,

    color: C.secondary,

  },





  insightActionText: {

    flex: 1,

    fontSize: 10,

    lineHeight: 15,

    fontWeight: "500",

    color: C.text,

  },





  nav: {

    height: 61,

    borderTopWidth: 1,

    borderTopColor: C.line,

    backgroundColor: C.white,

    flexDirection: "row",

  },



  navButton: {

    flex: 1,

    alignItems: "center",

    justifyContent: "center",

  },



  navText: {

    marginTop: 4,

    fontSize: 10,

    color: "#8189A4",

  },



  navTextActive: {

    color: C.purple,

    fontWeight: "600",

  },



  modalOverlay: {

    flex: 1,

    padding: 22,

    backgroundColor: "rgba(8,13,79,0.32)",

    alignItems: "center",

    justifyContent: "center",

  },



  modalCard: {

    width: "100%",

    maxWidth: 350,

    maxHeight: "88%",

    padding: 20,

    borderRadius: 18,

    backgroundColor: C.white,

  },



  modalEyebrow: {

    fontSize: 8,

    fontWeight: "800",

    letterSpacing: 0.9,

    color: C.purple,

  },



  modalTitle: {

    marginTop: 4,

    fontSize: 19,

    fontWeight: "800",

    color: C.navy,

  },



  modalSubtitle: {

    marginTop: 5,

    fontSize: 10,

    color: C.muted,

  },



  presetRow: {

    marginTop: 16,

    gap: 7,

  },



  preset: {

    minWidth: 67,

    height: 55,

    paddingHorizontal: 8,

    borderRadius: 11,

    backgroundColor: C.purpleLight,

    alignItems: "center",

    justifyContent: "center",

    gap: 4,

  },



  presetActive: {

    backgroundColor: C.purple,

  },



  presetText: {

    fontSize: 8,

    fontWeight: "600",

    color: C.purple,

  },



  presetTextActive: {

    color: C.white,

  },



  inputLabel: {

    marginTop: 14,

    marginBottom: 5,

    fontSize: 9,

    fontWeight: "700",

    color: C.secondary,

  },



  input: {

    height: 42,

    paddingHorizontal: 12,

    borderRadius: 10,

    borderWidth: 1,

    borderColor: C.line,

    fontSize: 13,

    color: C.navy,

  },



  modalButtons: {

    marginTop: 19,

    flexDirection: "row",

    justifyContent: "flex-end",

    gap: 8,

  },



  cancelButton: {

    height: 39,

    paddingHorizontal: 14,

    justifyContent: "center",

  },



  cancelText: {

    fontSize: 10.5,

    fontWeight: "600",

    color: C.secondary,

  },



  saveButton: {

    height: 39,

    paddingHorizontal: 16,

    borderRadius: 9,

    backgroundColor: C.purple,

    alignItems: "center",

    justifyContent: "center",

  },



  saveText: {

    fontSize: 10.5,

    fontWeight: "700",

    color: C.white,

  },

});