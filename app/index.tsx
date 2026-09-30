import {

  useCallback,

  useEffect,

  useMemo,

  useState,

} from "react";



import {

  View,

  Text,

  TextInput,

  Pressable,

  Alert,

  ScrollView,

  KeyboardAvoidingView,

  Platform,

  ActivityIndicator,

} from "react-native";



import {

  useRouter,

  useFocusEffect,

  useLocalSearchParams,

} from "expo-router";



import { Ionicons } from "@expo/vector-icons";



import {

  useAudioRecorder,

  useAudioRecorderState,

  RecordingPresets,

  AudioModule,

  setAudioModeAsync,

} from "expo-audio";



import * as ImagePicker from "expo-image-picker";

import * as ImageManipulator from "expo-image-manipulator";



import { fetch as expoFetch } from "expo/fetch";



import {

  loadExpenses,

  type Expense,

} from "../utils/storage";



// ============================================================

// DESIGN TOKENS — MATCH MOCKUP

// ============================================================



const C = {

  outside: "#F4F6FB",

  white: "#FFFFFF",



  navy: "#080D4F",

  text: "#171A3F",

  secondary: "#596184",

  muted: "#8990A8",



  purple: "#5547FF",

  purpleDark: "#4538F2",

  purpleLight: "#F1EFFF",

  purpleSoft: "#F7F6FF",

  purpleBorder: "#DDD9FF",



  blue: "#2585E8",

  blueLight: "#EEF7FF",



  green: "#0B9B82",

  greenLight: "#EAF9F5",



  positive: "#0BAA72",

  negative: "#E24B5B",



  line: "#E9EBF3",

};



// ============================================================

// API

// ============================================================



const DEV_API_URL =

  Platform.OS === "android"

    ? "http://10.0.2.2:3000"

    : "http://localhost:3000";



const API_URL =

  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ||

  (__DEV__ ? DEV_API_URL : "");



function getApiUrl(path: string) {

  if (!API_URL) {

    throw new Error(

      "Production API URL is not configured. Set EXPO_PUBLIC_API_URL."

    );

  }



  return `${API_URL}${path}`;

}



// ============================================================

// HELPERS

// ============================================================



function getLocalDate(offset = 0) {

  const now = new Date();



  now.setDate(

    now.getDate() + offset

  );



  const year =

    now.getFullYear();



  const month = String(

    now.getMonth() + 1

  ).padStart(2, "0");



  const day = String(

    now.getDate()

  ).padStart(2, "0");



  return `${year}-${month}-${day}`;

}



function expenseCurrency(

  expense: Expense

) {

  return (

    expense.currency || "VND"

  ).toUpperCase();

}



function formatMoney(

  value: number,

  currency: string

) {

  if (currency === "USD") {

    return `$${value.toLocaleString(

      "en-US",

      {

        maximumFractionDigits: 2,

      }

    )}`;

  }



  if (currency === "EUR") {

    return `€${value.toLocaleString(

      "en-US",

      {

        maximumFractionDigits: 2,

      }

    )}`;

  }



  return `₫${Math.round(

    value

  ).toLocaleString("en-US")}`;

}



// ============================================================

// SCREEN

// ============================================================



