import { useCallback, useMemo, useRef, useState } from "react";

import {

  View,

  Text,

  ScrollView,

  Pressable,

  ActivityIndicator,

  StyleSheet,

} from "react-native";



import { useFocusEffect, useRouter } from "expo-router";

import { Ionicons } from "@expo/vector-icons";



import {

  loadExpenses,

  type Expense,

} from "../utils/storage";



// ============================================================

// DESIGN

// ============================================================



const C = {

  outside: "#F4F6FB",

  white: "#FFFFFF",



  navy: "#080D4F",

  text: "#171A3F",

  secondary: "#596184",

  muted: "#8990A8",



  purple: "#5547FF",

  purpleLight: "#F1EFFF",

  purpleSoft: "#F7F6FF",

  purpleBorder: "#DDD9FF",



  line: "#E9EBF3",

};



// ============================================================

// TYPES

// ============================================================



type CurrencyFilter =

  | "ALL"

  | "VND"

  | "USD"

  | "EUR";



type PeriodFilter =

  | "all"

  | "today"

  | "yesterday"

  | "7days";



type CategoryFilter =

  | string

  | null;



// ============================================================

// CATEGORY META

// ============================================================



const CATEGORY_META: Record<

  string,

  {

    icon: any;

    background: string;

    color: string;

  }

> = {

  Food: {

    icon: "restaurant",

    background: "#FFF1EE",

    color: "#E76F51",

  },



  Transport: {

    icon: "car",

    background: "#EEF7FF",

    color: "#2585E8",

  },



  Shopping: {

    icon: "bag-handle",

    background: "#F4EEFF",

    color: "#805AD5",

  },



  "Bills & Utilities" : {

    icon: "receipt",

    background: "#EAF9F5",

    color: "#0B9B82",

  },



  Other: {

    icon: "wallet",

    background: "#F2F3F7",

    color: "#69708B",

  },

};



// ============================================================

// HELPERS

// ============================================================



function getLocalDate(offset = 0) {

  const date = new Date();



  date.setDate(

    date.getDate() + offset

  );



  const year =

    date.getFullYear();



  const month = String(

    date.getMonth() + 1

  ).padStart(2, "0");



  const day = String(

    date.getDate()

  ).padStart(2, "0");



  return `${year}-${month}-${day}`;

}



function currencyOf(

  expense: Expense

) {

  return (

    expense.currency || "VND"

  ).toUpperCase();

}



function categoryOf(

  expense: Expense

) {

  let category =

    expense.category ||

    "Other";



  // Old transactions remain compatible

  if (

    category === "Bills"

  ) {

    category =

      "Bills & Utilities";

  }



  return CATEGORY_META[

    category

  ]

    ? category

    : "Other";

}



function formatAmount(

  amount: number,

  currency = "VND"

) {

  if (currency === "EUR") {

    return `€${amount.toLocaleString(

      "en-US",

      {

        maximumFractionDigits: 2,

      }

    )}`;

  }



  if (currency === "USD") {

    return `$${amount.toLocaleString(

      "en-US",

      {

        maximumFractionDigits: 2,

      }

    )}`;

  }



  return `₫${Math.round(

    amount

  ).toLocaleString("en-US")}`;

}



function parseExpenseDate(

  dateString: string

) {

  const parts =

    dateString.split("-");



  if (parts.length !== 3) {

    return null;

  }



  const year =

    Number(parts[0]);



  const month =

    Number(parts[1]) - 1;



  const day =

    Number(parts[2]);



  const date =

    new Date(

      year,

      month,

      day

    );



  if (

    Number.isNaN(

      date.getTime()

    )

  ) {

    return null;

  }



  return date;

}



function isInLastDays(

  dateString: string,

  days: number

) {

  const date =

    parseExpenseDate(

      dateString

    );



  if (!date) {

    return false;

  }



  date.setHours(

    0,

    0,

    0,

    0

  );



  const today =

    new Date();



  today.setHours(

    23,

    59,

    59,

    999

  );



  const start =

    new Date();



  start.setHours(

    0,

    0,

    0,

    0

  );



  start.setDate(

    start.getDate() -

      (days - 1)

  );



  return (

    date >= start &&

    date <= today

  );

}



function formatDateLabel(

  dateString: string

) {

  if (

    dateString ===

    getLocalDate()

  ) {

    return "Today";

  }



  if (

    dateString ===

    getLocalDate(-1)

  ) {

    return "Yesterday";

  }



  const date =

    parseExpenseDate(

      dateString

    );



  if (!date) {

    return dateString;

  }



  return date.toLocaleDateString(

    "en-US",

    {

      month: "short",

      day: "numeric",

      year: "numeric",

    }

  );

}



function monthLabel(

  dateString: string

) {

  const date =

    parseExpenseDate(

      dateString

    );



  if (!date) {

    return "Transactions";

  }



  return date.toLocaleDateString(

    "en-US",

    {

      month: "short",

      year: "numeric",

    }

  );

}



// ============================================================

// SCREEN

// ============================================================



export default function HistoryScreen() {

  const router =

    useRouter();



  const categoryScrollRef =

    useRef<ScrollView>(null);



  const [

    categoryScrollX,

    setCategoryScrollX,

  ] = useState(0);



  const [

    expenses,

    setExpenses,

  ] =

    useState<Expense[]>([]);



  const [

    loading,

    setLoading,

  ] =

    useState(true);



  const [

    currencyFilter,

    setCurrencyFilter,

  ] =

    useState<CurrencyFilter>(

      "ALL"

    );



  const [

    periodFilter,

    setPeriodFilter,

  ] =

    useState<PeriodFilter>(

      "all"

    );



  const [

    categoryFilter,

    setCategoryFilter,

  ] =

    useState<CategoryFilter>(

      null

    );



  // ==========================================================

  // LOAD

  // ==========================================================



  useFocusEffect(

    useCallback(() => {

      async function load() {

        try {

          setLoading(true);



          const data =

            await loadExpenses();



          const sorted =

            [...data].sort(

              (a, b) => {

                const dateCompare =

                  (

                    b.date || ""

                  ).localeCompare(

                    a.date || ""

                  );



                if (

                  dateCompare !== 0

                ) {

                  return dateCompare;

                }



                return (

                  Number(b.id) -

                  Number(a.id)

                );

              }

            );



          setExpenses(

            sorted

          );

        } catch (error) {

          console.error(

            "Transaction load error:",

            error

          );



          setExpenses([]);

        } finally {

          setLoading(false);

        }

      }



      void load();

    }, [])

  );



  // ==========================================================

  // PERIOD

  // ==========================================================



  const periodExpenses =

    useMemo(() => {

      return expenses.filter(

        (expense) => {

          if (

            periodFilter ===

            "today"

          ) {

            return (

              expense.date ===

              getLocalDate()

            );

          }



          if (

            periodFilter ===

            "yesterday"

          ) {

            return (

              expense.date ===

              getLocalDate(-1)

            );

          }



          if (

            periodFilter ===

            "7days"

          ) {

            return isInLastDays(

              expense.date,

              7

            );

          }



          return true;

        }

      );

    }, [

      expenses,

      periodFilter,

    ]);



  // ==========================================================

  // PERIOD + CURRENCY

  // Category cards use this.

  // ==========================================================



  const currencyExpenses =

    useMemo(() => {

      if (

        currencyFilter ===

        "ALL"

      ) {

        return periodExpenses;

      }



      return periodExpenses.filter(

        (expense) =>

          currencyOf(

            expense

          ) ===

          currencyFilter

      );

    }, [

      periodExpenses,

      currencyFilter,

    ]);



  // ==========================================================

  // FINAL FILTER

  // period + currency + category

  // ==========================================================



  const filteredExpenses =

    useMemo(() => {

      if (!categoryFilter) {

        return currencyExpenses;

      }



      return currencyExpenses.filter(

        (expense) =>

          categoryOf(

            expense

          ) ===

          categoryFilter

      );

    }, [

      currencyExpenses,

      categoryFilter,

    ]);



  // ==========================================================

  // TOTAL SPENDING

  // Reflect period + category.

  // Currency cards remain clickable.

  // ==========================================================



  const totalBaseExpenses =

    useMemo(() => {

      if (!categoryFilter) {

        return periodExpenses;

      }



      return periodExpenses.filter(

        (expense) =>

          categoryOf(

            expense

          ) ===

          categoryFilter

      );

    }, [

      periodExpenses,

      categoryFilter,

    ]);



  const currencyTotals =

    useMemo(() => {

      const totals: Record<

        string,

        number

      > = {};



      totalBaseExpenses.forEach(

        (expense) => {

          const currency =

            currencyOf(

              expense

            );



          totals[currency] =

            (totals[

              currency

            ] || 0) +

            Number(

              expense.amount ||

                0

            );

        }

      );



      return [

        "VND",

        "USD",

        "EUR",

      ]

        .filter(

          (currency) =>

            totals[currency] !=

            null

        )

        .map(

          (currency) => ({

            currency:

              currency as CurrencyFilter,

            total:

              totals[

                currency

              ],

          })

        );

    }, [

      totalBaseExpenses,

    ]);



// ==========================================================

// CATEGORY TOTALS

// Always show 5 fixed categories.

// Reflect period + currency, NOT category filter.

// ==========================================================



const categoryTotals =

  useMemo(() => {

    const fixedCategories = [

      "Food",

      "Transport",

      "Shopping",

      "Bills & Utilities",

      "Other",

    ];



    const map: Record<

      string,

      Record<string, number>

    > = {};



    // Always create all 5 categories

    fixedCategories.forEach(

      (category) => {

        map[category] = {};

      }

    );



    currencyExpenses.forEach(

      (expense) => {

        let category =

          expense.category ||

          "Other";



        // Support old saved transactions using "Bills"

        if (

          category === "Bills"

        ) {

          category =

            "Bills & Utilities";

        }



        if (

          !fixedCategories.includes(

            category

          )

        ) {

          category = "Other";

        }



        const currency =

          currencyOf(expense);



        map[category][currency] =

          (map[category][

            currency

          ] || 0) +

          Number(

            expense.amount || 0

          );

      }

    );



    return fixedCategories.map(

      (category) => ({

        category,

        totals:

          map[category],

      })

    );

  }, [currencyExpenses]);



  // ==========================================================

  // GROUP HISTORY

  // ==========================================================



  const groupedExpenses =

    useMemo(() => {

      const groups: {

        label: string;

        items: Expense[];

      }[] = [];



      filteredExpenses.forEach(

        (expense) => {

          const label =

            monthLabel(

              expense.date

            );



          const existing =

            groups.find(

              (group) =>

                group.label ===

                label

            );



          if (existing) {

            existing.items.push(

              expense

            );

          } else {

            groups.push({

              label,

              items: [

                expense,

              ],

            });

          }

        }

      );



      return groups;

    }, [

      filteredExpenses,

    ]);



  // ==========================================================

  // ACTIONS

  // ==========================================================



  function handleAddExpense() {

    router.replace({

      pathname: "/",

      params: {

        reset: "true",

      },

    });

  }



  function handleCurrency(

    currency: CurrencyFilter

  ) {

    if (

      currencyFilter ===

        currency &&

      currency !== "ALL"

    ) {

      setCurrencyFilter(

        "ALL"

      );



      return;

    }



    setCurrencyFilter(

      currency

    );

  }



  function handleCategory(

    category: string

  ) {

    setCategoryFilter(

      categoryFilter ===

        category

        ? null

        : category

    );

  }



  function scrollCategories(

    direction:

      | "left"

      | "right"

  ) {

    const amount = 160;



    const next =

      direction === "right"

        ? categoryScrollX +

          amount

        : Math.max(

            0,

            categoryScrollX -

              amount

          );



    categoryScrollRef.current?.scrollTo(

      {

        x: next,

        animated: true,

      }

    );



    setCategoryScrollX(

      next

    );

  }



  // ==========================================================

  // LOADING

  // ==========================================================



  if (loading) {

    return (

      <View

        style={

          styles.loadingScreen

        }

      >

        <ActivityIndicator

          size="large"

          color={C.purple}

        />



        <Text

          style={

            styles.loadingText

          }

        >

          Loading transactions...

        </Text>

      </View>

    );

  }



  // ==========================================================

  // UI

  // ==========================================================



  return (

    <View

      style={styles.outside}

    >

      <View

        style={styles.phone}

      >

        <ScrollView

          style={{

            flex: 1,

          }}

          contentContainerStyle={{

            paddingBottom: 30,

          }}

          showsVerticalScrollIndicator={

            false

          }

        >

          {/* HEADER */}



          <View

            style={

              styles.header

            }

          >

            <View>

              <Text

                style={

                  styles.eyebrow

                }

              >

                MY TRANSACTIONS

              </Text>



              <Text

                style={

                  styles.headerTitle

                }

              >

                Transactions

              </Text>

            </View>



            <Pressable

              onPress={

                handleAddExpense

              }

              style={

                styles.addButton

              }

            >

              <Ionicons

                name="add"

                size={17}

                color={

                  C.purple

                }

              />



              <Text

                style={

                  styles.addButtonText

                }

              >

                Add Expense

              </Text>

            </Pressable>

          </View>



          {/* CURRENCY FILTER */}



          <View

            style={

              styles.currencyTabs

            }

          >

            {(

              [

                "ALL",

                "VND",

                "USD",

                "EUR",

              ] as CurrencyFilter[]

            ).map(

              (item) => {

                const active =

                  currencyFilter ===

                  item;



                return (

                  <Pressable

                    key={

                      item

                    }

                    onPress={() =>

                      handleCurrency(

                        item

                      )

                    }

                    style={[

                      styles.currencyTab,

                      active &&

                        styles.currencyTabActive,

                    ]}

                  >

                    <Text

                      style={[

                        styles.currencyTabText,

                        active &&

                          styles.currencyTabTextActive,

                      ]}

                    >

                      {item ===

                      "ALL"

                        ? "All"

                        : item}

                    </Text>

                  </Pressable>

                );

              }

            )}

          </View>



          {/* PERIOD FILTER */}



          <ScrollView

            horizontal

            showsHorizontalScrollIndicator={

              false

            }

            contentContainerStyle={

              styles.periodTabs

            }

          >

            {(

              [

                [

                  "all",

                  "All",

                ],

                [

                  "today",

                  "Today",

                ],

                [

                  "yesterday",

                  "Yesterday",

                ],

                [

                  "7days",

                  "7 Days",

                ],

              ] as [

                PeriodFilter,

                string

              ][]

            ).map(

              ([

                value,

                label,

              ]) => {

                const active =

                  periodFilter ===

                  value;



                return (

                  <Pressable

                    key={

                      value

                    }

                    onPress={() =>

                      setPeriodFilter(

                        value

                      )

                    }

                    style={[

                      styles.periodTab,

                      active &&

                        styles.periodTabActive,

                    ]}

                  >

                    <Text

                      style={[

                        styles.periodTabText,

                        active &&

                          styles.periodTabTextActive,

                      ]}

                    >

                      {label}

                    </Text>

                  </Pressable>

                );

              }

            )}

          </ScrollView>



          {/* ACTIVE CATEGORY */}



          {categoryFilter && (

            <View

              style={

                styles.activeFilterWrap

              }

            >

              <Text

                style={

                  styles.activeFilterLabel

                }

              >

                Filter

              </Text>



              <Pressable

                onPress={() =>

                  setCategoryFilter(

                    null

                  )

                }

                style={

                  styles.activeFilterChip

                }

              >

                <Text

                  style={

                    styles.activeFilterText

                  }

                >

                  {categoryFilter}

                </Text>



                <Ionicons

                  name="close"

                  size={13}

                  color={

                    C.purple

                  }

                />

              </Pressable>

            </View>

          )}



          {/* TOTAL */}



          <View

            style={

              styles.section

            }

          >

            <Text

              style={

                styles.sectionTitle

              }

            >

              Total spending

            </Text>



            {currencyTotals.length >

            0 ? (

              <View

                style={

                  styles.totalRow

                }

              >

                {currencyTotals.map(

                  (item) => {

                    const active =

                      currencyFilter ===

                      item.currency;



                    return (

                      <Pressable

                        key={

                          item.currency

                        }

                        onPress={() =>

                          handleCurrency(

                            item.currency

                          )

                        }

                        style={[

                          styles.totalItem,

                          active &&

                            styles.totalItemActive,

                        ]}

                      >

                        <View

                          style={

                            styles.totalCurrencyRow

                          }

                        >

                          <Text

                            style={[

                              styles.totalCurrency,

                              active &&

                                styles.totalCurrencyActive,

                            ]}

                          >

                            {

                              item.currency

                            }

                          </Text>



                          {active && (

                            <Ionicons

                              name="checkmark-circle"

                              size={

                                13

                              }

                              color={

                                C.purple

                              }

                            />

                          )}

                        </View>



                        <Text

                          style={

                            styles.totalAmount

                          }

                          numberOfLines={

                            1

                          }

                        >

                          {formatAmount(

                            item.total,

                            item.currency

                          )}

                        </Text>

                      </Pressable>

                    );

                  }

                )}

              </View>

            ) : (

              <Text

                style={

                  styles.noDataText

                }

              >

                No spending for

                this selection.

              </Text>

            )}

          </View>



          {/* CATEGORY */}



          {categoryTotals.length >

            0 && (

            <View

              style={

                styles.categorySection

              }

            >

              <View

                style={

                  styles.categoryTitleRow

                }

              >

                <Text

                  style={

                    styles.sectionTitle

                  }

                >

                  Spending by category

                </Text>



                <View

                  style={

                    styles.arrowGroup

                  }

                >

                  <Pressable

                    onPress={() =>

                      scrollCategories(

                        "left"

                      )

                    }

                    style={

                      styles.arrowButton

                    }

                  >

                    <Ionicons

                      name="chevron-back"

                      size={15}

                      color={

                        C.secondary

                      }

                    />

                  </Pressable>



                  <Pressable

                    onPress={() =>

                      scrollCategories(

                        "right"

                      )

                    }

                    style={

                      styles.arrowButton

                    }

                  >

                    <Ionicons

                      name="chevron-forward"

                      size={15}

                      color={

                        C.secondary

                      }

                    />

                  </Pressable>

                </View>

              </View>



              <ScrollView

                ref={

                  categoryScrollRef

                }

                horizontal

                showsHorizontalScrollIndicator={

                  false

                }

                onScroll={(event) =>

                  setCategoryScrollX(

                    event

                      .nativeEvent

                      .contentOffset

                      .x

                  )

                }

                scrollEventThrottle={

                  16

                }

                contentContainerStyle={

                  styles.categoryScroll

                }

              >

                {categoryTotals.map(

                  (item) => (

                    <CategoryCard

                      key={

                        item.category

                      }

                      category={

                        item.category

                      }

                      totals={

                        item.totals

                      }

                      active={

                        categoryFilter ===

                        item.category

                      }

                      onPress={() =>

                        handleCategory(

                          item.category

                        )

                      }

                    />

                  )

                )}

              </ScrollView>

            </View>

          )}



          {/* HISTORY */}



          <View

            style={

              styles.historyHeader

            }

          >

            <Text

              style={

                styles.sectionTitle

              }

            >

              Transaction history

            </Text>



            <Text

              style={

                styles.transactionCount

              }

            >

              {

                filteredExpenses.length

              }{" "}

              transaction

              {filteredExpenses.length !==

              1

                ? "s"

                : ""}

            </Text>

          </View>



          {filteredExpenses.length ===

          0 ? (

            <View

              style={

                styles.emptyCard

              }

            >

              <Ionicons

                name="search-outline"

                size={24}

                color={

                  C.purple

                }

              />



              <Text

                style={

                  styles.emptyTitle

                }

              >

                No transactions

              </Text>



              <Text

                style={

                  styles.emptyText

                }

              >

                No transactions

                match these filters.

              </Text>



              <Pressable

                onPress={() => {

                  setCurrencyFilter(

                    "ALL"

                  );



                  setPeriodFilter(

                    "all"

                  );



                  setCategoryFilter(

                    null

                  );

                }}

                style={

                  styles.clearButton

                }

              >

                <Text

                  style={

                    styles.clearButtonText

                  }

                >

                  Clear filters

                </Text>

              </Pressable>

            </View>

          ) : (

            groupedExpenses.map(

              (group) => (

                <View

                  key={

                    group.label

                  }

                  style={

                    styles.monthSection

                  }

                >

                  <Text

                    style={

                      styles.monthTitle

                    }

                  >

                    {

                      group.label

                    }

                  </Text>



                  <View

                    style={

                      styles.listCard

                    }

                  >

                    {group.items.map(

                      (

                        expense,

                        index

                      ) => (

                        <TransactionRow

                          key={

                            expense.id

                          }

                          expense={

                            expense

                          }

                          last={

                            index ===

                            group

                              .items

                              .length -

                              1

                          }

                        />

                      )

                    )}

                  </View>

                </View>

              )

            )

          )}

        </ScrollView>



        {/* NAV */}



        <View

          style={styles.nav}

        >

          <NavButton

            label="Home"

            icon="home"

            onPress={() =>

              router.replace(

                "/"

              )

            }

          />



          <NavButton

            label="Transactions"

            icon="list"

            active

            onPress={() => {}}

          />



          <NavButton

            label="Analytics"

            icon="bar-chart"

            onPress={() =>

              router.replace(

                "/analytics"

              )

            }

          />

        </View>

      </View>

    </View>

  );

}