export default function HomeScreen() {

  const router = useRouter();



  const params =

    useLocalSearchParams<{

      reset?: string;

    }>();



  const [amount, setAmount] =

    useState("");



  const [currency, setCurrency] =

    useState("VND");



  const [

    description,

    setDescription,

  ] = useState("");



  const [location, setLocation] =

    useState("");



  const [category, setCategory] =

    useState("");



  const [date, setDate] =

    useState(getLocalDate());



  const [expenses, setExpenses] =

    useState<Expense[]>([]);



  const [

    manualOpen,

    setManualOpen,

  ] = useState(false);



  const [

    manualAiInput,

    setManualAiInput,

  ] = useState("");



  const [

    manualAiLoading,

    setManualAiLoading,

  ] = useState(false);



  const [

    voiceProcessing,

    setVoiceProcessing,

  ] = useState(false);



  const [

    receiptProcessing,

    setReceiptProcessing,

  ] = useState(false);



  const audioRecorder =

    useAudioRecorder(

      RecordingPresets.HIGH_QUALITY

    );



  const recorderState =

    useAudioRecorderState(

      audioRecorder

    );



  // ============================================================

  // AUDIO SETUP

  // ============================================================



  useEffect(() => {

    async function setupAudio() {

      try {

        const permission =

          await AudioModule

            .requestRecordingPermissionsAsync();



        if (!permission.granted) {

          return;

        }



        await setAudioModeAsync({

          playsInSilentMode: true,

          allowsRecording: true,

        });

      } catch (error) {

        console.error(

          "Audio setup error:",

          error

        );

      }

    }



    void setupAudio();

  }, []);



  // ============================================================

  // LOAD DATA

  // ============================================================



  useFocusEffect(

    useCallback(() => {

      async function load() {

        try {

          const data =

            await loadExpenses();



          setExpenses(data);

        } catch (error) {

          console.error(

            "Home load error:",

            error

          );

        }

      }



      void load();

    }, [])

  );



  // ============================================================

  // RESET

  // ============================================================



  useFocusEffect(

    useCallback(() => {

      if (

        params.reset === "true"

      ) {

        setAmount("");

        setCurrency("VND");

        setDescription("");

        setLocation("");

        setCategory("");

        setDate(getLocalDate());

        setManualOpen(false);

        setManualAiInput("");

        setManualAiLoading(false);



        router.setParams({

          reset: undefined,

        });

      }

    }, [

      params.reset,

      router,

    ])

  );



  // ============================================================

  // TODAY SUMMARY

  // ============================================================



  const summary =

    useMemo(() => {

      const today =

        getLocalDate();



      const yesterday =

        getLocalDate(-1);



      const current: Record<

        string,

        number

      > = {};



      const previous: Record<

        string,

        number

      > = {};



      expenses.forEach(

        (expense) => {

          const cur =

            expenseCurrency(

              expense

            );



          if (

            expense.date === today

          ) {

            current[cur] =

              (current[cur] || 0) +

              Number(

                expense.amount || 0

              );

          }



          if (

            expense.date ===

            yesterday

          ) {

            previous[cur] =

              (previous[cur] || 0) +

              Number(

                expense.amount || 0

              );

          }

        }

      );



      return {

        current,

        previous,

        currencies:

          Object.keys(current),

      };

    }, [expenses]);



  // ============================================================

  // AI PARSER

  // ============================================================



  function fillExpenseForm(

    expense: any

  ) {

    setAmount(

      expense?.amount != null

        ? String(expense.amount)

        : ""

    );



    setCurrency(

      expense?.currency ||

        "VND"

    );



    setCategory(

      expense?.category || ""

    );



    setDescription(

      expense?.note ||

        expense?.description ||

        ""

    );



    setLocation(

      expense?.location || ""

    );



    if (expense?.date) {

      setDate(expense.date);

    }



    setManualOpen(true);

  }



  async function parseExpenseText(

    text: string

  ) {

    const response =

      await fetch(

        getApiUrl(

          "/parse-expense"

        ),

        {

          method: "POST",



          headers: {

            "Content-Type":

              "application/json",

          },



          body: JSON.stringify({

            text,

          }),

        }

      );



    const expense =

      await response.json();

    console.log(
      "🧠 PARSE EXPENSE RESPONSE:",
      expense
    );


    if (!response.ok) {

      throw new Error(

        expense?.error ||

          "Failed to parse transaction"

      );

    }



    return expense;

  }



  async function handleManualAIFill() {

    const text = manualAiInput.trim();



    if (!text) {

      Alert.alert(

        "Describe your expense",

        "Type a natural sentence first, for example: ăn sáng tại nhà hàng Văn Hoa quận 6 20 euro."

      );

      return;

    }



    try {

      setManualAiLoading(true);



      const expense =

        await parseExpenseText(text);



      const parsedAmount =

        Number(expense?.amount);



      if (

        !Number.isFinite(parsedAmount) ||

        parsedAmount <= 0

      ) {

        throw new Error(

          "No valid amount was found."

        );

      }



      fillExpenseForm(expense);

    } catch (error) {

      console.error(

        "Manual AI fill error:",

        error

      );



      Alert.alert(

        "AI Fill Unavailable",

        "I couldn't understand that expense. You can edit the fields manually or try another sentence."

      );

    } finally {

      setManualAiLoading(false);

    }

  }



  // ============================================================

  // RECEIPT

  // ============================================================



  function handleScanReceipt() {
    console.log("📷 Receipt button pressed");

    if (Platform.OS === "web") {
      void chooseReceiptPhoto();
      return;
    }

    Alert.alert(
      "Add Receipt",
      "How would you like to add your receipt?",
      [
        {
          text: "Take Photo",
          onPress: takeReceiptPhoto,
        },
        {
          text: "Choose from Library",
          onPress: chooseReceiptPhoto,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  }



  async function processReceiptImage(

    imageUri: string

  ) {

    try {

      setReceiptProcessing(

        true

      );



      const resizedImage =

        await ImageManipulator

          .manipulateAsync(

            imageUri,

            [

              {

                resize: {

                  width: 1600,

                },

              },

            ],

            {

              compress: 0.7,



              format:

                ImageManipulator

                  .SaveFormat

                  .JPEG,

            }

          );



      let imageBlob: Blob;

      if (Platform.OS === "web") {
        imageBlob = await new Promise<Blob>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.onload = () => {
            if (xhr.response instanceof Blob) {
              resolve(xhr.response);
            } else {
              reject(new Error("Could not read receipt image."));
            }
          };

          xhr.onerror = () => {
            reject(new Error("Could not read receipt image."));
          };

          xhr.responseType = "blob";
          xhr.open("GET", resizedImage.uri, true);
          xhr.send();
        });
      } else {
        const imageResponse = await fetch(resizedImage.uri);
        imageBlob = await imageResponse.blob();
      }

      if (imageBlob.size === 0) {
        throw new Error("Receipt image is empty.");
      }

      const formData = new FormData();

      formData.append(
        "receipt",
        imageBlob,
        "receipt.jpg"
      );



      const response =

        await expoFetch(

          getApiUrl(

            "/scan-receipt"

          ),

          {

            method: "POST",

            body: formData,

          }

        );



      const rawText =

        await response.text();



      if (!response.ok) {

        throw new Error(

          rawText

        );

      }



      const expense =

        JSON.parse(rawText);



      fillExpenseForm(

        expense

      );



      Alert.alert(

        "Receipt Scanned",

        "Please review the extracted transaction."

      );

    } catch (error) {

      console.error(

        "Receipt processing error:",

        error

      );



      Alert.alert(

        "Scan Unavailable",

        "Could not process this receipt. You can still enter it manually."

      );

    } finally {

      setReceiptProcessing(

        false

      );

    }

  }



  async function takeReceiptPhoto() {

    const permission =

      await ImagePicker

        .requestCameraPermissionsAsync();



    if (!permission.granted) {

      Alert.alert(

        "Camera Permission",

        "Camera access is required."

      );



      return;

    }



    const result =

      await ImagePicker

        .launchCameraAsync({

          mediaTypes: [

            "images",

          ],

          allowsEditing: false,

          quality: 0.7,

        });



    if (!result.canceled) {

      await processReceiptImage(

        result.assets[0].uri

      );

    }

  }



  async function chooseReceiptPhoto() {

    const result =

      await ImagePicker

        .launchImageLibraryAsync({

          mediaTypes: [

            "images",

          ],

          allowsEditing: false,

          quality: 0.7,

        });



    if (!result.canceled) {

      await processReceiptImage(

        result.assets[0].uri

      );

    }

  }



  // ============================================================

  // VOICE

  // ============================================================



  async function startRecording() {

    try {

      const permission =

        await AudioModule

          .requestRecordingPermissionsAsync();



      if (!permission.granted) {

        Alert.alert(

          "Microphone Permission",

          "Please allow microphone access."

        );



        return;

      }



      await audioRecorder

        .prepareToRecordAsync();



      audioRecorder.record();

    } catch (error) {

      console.error(

        "Start recording error:",

        error

      );



      Alert.alert(

        "Recording Error",

        "Could not start recording."

      );

    }

  }



  async function stopRecording() {

    try {

      await audioRecorder.stop();



      const uri =

        audioRecorder.uri;



      if (!uri) {

        throw new Error(

          "No audio file created."

        );

      }



      setVoiceProcessing(true);



      const audioResponse =

        await fetch(uri);



      if (!audioResponse.ok) {

        throw new Error(

          "Could not read audio."

        );

      }



      const audioBlob =

        await audioResponse.blob();



      if (

        audioBlob.size === 0

      ) {

        throw new Error(

          "Audio file is empty."

        );

      }



      const formData =

        new FormData();



      formData.append(

        "audio",

        audioBlob,

        "expense-recording.m4a"

      );

    const transcribeUrl = getApiUrl("/transcribe");

    console.log("🌐 TRANSCRIBE URL =", transcribeUrl);
    console.log("🌐 API_URL =", API_URL);

    const transcriptionResponse =
      await fetch(
        transcribeUrl,
        {
          method: "POST",
          body: formData,
        }
      );



      const transcription =

        await transcriptionResponse

          .json();

      console.log("🎙️ TRANSCRIPTION RESPONSE:", transcription); 



      if (

        !transcriptionResponse.ok

      ) {

        throw new Error(

          transcription?.error ||

            "Transcription failed."

        );

      }



      const transcript =

        transcription?.text

          ?.trim();



      if (!transcript) {

        throw new Error(

          "Empty transcript."

        );

      }



      const expense =

        await parseExpenseText(

          transcript

        );



      const parsedAmount =

        Number(

          expense?.amount

        );



      if (

        !Number.isFinite(

          parsedAmount

        ) ||

        parsedAmount <= 0

      ) {

        Alert.alert(

          "Voice Not Understood",

          `I heard:\n\n"${transcript}"`

        );



        return;

      }



      fillExpenseForm(

        expense

      );



      Alert.alert(

        "Transaction Ready",

        `I heard:\n\n"${transcript}"\n\nPlease review the details.`

      );

    } catch (error) {

      console.error(

        "Voice processing error:",

        error

      );



      Alert.alert(

        "Voice Unavailable",

        "Could not process the voice transaction."

      );

    } finally {

      setVoiceProcessing(false);

    }

  }



  // ============================================================

  // REVIEW

  // ============================================================



  function handleReview() {

    const parsedAmount =

      parseFloat(

        amount.replace(

          ",",

          "."

        )

      );



    if (

      !Number.isFinite(

        parsedAmount

      ) ||

      parsedAmount <= 0

    ) {

      Alert.alert(

        "Invalid Amount",

        "Please enter an amount greater than 0."

      );



      return;

    }



    if (

      !description.trim()

    ) {

      Alert.alert(

        "Missing Description",

        "Please enter a description."

      );



      return;

    }



    if (

      !/^\d{4}-\d{2}-\d{2}$/.test(

        date

      )

    ) {

      Alert.alert(

        "Invalid Date",

        "Use YYYY-MM-DD."

      );



      return;

    }



    const [

      year,

      month,

      day,

    ] = date

      .split("-")

      .map(Number);



    const enteredDate =

      new Date(

        year,

        month - 1,

        day

      );



    if (

      enteredDate.getFullYear() !==

        year ||

      enteredDate.getMonth() !==

        month - 1 ||

      enteredDate.getDate() !==

        day

    ) {

      Alert.alert(

        "Invalid Date",

        "Please enter a valid date."

      );



      return;

    }



    if (

      date > getLocalDate()

    ) {

      Alert.alert(

        "Future Date",

        "Please choose today or an earlier date."

      );



      return;

    }



    router.push({

      pathname: "/confirm",



      params: {

        amount:

          parsedAmount.toFixed(

            2

          ),



        currency,

        category,



        description:

          description.trim(),



        location:

          location.trim(),



        date,

      },

    });

  }



  // ============================================================

  // UI

  // ============================================================



  return (

    <KeyboardAvoidingView

      style={{

        flex: 1,

        backgroundColor:

          C.outside,

        alignItems: "center",

      }}

      behavior={

        Platform.OS === "ios"

          ? "padding"

          : undefined

      }

    >

      <View

        style={{

          flex: 1,

          width: "100%",

          maxWidth: 390,

          backgroundColor:

            C.white,

        }}

      >

        <ScrollView

          style={{

            flex: 1,

          }}

          contentContainerStyle={{

            paddingBottom: 22,

          }}

          keyboardShouldPersistTaps="handled"

          showsVerticalScrollIndicator={

            false

          }

        >

          {/* HEADER */}



          <View

            style={{

              height: 67,

              paddingHorizontal: 15,

              flexDirection: "row",

              alignItems: "center",

              borderBottomWidth: 1,

              borderBottomColor:

                "#F3F3F7",

            }}

          >

            <VoiceLogo />



            <View

              style={{

                flex: 1,

                marginLeft: 8,

              }}

            >

              <Text

                style={{

                  fontSize: 17,

                  lineHeight: 18,

                  fontWeight: "700",

                  color: C.navy,

                }}

              >

                InsightVoice

              </Text>



              <Text

                style={{

                  marginTop: 1,

                  fontSize: 11,

                  color:

                    C.secondary,

                }}

              >

                Ask the business, not the dashboard.

              </Text>

            </View>



            <Pressable

              onPress={() =>

                router.push(

                  "/more"

                )

              }

              style={{

                width: 30,

                height: 30,

                borderRadius: 15,

                backgroundColor:

                  C.purpleLight,

                alignItems: "center",

                justifyContent:

                  "center",

              }}

            >

              <Ionicons

                name="person"

                size={15}

                color={

                  C.purple

                }

              />

            </Pressable>

          </View>



          {/* DATA SOURCE */}



          <Pressable

            onPress={() =>

              router.push(

                "/source?from=personal"

              )

            }

            style={{

              height: 38,

              marginTop: 11,

              marginHorizontal: 15,

              paddingHorizontal: 10,

              borderRadius: 8,

              borderWidth: 1,

              borderColor:

                C.purpleBorder,

              backgroundColor:

                C.purpleSoft,

              flexDirection: "row",

              alignItems: "center",

            }}

          >

            <View

              style={{

                width: 22,

                height: 22,

                borderRadius: 6,

                backgroundColor:

                  "#E9E6FF",

                alignItems: "center",

                justifyContent:

                  "center",

              }}

            >

              <Ionicons

                name="person"

                size={12}

                color={

                  C.purple

                }

              />

            </View>



            <Text

              style={{

                flex: 1,

                marginLeft: 7,

                fontSize: 12,

                fontWeight: "600",

                color: "#393372",

              }}

            >

              My Transactions

            </Text>



            <Ionicons

              name="chevron-down"

              size={14}

              color={C.purple}

            />

          </Pressable>



          {/* GREETING */}



          <View

            style={{

              paddingHorizontal: 15,

              paddingTop: 17,

            }}

          >

            <Text

              style={{

                fontSize: 24,

                lineHeight: 29,

                fontWeight: "700",

                color: C.navy,

              }}

            >

              Good morning!

            </Text>



            <Text

              style={{

                marginTop: 3,

                fontSize: 14,

                lineHeight: 20,

                color:

                  C.secondary,

              }}

            >

              What would you like to add?

            </Text>

          </View>



          {/* 3 ACTIONS */}



          <View

            style={{

              flexDirection: "row",

              gap: 8,

              marginTop: 13,

              paddingHorizontal: 15,

            }}

          >

            <CaptureButton

              label={

                recorderState

                  .isRecording

                  ? "Stop"

                  : "Voice"

              }

              icon={

                recorderState

                  .isRecording

                  ? "stop"

                  : "mic"

              }

              background={

                recorderState

                  .isRecording

                  ? "#FFF0F1"

                  : "#F0EEFF"

              }

              iconBackground={

                recorderState

                  .isRecording

                  ? C.negative

                  : C.purple

              }

              textColor={

                recorderState

                  .isRecording

                  ? C.negative

                  : C.purpleDark

              }

              loading={

                voiceProcessing

              }

              onPress={() => {

                if (

                  recorderState

                    .isRecording

                ) {

                  void stopRecording();

                } else {

                  void startRecording();

                }

              }}

            />



            <CaptureButton

              label="Receipt"

              icon="camera"

              background={

                C.blueLight

              }

              iconBackground={

                C.blue

              }

              textColor={

                "#2879C7"

              }

              loading={

                receiptProcessing

              }

              onPress={

                handleScanReceipt

              }

            />



            <CaptureButton

              label="Manual"

              icon="document-text"

              background={

                C.greenLight

              }

              iconBackground={

                C.green

              }

              textColor={

                "#168A77"

              }

              onPress={() =>

                setManualOpen(

                  true

                )

              }

            />

          </View>



          {recorderState

            .isRecording && (

            <Text

              style={{

                marginTop: 8,

                textAlign: "center",

                fontSize: 12,

                fontWeight: "600",

                color:

                  C.negative,

              }}

            >

              Listening... tap Stop when finished

            </Text>

          )}



          {voiceProcessing && (

            <Text

              style={{

                marginTop: 8,

                textAlign: "center",

                fontSize: 12,

                fontWeight: "500",

                color: C.purple,

              }}

            >

              Transcribing and understanding...

            </Text>

          )}



          {/* MANUAL */}



          {manualOpen ? (

            <ManualForm

              amount={amount}

              setAmount={

                setAmount

              }

              currency={

                currency

              }

              setCurrency={

                setCurrency

              }

              manualAiInput={

                manualAiInput

              }

              setManualAiInput={

                setManualAiInput

              }

              manualAiLoading={

                manualAiLoading

              }

              aiFill={

                handleManualAIFill

              }

              description={

                description

              }

              setDescription={

                setDescription

              }

              location={

                location

              }

              setLocation={

                setLocation

              }

              date={date}

              setDate={setDate}

              category={

                category

              }

              close={() =>

                setManualOpen(

                  false

                )

              }

              review={

                handleReview

              }

            />

          ) : (

            <>

              {/* TODAY */}



              <View

                style={{

                  marginTop: 20,

                  paddingHorizontal:

                    15,

                }}

              >

                <Pressable

                  onPress={() =>

                    router.push(

                      "/history"

                    )

                  }

                  style={{

                    flexDirection:

                      "row",

                    alignItems:

                      "center",

                    justifyContent:

                      "space-between",

                  }}

                >

                  <View>

                    <Text

                      style={{

                        fontSize: 16,

                        fontWeight:

                          "700",

                        color:

                          C.navy,

                      }}

                    >

                      Today

                    </Text>



                    <Text

                      style={{

                        marginTop: 2,

                        fontSize: 11,

                        color:

                          C.muted,

                      }}

                    >

                      {new Date()

                        .toLocaleDateString(

                          "en-US",

                          {

                            month:

                              "short",

                            day:

                              "numeric",

                            year:

                              "numeric",

                          }

                        )}

                    </Text>

                  </View>



                  <Ionicons

                    name="chevron-forward"

                    size={17}

                    color="#666D8C"

                  />

                </Pressable>



                <TodayTotals

                  summary={

                    summary

                  }

                />



                <Pressable

                  onPress={() =>

                    router.push(

                      "/analytics"

                    )

                  }

                  style={{

                    height: 39,

                    marginTop: 12,

                    borderRadius: 7,

                    backgroundColor:

                      "#F0EDFF",

                    alignItems:

                      "center",

                    justifyContent:

                      "center",

                  }}

                >

                  <Text

                    style={{

                      fontSize: 12,

                      fontWeight:

                        "600",

                      color:

                        C.purple,

                    }}

                  >

                    View analytics →

                  </Text>

                </Pressable>

              </View>

            </>

          )}

        </ScrollView>



        {/* NAV */}



        <View

          style={{

            height: 61,

            borderTopWidth: 1,

            borderTopColor:

              C.line,

            backgroundColor:

              C.white,

            flexDirection: "row",

          }}

        >

          <NavButton

            label="Home"

            icon="home"

            active

            onPress={() =>

              router.replace("/")

            }

          />



          <NavButton

            label="Transactions"

            icon="list"

            onPress={() =>

              router.replace(

                "/history"

              )

            }

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

    </KeyboardAvoidingView>

  );

}



// ============================================================

// LOGO

// ============================================================



function VoiceLogo() {

  const bars = [

    11,

    21,

    31,

    22,

    12,

  ];



  return (

    <View

      style={{

        width: 36,

        height: 36,

        flexDirection: "row",

        gap: 2.5,

        alignItems: "center",

        justifyContent:

          "center",

      }}

    >

      {bars.map(

        (height, index) => (

          <View

            key={index}

            style={{

              width: 3.5,

              height,

              borderRadius: 4,

              backgroundColor:

                C.purple,

            }}

          />

        )

      )}

    </View>

  );

}



// ============================================================

// CAPTURE BUTTON

// ============================================================



function CaptureButton({

  label,

  icon,

  background,

  iconBackground,

  textColor,

  loading = false,

  onPress,

}: {

  label: string;

  icon: any;

  background: string;

  iconBackground: string;

  textColor: string;

  loading?: boolean;

  onPress: () => void;

}) {

  return (

    <Pressable

      onPress={onPress}

      disabled={loading}

      style={{

        flex: 1,

        height: 73,

        borderRadius: 9,

        backgroundColor:

          background,

        alignItems: "center",

        justifyContent:

          "center",

      }}

    >

      <View

        style={{

          width: 31,

          height: 31,

          borderRadius: 8,

          backgroundColor:

            iconBackground,

          alignItems: "center",

          justifyContent:

            "center",

        }}

      >

        {loading ? (

          <ActivityIndicator

            size="small"

            color="#FFFFFF"

          />

        ) : (

          <Ionicons

            name={icon}

            size={16}

            color="#FFFFFF"

          />

        )}

      </View>



      <Text

        style={{

          marginTop: 6,

          fontSize: 12,

          fontWeight: "600",

          color: textColor,

        }}

      >

        {label}

      </Text>

    </Pressable>

  );

}



// ============================================================

// TODAY

// ============================================================



function TodayTotals({

  summary,

}: {

  summary: {

    current: Record<

      string,

      number

    >;

    previous: Record<

      string,

      number

    >;

    currencies: string[];

  };

}) {

  if (

    summary.currencies

      .length === 0

  ) {

    return (

      <View

        style={{

          paddingTop: 12,

        }}

      >

        <Text

          style={{

            fontSize: 28,

            lineHeight: 34,

            fontWeight: "700",

            color: C.navy,

          }}

        >

          ₫0

        </Text>



        <Text

          style={{

            marginTop: 3,

            fontSize: 12,

            color: C.muted,

          }}

        >

          No spending recorded today

        </Text>

      </View>

    );

  }



  return (

    <View>

      {summary.currencies.map(

        (currency) => {

          const current =

            summary.current[

              currency

            ] || 0;



          const previous =

            summary.previous[

              currency

            ] || 0;



          const change =

            previous > 0

              ? ((current -

                    previous) /

                  previous) *

                100

              : null;



          return (

            <View

              key={currency}

              style={{

                paddingTop: 11,

              }}

            >

              <Text

                style={{

                  fontSize: 28,

                  lineHeight: 34,

                  fontWeight: "700",

                  color: C.navy,

                }}

              >

                {formatMoney(

                  current,

                  currency

                )}

              </Text>



              {change !==

              null ? (

                <Text

                  style={{

                    marginTop: 3,

                    fontSize: 12,

                    fontWeight: "600",

                    color:

                      change <= 0

                        ? C.positive

                        : C.negative,

                  }}

                >

                  {change <= 0

                    ? "↓"

                    : "↑"}{" "}

                  {Math.abs(

                    change

                  ).toFixed(0)}

                  % vs. yesterday

                </Text>

              ) : (

                <Text

                  style={{

                    marginTop: 3,

                    fontSize: 12,

                    color: C.muted,

                  }}

                >

                  No comparison available

                </Text>

              )}

            </View>

          );

        }

      )}

    </View>

  );

}



// ============================================================

// MANUAL FORM

// ============================================================



function ManualForm({

  amount,

  setAmount,

  currency,

  setCurrency,

  manualAiInput,

  setManualAiInput,

  manualAiLoading,

  aiFill,

  description,

  setDescription,

  location,

  setLocation,

  date,

  setDate,

  category,

  close,

  review,

}: any) {

  const currencies = [

    "VND",

    "USD",

    "EUR",

  ];



  return (

    <View

      style={{

        marginHorizontal: 15,

        marginTop: 17,

        padding: 13,

        borderRadius: 10,

        borderWidth: 1,

        borderColor: C.line,

        backgroundColor: C.white,

      }}

    >

      <View

        style={{

          flexDirection: "row",

          justifyContent:

            "space-between",

          alignItems: "center",

        }}

      >

        <Text

          style={{

            fontSize: 17,

            fontWeight: "700",

            color: C.navy,

          }}

        >

          Transaction details

        </Text>



        <Pressable

          onPress={close}

        >

          <Ionicons

            name="close"

            size={17}

            color={C.muted}

          />

        </Pressable>

      </View>



      <FieldLabel>

        Describe your expense

      </FieldLabel>



      <TextInput

        value={manualAiInput}

        onChangeText={

          setManualAiInput

        }

        placeholder="e.g. ăn sáng tại nhà hàng Văn Hoa quận 6 20 euro"

        placeholderTextColor="#A2A7B7"

        multiline

        textAlignVertical="top"

        style={{

          ...FIELD,

          height: 62,

          paddingTop: 10,

          paddingBottom: 10,

        }}

      />



      <Pressable

        onPress={aiFill}

        disabled={

          manualAiLoading ||

          !manualAiInput.trim()

        }

        style={{

          height: 36,

          marginTop: 8,

          borderRadius: 7,

          backgroundColor:

            C.purple,

          opacity:

            manualAiLoading ||

            !manualAiInput.trim()

              ? 0.45

              : 1,

          flexDirection: "row",

          alignItems: "center",

          justifyContent:

            "center",

        }}

      >

        {manualAiLoading ? (

          <ActivityIndicator

            size="small"

            color="#FFFFFF"

          />

        ) : (

          <>

            <Ionicons

              name="sparkles"

              size={13}

              color="#FFFFFF"

            />

            <Text

              style={{

                marginLeft: 6,

                fontSize: 12,

                fontWeight: "700",

                color: "#FFFFFF",

              }}

            >

              AI Fill

            </Text>

          </>

        )}

      </Pressable>



      <View

        style={{

          flexDirection: "row",

          alignItems: "center",

          marginTop: 12,

          marginBottom: 1,

        }}

      >

        <View

          style={{

            flex: 1,

            height: 1,

            backgroundColor:

              C.line,

          }}

        />

        <Text

          style={{

            marginHorizontal: 8,

            fontSize: 11,

            color: C.muted,

          }}

        >

          or edit manually

        </Text>

        <View

          style={{

            flex: 1,

            height: 1,

            backgroundColor:

              C.line,

          }}

        />

      </View>



      <FieldLabel>

        Amount *

      </FieldLabel>



      <TextInput

        value={amount}

        onChangeText={setAmount}

        keyboardType="decimal-pad"

        placeholder="0.00"

        placeholderTextColor="#A2A7B7"

        style={FIELD}

      />



      <FieldLabel>

        Currency

      </FieldLabel>



      <View

        style={{

          flexDirection: "row",

          gap: 6,

        }}

      >

        {currencies.map(

          (item) => {

            const active =

              currency === item;



            return (

              <Pressable

                key={item}

                onPress={() =>

                  setCurrency(item)

                }

                style={{

                  flex: 1,

                  height: 34,

                  borderRadius: 7,

                  borderWidth: 1,

                  borderColor: active

                    ? C.purple

                    : "#E5E7EF",

                  backgroundColor: active

                    ? C.purpleLight

                    : "#FCFCFE",

                  alignItems: "center",

                  justifyContent:

                    "center",

                }}

              >

                <Text

                  style={{

                    fontSize: 12,

                    fontWeight: "700",

                    color: active

                      ? C.purple

                      : C.secondary,

                  }}

                >

                  {item}

                </Text>

              </Pressable>

            );

          }

        )}

      </View>



      <FieldLabel>

        Description *

      </FieldLabel>



      <TextInput

        value={description}

        onChangeText={

          setDescription

        }

        placeholder="e.g. Breakfast at Văn Hoa"

        placeholderTextColor="#A2A7B7"

        style={FIELD}

      />



      <FieldLabel>

        Location

      </FieldLabel>



      <TextInput

        value={location}

        onChangeText={

          setLocation

        }

        placeholder="Optional"

        placeholderTextColor="#A2A7B7"

        style={FIELD}

      />



      <FieldLabel>

        Date

      </FieldLabel>



      <TextInput

        value={date}

        onChangeText={setDate}

        style={FIELD}

      />



      {category ? (

        <View

          style={{

            marginTop: 9,

            alignSelf:

              "flex-start",

            paddingHorizontal: 8,

            paddingVertical: 4,

            borderRadius: 6,

            backgroundColor:

              C.purpleLight,

          }}

        >

          <Text

            style={{

              fontSize: 11,

              color: C.purple,

            }}

          >

            {category}

          </Text>

        </View>

      ) : null}



      <Pressable

        onPress={review}

        style={{

          height: 39,

          marginTop: 13,

          borderRadius: 7,

          backgroundColor:

            C.purple,

          alignItems: "center",

          justifyContent:

            "center",

        }}

      >

        <Text

          style={{

            fontSize: 12,

            fontWeight: "600",

            color: "#FFFFFF",

          }}

        >

          Review transaction →

        </Text>

      </Pressable>

    </View>

  );

}



const FIELD = {

  height: 38,

  paddingHorizontal: 10,

  borderRadius: 7,

  borderWidth: 1,

  borderColor: "#E5E7EF",

  backgroundColor: "#FCFCFE",

  fontSize: 14,

  color: C.text,

  outlineStyle: "none" as any,

};



function FieldLabel({

  children,

}: {

  children:

    React.ReactNode;

}) {

  return (

    <Text

      style={{

        marginTop: 10,

        marginBottom: 5,

        fontSize: 12,

        fontWeight: "600",

        color: "#616883",

      }}

    >

      {children}

    </Text>

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

      style={{

        flex: 1,

        alignItems: "center",

        justifyContent:

          "center",

      }}

    >

      <Ionicons

        name={

          active

            ? icon

            : `${icon}-outline`

        }

        size={20}

        color={

          active

            ? C.purple

            : "#8189A4"

        }

      />



      <Text

        style={{

          marginTop: 3,

          fontSize: 11,

          fontWeight: active

            ? "700"

            : "500",

          color: active

            ? C.purple

            : "#8189A4",

        }}

      >

        {label}

      </Text>

    </Pressable>

  );

}