// ============================================================

// CATEGORY CARD

// ============================================================



function CategoryCard({

  category,

  totals,

  active,

  onPress,

}: {

  category: string;

  totals: Record<

    string,

    number

  >;

  active: boolean;

  onPress: () => void;

}) {

  const meta =

    CATEGORY_META[

      category

    ] ||

    CATEGORY_META.Other;



  const currencies = [

    "VND",

    "USD",

    "EUR",

  ].filter(

    (currency) =>

      totals[currency] != null

  );



  return (

    <Pressable

      onPress={onPress}

      style={[

        styles.categoryCard,

        active &&

          styles.categoryCardActive,

      ]}

    >

      <View

        style={

          styles.categoryHeader

        }

      >

        <View

          style={[

            styles.categoryIcon,

            {

              backgroundColor:

                meta.background,

            },

          ]}

        >

          <Ionicons

            name={meta.icon}

            size={16}

            color={meta.color}

          />

        </View>



        <Text

          style={[

            styles.categoryName,

            active &&

              styles.categoryNameActive,

          ]}

        >

          {category}

        </Text>



        {active && (

          <Ionicons

            name="checkmark-circle"

            size={15}

            color={C.purple}

          />

        )}

      </View>



      {currencies.map(

        (currency) => (

          <View

            key={currency}

            style={

              styles.categoryAmountRow

            }

          >

            <Text

              style={

                styles.categoryCurrency

              }

            >

              {currency}

            </Text>



            <Text

              style={

                styles.categoryAmount

              }

            >

              {formatAmount(

                totals[currency],

                currency

              )}

            </Text>

          </View>

        )

      )}

    </Pressable>

  );

}



// ============================================================

// TRANSACTION ROW

// ============================================================



function TransactionRow({

  expense,

  last,

}: {

  expense: Expense;

  last: boolean;

}) {

  const category =

    categoryOf(

      expense

    );



  const meta =

    CATEGORY_META[

      category

    ] ||

    CATEGORY_META.Other;



  const currency =

    currencyOf(

      expense

    );



  return (

    <View

      style={[

        styles.transactionRow,

        !last &&

          styles.transactionDivider,

      ]}

    >

      <View

        style={[

          styles.transactionIcon,

          {

            backgroundColor:

              meta.background,

          },

        ]}

      >

        <Ionicons

          name={meta.icon}

          size={17}

          color={meta.color}

        />

      </View>



      <View

        style={

          styles.transactionMain

        }

      >

        <Text

          style={

            styles.transactionDescription

          }

          numberOfLines={1}

        >

          {expense.description ||

            category}

        </Text>



        <Text

          style={

            styles.transactionMeta

          }

          numberOfLines={1}

        >

          {category}



          {expense.location

            ? ` · ${expense.location}`

            : ""}



          {` · ${formatDateLabel(

            expense.date

          )}`}

        </Text>

      </View>



      <Text

        style={

          styles.transactionAmount

        }

        numberOfLines={1}

      >

        {formatAmount(

          Number(

            expense.amount ||

              0

          ),

          currency

        )}

      </Text>

    </View>

  );

}



// ============================================================

// NAV

// ============================================================



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

      style={

        styles.navButton

      }

    >

      <Ionicons

        name={

          active

            ? icon

            : `${icon}-outline`

        }

        size={19}

        color={

          active

            ? C.purple

            : "#8189A4"

        }

      />



      <Text

        style={[

          styles.navText,

          active &&

            styles.navTextActive,

        ]}

      >

        {label}

      </Text>

    </Pressable>

  );

}



// ============================================================

// STYLES

// ============================================================



const styles =

  StyleSheet.create({

    outside: {

      flex: 1,

      backgroundColor:

        C.outside,

      alignItems: "center",

    },



    phone: {

      flex: 1,

      width: "100%",

      maxWidth: 390,

      backgroundColor:

        C.white,

    },



    loadingScreen: {

      flex: 1,

      alignItems: "center",

      justifyContent:

        "center",

      backgroundColor:

        C.outside,

    },



    loadingText: {

      marginTop: 10,

      fontSize: 12,

      color: C.muted,

    },



    // HEADER



    header: {

      minHeight: 82,

      paddingHorizontal: 18,

      paddingTop: 14,

      paddingBottom: 12,

      flexDirection: "row",

      alignItems: "center",

      justifyContent:

        "space-between",

      borderBottomWidth: 1,

      borderBottomColor:

        "#F3F3F7",

    },



    eyebrow: {

      fontSize: 9,

      fontWeight: "700",

      letterSpacing: 0.8,

      color: C.purple,

    },



    headerTitle: {

      marginTop: 3,

      fontSize: 22,

      lineHeight: 27,

      fontWeight: "700",

      color: C.navy,

    },



    addButton: {

      height: 38,

      paddingHorizontal: 12,

      borderRadius: 9,

      flexDirection: "row",

      alignItems: "center",

      justifyContent:

        "center",

      gap: 5,

      backgroundColor:

        C.purpleSoft,

      borderWidth: 1,

      borderColor:

        C.purpleBorder,

    },



    addButtonText: {

      fontSize: 11.5,

      fontWeight: "600",

      color: C.purple,

    },



    // CURRENCY



    currencyTabs: {

      marginTop: 15,

      marginHorizontal: 18,

      height: 43,

      padding: 3,

      borderRadius: 11,

      backgroundColor:

        "#F3F4F8",

      flexDirection: "row",

    },



    currencyTab: {

      flex: 1,

      borderRadius: 9,

      alignItems: "center",

      justifyContent:

        "center",

    },



    currencyTabActive: {

      backgroundColor:

        C.purple,

    },



    currencyTabText: {

      fontSize: 11.5,

      fontWeight: "500",

      color: C.secondary,

    },



    currencyTabTextActive: {

      color: "#FFFFFF",

      fontWeight: "600",

    },



    // PERIOD



    periodTabs: {

      paddingHorizontal: 18,

      paddingTop: 11,

      paddingBottom: 3,

      gap: 7,

    },



    periodTab: {

      height: 33,

      minWidth: 70,

      paddingHorizontal: 13,

      borderRadius: 17,

      borderWidth: 1,

      borderColor: C.line,

      backgroundColor:

        C.white,

      alignItems: "center",

      justifyContent:

        "center",

    },



    periodTabActive: {

      borderColor:

        C.purpleBorder,

      backgroundColor:

        C.purpleLight,

    },



    periodTabText: {

      fontSize: 10.5,

      fontWeight: "500",

      color: C.muted,

    },



    periodTabTextActive: {

      color: C.purple,

      fontWeight: "600",

    },



    // ACTIVE FILTER



    activeFilterWrap: {

      marginTop: 13,

      paddingHorizontal: 18,

      flexDirection: "row",

      alignItems: "center",

      gap: 8,

    },



    activeFilterLabel: {

      fontSize: 10,

      color: C.muted,

    },



    activeFilterChip: {

      minHeight: 28,

      paddingHorizontal: 10,

      borderRadius: 14,

      backgroundColor:

        C.purpleLight,

      borderWidth: 1,

      borderColor:

        C.purpleBorder,

      flexDirection: "row",

      alignItems: "center",

      gap: 5,

    },



    activeFilterText: {

      fontSize: 10.5,

      fontWeight: "600",

      color: C.purple,

    },



    // GENERAL



    section: {

      marginTop: 25,

      paddingHorizontal: 18,

    },



    sectionTitle: {

      fontSize: 15,

      lineHeight: 20,

      fontWeight: "600",

      color: C.navy,

    },



    noDataText: {

      marginTop: 12,

      fontSize: 11,

      color: C.muted,

    },



    // TOTAL



    totalRow: {

      marginTop: 13,

      flexDirection: "row",

      gap: 8,

    },



    totalItem: {

      flex: 1,

      minWidth: 0,

      paddingVertical: 11,

      paddingHorizontal: 10,

      borderRadius: 10,

      backgroundColor:

        "#F8F8FC",

      borderWidth: 1,

      borderColor:

        "#EEEEF5",

    },



    totalItemActive: {

      backgroundColor:

        C.purpleSoft,

      borderColor:

        C.purple,

    },



    totalCurrencyRow: {

      flexDirection: "row",

      alignItems: "center",

      justifyContent:

        "space-between",

    },



    totalCurrency: {

      fontSize: 9,

      lineHeight: 12,

      fontWeight: "600",

      color: C.muted,

    },



    totalCurrencyActive: {

      color: C.purple,

    },



    totalAmount: {

      marginTop: 4,

      fontSize: 15,

      lineHeight: 20,

      fontWeight: "700",

      color: C.navy,

    },



    // CATEGORY



    categorySection: {

      marginTop: 25,

    },



    categoryTitleRow: {

      paddingHorizontal: 18,

      flexDirection: "row",

      alignItems: "center",

      justifyContent:

        "space-between",

    },



    arrowGroup: {

      flexDirection: "row",

      gap: 5,

    },



    arrowButton: {

      width: 28,

      height: 28,

      borderRadius: 14,

      backgroundColor:

        "rgba(85,71,255,0.07)",

      borderWidth: 1,

      borderColor:

        "rgba(85,71,255,0.12)",

      alignItems: "center",

      justifyContent:

        "center",

    },



    categoryScroll: {

      paddingHorizontal: 18,

      paddingTop: 12,

      paddingBottom: 3,

      gap: 9,

    },



    categoryCard: {

      width: 145,

      minHeight: 105,

      padding: 11,

      borderRadius: 11,

      backgroundColor:

        C.white,

      borderWidth: 1,

      borderColor: C.line,

    },



    categoryCardActive: {

      backgroundColor:

        C.purpleSoft,

      borderColor:

        C.purple,

    },



    categoryHeader: {

      flexDirection: "row",

      alignItems: "center",

      marginBottom: 10,

    },



    categoryIcon: {

      width: 29,

      height: 29,

      borderRadius: 8,

      alignItems: "center",

      justifyContent:

        "center",

    },



    categoryName: {

      flex: 1,

      marginLeft: 8,

      fontSize: 11.5,

      fontWeight: "600",

      color: C.text,

    },



    categoryNameActive: {

      color: C.purple,

    },



    categoryAmountRow: {

      marginTop: 4,

    },



    categoryCurrency: {

      fontSize: 8,

      fontWeight: "600",

      color: C.muted,

    },



    categoryAmount: {

      marginTop: 1,

      fontSize: 12,

      lineHeight: 16,

      fontWeight: "600",

      color: C.navy,

    },





    noCategorySpending: {

      marginTop: 5,

      fontSize: 10,

      fontWeight: "400",

      color: C.muted,

    },





    // HISTORY



    historyHeader: {

      marginTop: 27,

      paddingHorizontal: 18,

      flexDirection: "row",

      alignItems: "center",

      justifyContent:

        "space-between",

    },



    transactionCount: {

      fontSize: 10,

      color: C.muted,

    },



    monthSection: {

      marginTop: 18,

    },



    monthTitle: {

      paddingHorizontal: 18,

      marginBottom: 9,

      fontSize: 12,

      lineHeight: 16,

      fontWeight: "600",

      color: C.secondary,

    },



    listCard: {

      marginHorizontal: 18,

      borderWidth: 1,

      borderColor: C.line,

      borderRadius: 12,

      overflow: "hidden",

      backgroundColor:

        C.white,

    },



    transactionRow: {

      minHeight: 68,

      paddingHorizontal: 11,

      flexDirection: "row",

      alignItems: "center",

    },



    transactionDivider: {

      borderBottomWidth: 1,

      borderBottomColor:

        "#F0F1F5",

    },



    transactionIcon: {

      width: 38,

      height: 38,

      borderRadius: 10,

      alignItems: "center",

      justifyContent:

        "center",

      marginRight: 10,

    },



    transactionMain: {

      flex: 1,

      minWidth: 0,

    },



    transactionDescription: {

      fontSize: 12.5,

      lineHeight: 17,

      fontWeight: "600",

      color: C.text,

    },



    transactionMeta: {

      marginTop: 3,

      fontSize: 9.5,

      lineHeight: 13,

      fontWeight: "400",

      color: C.muted,

    },



    transactionAmount: {

      maxWidth: 105,

      marginLeft: 9,

      fontSize: 12.5,

      lineHeight: 17,

      fontWeight: "600",

      color: C.navy,

    },



    // EMPTY



    emptyCard: {

      marginTop: 16,

      marginHorizontal: 18,

      minHeight: 170,

      borderWidth: 1,

      borderColor: C.line,

      borderRadius: 12,

      alignItems: "center",

      justifyContent:

        "center",

      padding: 20,

    },



    emptyTitle: {

      marginTop: 9,

      fontSize: 13,

      fontWeight: "600",

      color: C.text,

    },



    emptyText: {

      marginTop: 4,

      fontSize: 10.5,

      color: C.muted,

      textAlign: "center",

    },



    clearButton: {

      marginTop: 13,

      height: 31,

      paddingHorizontal: 12,

      borderRadius: 8,

      backgroundColor:

        C.purpleLight,

      alignItems: "center",

      justifyContent:

        "center",

    },



    clearButtonText: {

      fontSize: 10.5,

      fontWeight: "600",

      color: C.purple,

    },



    // NAV



    nav: {

      height: 61,

      borderTopWidth: 1,

      borderTopColor:

        C.line,

      backgroundColor:

        C.white,

      flexDirection: "row",

    },



    navButton: {

      flex: 1,

      alignItems: "center",

      justifyContent:

        "center",

    },



    navText: {

      marginTop: 4,

      fontSize: 10,

      fontWeight: "400",

      color: "#8189A4",

    },



    navTextActive: {

      fontWeight: "600",

      color: C.purple,

    },

  });