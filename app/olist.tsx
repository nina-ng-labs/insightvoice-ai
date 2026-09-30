import {

  View,

  Text,

  Pressable,

  StyleSheet,

  ScrollView,

  ActivityIndicator,

  Alert,

  TextInput,
  Platform,

} from "react-native";



import { useRef, useState } from "react";

import { Audio } from "expo-av";

import { useRouter } from "expo-router";

import { Ionicons } from "@expo/vector-icons";



export default function OlistScreen() {

  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const resultY = useRef(0);
  const [sourceMenuOpen, setSourceMenuOpen] = useState(false);
  const [olistTab, setOlistTab] = useState<"home" | "analytics">("home");
  const [analyticsKind, setAnalyticsKind] = useState<"revenue" | "orders" | "categories" | "sellers">("revenue");
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");
  const [manualOpen, setManualOpen] = useState(false);

  async function openOlistAnalytics() {
    setOlistTab("analytics");
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    if (analyticsData) return;
    setAnalyticsLoading(true);
    setAnalyticsError("");
    try {
      const [revenueResponse, sellerResponse] = await Promise.all([
        fetch(`${API_URL}/api/olist/revenue`),
        fetch(`${API_URL}/api/olist/sellers`),
      ]);
      if (!revenueResponse.ok || !sellerResponse.ok) throw new Error("Olist API unavailable");
      const [revenue, sellers] = await Promise.all([revenueResponse.json(), sellerResponse.json()]);
      setAnalyticsData({ revenue, sellers });
    } catch (error) {
      console.error(error);
      setAnalyticsError("Could not load Olist analytics. Check the Python server and retry.");
    } finally {
      setAnalyticsLoading(false);
    }
  }




  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");



  const [recording, setRecording] =

    useState<Audio.Recording | null>(null);



  const [voiceProcessing, setVoiceProcessing] =

    useState(false);



  const [transcript, setTranscript] =

    useState("");



  const [typedQuestion, setTypedQuestion] =

    useState("");



  const NODE_API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") || (Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000");



  const API_URL = process.env.EXPO_PUBLIC_OLIST_API_URL?.replace(/\/$/, "") || (Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://localhost:8000");



  async function runRevenueInvestigation() {

    try {

      setLoading(true);

      setResult(null);
      setErrorMessage("");



      const response = await fetch(

        `${API_URL}/api/olist/revenue`

      );



      if (!response.ok) {

        throw new Error("Olist API failed");

      }



      const data = await response.json();



      setResult(data);

    } catch (error) {

      console.error(error);
      setErrorMessage("Could not reach Olist analytics. Check your connection and try again.");

      Alert.alert(

        "Investigation Error",

        "Could not connect to the Olist analytics engine."

      );

    } finally {

      setLoading(false);

    }

  }



  async function runSellerInvestigation() {

    try {

      setLoading(true);

      setResult(null);
      setErrorMessage("");



      const response = await fetch(

        `${API_URL}/api/olist/sellers`

      );



      if (!response.ok) {

        throw new Error("Olist API failed");

      }



      const data = await response.json();

      setResult(data);

    } catch (error) {

      console.error(error);
      setErrorMessage("Could not reach Olist analytics. Check your connection and try again.");

      Alert.alert(

        "Investigation Error",

        "Could not run the seller investigation."

      );

    } finally {

      setLoading(false);

    }

  }



  async function runAnomalyInvestigation() {

    try {

      setLoading(true);

      setResult(null);
      setErrorMessage("");



      const response = await fetch(

        `${API_URL}/api/olist/anomalies`

      );



      if (!response.ok) {

        throw new Error("Olist API failed");

      }



      const data = await response.json();

      setResult(data);

    } catch (error) {

      console.error(error);
      setErrorMessage("Could not reach Olist analytics. Check your connection and try again.");

      Alert.alert(

        "Investigation Error",

        "Could not run the transaction anomaly investigation."

      );

    } finally {

      setLoading(false);

    }

  }



  function runInvestigationFromTranscript(text: string) {

    const question = text.toLowerCase();



    setResult(null);
    setErrorMessage("");

    if (

      question.includes("unusual") ||

      question.includes("anomaly") ||

      question.includes("anomalies") ||

      question.includes("outlier")

    ) {

      runAnomalyInvestigation();

      return;

    }



    if (

      question.includes("seller") ||

      question.includes("sellers")

    ) {

      runSellerInvestigation();

      return;

    }



    if (

      question.includes("revenue") ||

      question.includes("sales") ||

      question.includes("growth") ||

      question.includes("increase") ||

      question.includes("decrease") ||

      question.includes("change")

    ) {

      runRevenueInvestigation();

      return;

    }



    setErrorMessage("Question not recognized. Ask about revenue, sellers, or unusual transactions.");
    Alert.alert(

      "Question not recognized",

      "Try asking about revenue, sellers, or unusual transactions."

    );

  }



  function submitTypedQuestion() {

    const text = typedQuestion.trim();



    if (!text) return;



    setTranscript(text);

    setTypedQuestion("");



    runInvestigationFromTranscript(text);

  }



  async function startVoiceInvestigation() {

    try {

      const permission =

        await Audio.requestPermissionsAsync();



      if (!permission.granted) {

        Alert.alert(

          "Microphone Permission",

          "Microphone access is required."

        );

        return;

      }



      await Audio.setAudioModeAsync({

        allowsRecordingIOS: true,

        playsInSilentModeIOS: true,

      });



      const { recording } =

        await Audio.Recording.createAsync(

          Audio.RecordingOptionsPresets.HIGH_QUALITY

        );



      setTranscript("");

      setRecording(recording);

    } catch (error) {

      console.error(error);



      Alert.alert(

        "Voice Error",

        "Could not start recording."

      );

    }

  }



  async function stopVoiceInvestigation() {

    if (!recording) return;



    try {

      setVoiceProcessing(true);



      await recording.stopAndUnloadAsync();



      const uri = recording.getURI();



      setRecording(null);



      if (!uri) {

        throw new Error("No audio file");

      }



      const formData = new FormData();



      if (typeof window !== "undefined") {

        const audioResponse = await fetch(uri);

        const audioBlob = await audioResponse.blob();



        formData.append(

          "audio",

          audioBlob,

          "olist-question.webm"

        );

      } else {

        formData.append(

          "audio",

          {

            uri,

            name: "olist-question.m4a",

            type: "audio/m4a",

          } as any

        );

      }



      const response = await fetch(

        `${NODE_API_URL}/transcribe`,

        {

          method: "POST",

          body: formData,

        }

      );



      if (!response.ok) {

        throw new Error("Transcription failed");

      }



      const data = await response.json();



      const text = data.text?.trim() || "";



      setTranscript(text);



      if (text) {
        runInvestigationFromTranscript(text);
      } else {
        setErrorMessage("No speech detected. Please type your question below.");
      }

    } catch (error) {

      console.error(error);



      Alert.alert(

        "Voice Error",

        "Could not transcribe your question. You can type it instead."

      );

    } finally {

      setVoiceProcessing(false);

    }

  }



  return (

    <View style={styles.outside}>

      <View style={styles.phone}>



        <ScrollView
          ref={scrollRef}

          style={styles.scroll}

          contentContainerStyle={styles.content}

          showsVerticalScrollIndicator={false}

        >

          {/* Header */}

          <View style={styles.header}>

            <View>

              <Text style={styles.brand}>

                INSIGHTVOICE

              </Text>



              <Text style={styles.tagline}>

                Ask the business, not the dashboard.

              </Text>

            </View>



            <View style={styles.demoBadge}>

              <Text style={styles.demoBadgeText}>

                DEMO

              </Text>

            </View>

          </View>



          <Pressable style={styles.sourceSelector} onPress={() => router.push("/source?from=olist")} accessibilityRole="button" accessibilityLabel="Change data source">
            <View style={styles.sourceLeft}><View style={styles.sourceIcon}><Ionicons name="bar-chart-outline" size={19} color="#5547FF" /></View><Text style={styles.sourceName}>Olist E-commerce (Demo)</Text></View>
            <Ionicons name="chevron-down" size={18} color="#5547FF" />
          </Pressable>

          {olistTab === "home" ? (<>
          {/* Hero */}

          <View style={styles.hero}>

            <Text style={styles.heroEyebrow}>

              OLIST E-COMMERCE · 2016–2018

            </Text>



            <Text style={styles.heroTitle}>

              Ask InsightVoice

            </Text>



            <Text style={styles.heroText}>

              Speak, type, or tap a question.

            </Text>



<Pressable

  style={[

    styles.voiceButton,

    recording && {

      backgroundColor: "#E5484D",

    },

  ]}

  onPress={

    recording

      ? stopVoiceInvestigation

      : startVoiceInvestigation

  }

  disabled={voiceProcessing}

>

  <View style={styles.voiceIcon}>

    {voiceProcessing ? (

      <ActivityIndicator

        size="small"

        color="#FFFFFF"

      />

    ) : (

      <Ionicons

        name={recording ? "stop" : "mic"}

        size={23}

        color="#FFFFFF"

      />

    )}

  </View>



  <View style={styles.voiceContent}>

    <Text style={styles.voiceTitle}>

      {voiceProcessing

        ? "Understanding your question..."

        : recording

        ? "Listening..."

        : "Ask with your voice"}

    </Text>



    <Text style={styles.voiceSubtitle}>

      {recording

        ? "Tap again when you're finished"

        : "Tap to start an investigation"}

    </Text>

  </View>



</Pressable>



<View style={styles.quickQuestions}>
  <Pressable style={styles.quickQuestion} onPress={() => { setTranscript("Why did revenue increase?"); runRevenueInvestigation(); }}><Text style={styles.quickQuestionText}>Why did revenue increase?</Text></Pressable>
  <Pressable style={styles.quickQuestion} onPress={() => { setTranscript("Which sellers grew the most?"); runSellerInvestigation(); }}><Text style={styles.quickQuestionText}>Which sellers grew the most?</Text></Pressable>
  <Pressable style={styles.quickQuestion} onPress={() => { setTranscript("Show top sellers"); runSellerInvestigation(); }}><Text style={styles.quickQuestionText}>Show top sellers</Text></Pressable>
  <Pressable style={styles.quickQuestion} onPress={() => { setTranscript("Any unusual patterns?"); runAnomalyInvestigation(); }}><Text style={styles.quickQuestionText}>Any unusual patterns?</Text></Pressable>
</View>
<View style={styles.inputModes}>
  <Pressable style={styles.modeButton} onPress={recording ? stopVoiceInvestigation : startVoiceInvestigation}><Ionicons name="mic-outline" size={16} color="#5547FF"/><Text style={styles.modeText}>Voice</Text></Pressable>
  <Pressable style={styles.modeButton} onPress={() => setManualOpen((open) => !open)}><Ionicons name="create-outline" size={16} color="#5547FF"/><Text style={styles.modeText}>Text</Text></Pressable>
  <Pressable style={styles.modeButton} onPress={() => { setTranscript("Why did revenue change?"); runRevenueInvestigation(); }}><Ionicons name="sparkles-outline" size={16} color="#5547FF"/><Text style={styles.modeText}>Example</Text></Pressable>
</View>
{manualOpen && <>
<View style={styles.orRow}>

  <View style={styles.orLine} />

  <Text style={styles.orText}>

    OR TYPE YOUR QUESTION

  </Text>

  <View style={styles.orLine} />

</View>



<View style={styles.questionInputRow}>

  <TextInput

    style={styles.questionInput}

    value={typedQuestion}

    onChangeText={setTypedQuestion}

    placeholder="Ask about revenue, sellers, anomalies..."

    placeholderTextColor="#98A2B3"

    returnKeyType="send"

    onSubmitEditing={submitTypedQuestion}

  />



  <Pressable

    style={[

      styles.sendButton,

      !typedQuestion.trim() && {

        opacity: 0.45,

      },

    ]}

    onPress={submitTypedQuestion}

    disabled={!typedQuestion.trim()}

  >

    <Ionicons

      name="arrow-forward"

      size={17}

      color="#FFFFFF"

    />

  </Pressable>

</View>
</>}

{transcript ? (

  <View style={styles.transcriptCard}>

    <Text style={styles.transcriptLabel}>

      YOU ASKED

    </Text>



    <Text style={styles.transcriptText}>

      “{transcript}”

    </Text>

  </View>

) : null}



          </View>



          {/* Investigation result */}
          {!!errorMessage && <View style={styles.resultCard}><Text style={styles.resultText}>{errorMessage}</Text></View>}



          {loading && (

            <View style={styles.resultCard}>

              <ActivityIndicator

                size="small"

                color="#5547FF"

              />



              <Text style={styles.loadingText}>

                Investigating Olist data...

              </Text>

            </View>

          )}



          {result && (

            <View style={styles.resultSectionHeader} onLayout={(event) => { resultY.current = event.nativeEvent.layout.y; }}>

              <Text style={styles.resultSectionEyebrow}>

                YOUR INVESTIGATION

              </Text>



              <Text style={styles.resultSectionTitle}>

                Analysis result

              </Text>

            </View>

          )}



          {/* Revenue result */}
          {result?.scenario === "revenue_root_cause" && (() => {
            const c = result.comparison?.current ?? {};
            const p = result.comparison?.previous ?? {};
            const d = result.comparison?.delta ?? {};
            const categories = Array.isArray(result.top_categories) ? result.top_categories : [];
            const money = (n: any) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
            const pct = (n: any) => Number(n || 0).toFixed(1);
            const change = Number(d.revenue_change_pct || 0);
            const ordersChange = Number(d.order_count_change_pct || 0);
            const maxRevenue = Math.max(Number(c.revenue || 0), Number(p.revenue || 0), 1);
            return <View style={styles.dashboardCard}>
              <Text style={styles.resultEyebrow}>INSIGHT BRIEF · REVENUE ROOT-CAUSE</Text>
              <Text style={styles.dashboardTitle}>Revenue {change >= 0 ? "rose" : "fell"} {Math.abs(change).toFixed(1)}%</Text>
              <Text style={styles.dashboardSummary}>Compared with the previous period, revenue moved from ${money(p.revenue)} to ${money(c.revenue)}.</Text>
              <View style={styles.kpiGrid}>
                {[["Current revenue", `$${money(c.revenue)}`], ["Previous revenue", `$${money(p.revenue)}`], ["Order change", `${ordersChange >= 0 ? "+" : ""}${pct(ordersChange)}%`], ["Current AOV", `$${money(c.aov)}`]].map(([label, value]) =>
                  <View key={label} style={styles.kpiCard}><Text style={styles.kpiValue}>{value}</Text><Text style={styles.kpiLabel}>{label}</Text></View>
                )}
              </View>
              <View style={styles.visualCard}>
                <Text style={styles.visualTitle}>Revenue by period</Text>
                {[["Previous", p.revenue], ["Current", c.revenue]].map(([label, value]) =>
                  <View key={String(label)} style={styles.barRow}>
                    <View style={styles.barHeader}><Text style={styles.barLabel}>{label}</Text><Text style={styles.barValue}>${money(value)}</Text></View>
                    <View style={styles.barTrack}><View style={[styles.barFill, { width: `${Math.max(0, Math.min(100, Number(value || 0) / maxRevenue * 100))}%` }]} /></View>
                  </View>
                )}
              </View>
              <View style={styles.visualCard}><Text style={styles.visualTitle}>Evidence</Text>
                <Text style={styles.resultText}>Orders: {ordersChange >= 0 ? "+" : ""}{pct(ordersChange)}% · Current AOV: ${money(c.aov)}</Text>
                <Text style={styles.resultText}>Top category: {categories[0]?.product_category_name || "Unavailable"}</Text>
              </View>
              <View style={styles.takeawayCard}><Text style={styles.takeawayTitle}>Key takeaways</Text>
                <Text style={styles.takeawayText}>Revenue {change >= 0 ? "increased" : "decreased"} {Math.abs(change).toFixed(1)}% while order count {ordersChange >= 0 ? "increased" : "decreased"} {Math.abs(ordersChange).toFixed(1)}%.</Text>
                <Text style={styles.takeawayText}>Changes in order volume and average order value should both be checked before attributing a cause.</Text>
              </View>
              <View style={styles.recommendationCard}><Text style={styles.recommendationTitle}>Recommendation</Text>
                <Text style={styles.recommendationText}>Review the leading categories and compare order volume with AOV before deciding what drove the change.</Text>
              </View>
              <View style={styles.metaRow}><Text style={styles.metaText}>Confidence: Based on calculated metrics · Data source: Olist sample dataset</Text></View>
            </View>;
          })()}

          {/* Seller result */}
          {result?.scenario === "seller_driver" && (() => {
            const sellers = Array.isArray(result.sellers) ? result.sellers : [];
            const leader = sellers[0];
            const money = (n: any) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
            const maxRevenue = Math.max(...sellers.slice(0, 5).map((s: any) => Number(s.revenue || 0)), 1);
            return <View style={styles.dashboardCard}>
              <Text style={styles.resultEyebrow}>INSIGHT BRIEF · SELLER DRIVER</Text>
              <Text style={styles.dashboardTitle}>{leader ? `Top seller earned $${money(leader.revenue)}` : "No sellers found"}</Text>
              <Text style={styles.dashboardSummary}>{leader ? `Seller ${String(leader.seller_id || "Unknown").slice(0, 8)}… led this period by revenue.` : "There is no seller data for this period."}</Text>
              {!!leader && <>
                <View style={styles.kpiGrid}>
                  {[["Top revenue", `$${money(leader.revenue)}`], ["Orders", String(leader.order_count ?? 0)], ["Revenue share", `${Number(leader.revenue_share_pct || 0).toFixed(1)}%`], ["Sellers shown", String(sellers.length)]].map(([label, value]) =>
                    <View key={label} style={styles.kpiCard}><Text style={styles.kpiValue}>{value}</Text><Text style={styles.kpiLabel}>{label}</Text></View>
                  )}
                </View>
                <View style={styles.visualCard}><Text style={styles.visualTitle}>Top sellers by revenue</Text>
                  {sellers.slice(0, 5).map((seller: any, index: number) =>
                    <View key={String(seller.seller_id || index)} style={styles.barRow}>
                      <View style={styles.barHeader}><Text style={styles.barLabel}>{index + 1}. {String(seller.seller_id || "Unknown").slice(0, 8)}…</Text><Text style={styles.barValue}>${money(seller.revenue)}</Text></View>
                      <View style={styles.barTrack}><View style={[styles.barFill, { width: `${Math.max(0, Math.min(100, Number(seller.revenue || 0) / maxRevenue * 100))}%` }]} /></View>
                    </View>
                  )}
                </View>
                <View style={styles.visualCard}><Text style={styles.visualTitle}>Evidence</Text><Text style={styles.resultText}>Leading seller: {String(leader.seller_id || "Unknown")}</Text><Text style={styles.resultText}>Revenue: ${money(leader.revenue)} · Orders: {leader.order_count ?? 0} · Share: {Number(leader.revenue_share_pct || 0).toFixed(1)}%</Text></View>
                <View style={styles.takeawayCard}><Text style={styles.takeawayTitle}>Key takeaways</Text><Text style={styles.takeawayText}>The leading seller accounts for {Number(leader.revenue_share_pct || 0).toFixed(1)}% of revenue in this result.</Text><Text style={styles.takeawayText}>Compare the top sellers to assess revenue concentration.</Text></View>
                <View style={styles.recommendationCard}><Text style={styles.recommendationTitle}>Recommendation</Text><Text style={styles.recommendationText}>Review the leading seller’s order volume and repeat the comparison across periods to establish whether they drove growth.</Text></View>
              </>}
              <View style={styles.metaRow}><Text style={styles.metaText}>Confidence: Based on calculated metrics · Data source: Olist sample dataset</Text></View>
            </View>;
          })()}

          {/* Anomaly result */}

          {result?.scenario === "transaction_anomaly" && (

            <View style={styles.dashboardCard}>

              <View style={styles.dashboardTopRow}>

                <View style={{ flex: 1 }}>

                  <Text style={styles.resultEyebrow}>

                    INSIGHT BRIEF

                  </Text>



                  <Text style={styles.dashboardTitle}>

                    {result.anomalies.length} unusually high-value orders detected

                  </Text>

                </View>



                <View style={styles.generatedBadge}>

                  <Ionicons

                    name="checkmark-circle"

                    size={13}

                    color="#039855"

                  />

                  <Text style={styles.generatedText}>

                    Generated

                  </Text>

                </View>

              </View>



              <Text style={styles.dashboardSummary}>

                Orders at or above the 99th percentile were flagged

                for review. The largest order was $

                {result.anomalies[0].revenue.toLocaleString(undefined, {

                  maximumFractionDigits: 2,

                })}.

              </Text>



              {/* KPI grid */}

              <View style={styles.kpiGrid}>

                <View style={styles.kpiCard}>

                  <View style={styles.kpiIcon}>

                    <Ionicons

                      name="flag-outline"

                      size={18}

                      color="#5547FF"

                    />

                  </View>



                  <Text style={styles.kpiValue}>

                    {result.anomalies.length}

                  </Text>



                  <Text style={styles.kpiLabel}>

                    Flagged orders

                  </Text>



                  <Text style={styles.kpiHint}>

                    ≥ 99th percentile

                  </Text>

                </View>



                <View style={styles.kpiCard}>

                  <View style={styles.kpiIcon}>

                    <Ionicons

                      name="cash-outline"

                      size={18}

                      color="#5547FF"

                    />

                  </View>



                  <Text style={styles.kpiValue}>

                    $

                    {result.anomalies[0].revenue.toLocaleString(

                      undefined,

                      { maximumFractionDigits: 0 }

                    )}

                  </Text>



                  <Text style={styles.kpiLabel}>

                    Largest order

                  </Text>



                  <Text style={styles.kpiHint}>

                    Highest flagged value

                  </Text>

                </View>



                <View style={styles.kpiCard}>

                  <View style={styles.kpiIcon}>

                    <Ionicons

                      name="analytics-outline"

                      size={18}

                      color="#5547FF"

                    />

                  </View>



                  <Text style={styles.kpiValue}>

                    $

                    {result.anomalies[0].threshold.toLocaleString(

                      undefined,

                      {

                        minimumFractionDigits: 2,

                        maximumFractionDigits: 2,

                      }

                    )}

                  </Text>



                  <Text style={styles.kpiLabel}>

                    P99 threshold

                  </Text>



                  <Text style={styles.kpiHint}>

                    Order value

                  </Text>

                </View>



                <View style={styles.kpiCard}>

                  <View style={styles.kpiIcon}>

                    <Ionicons

                      name="calendar-outline"

                      size={18}

                      color="#5547FF"

                    />

                  </View>



                  <Text style={styles.kpiValue}>

                    Feb 2017

                  </Text>



                  <Text style={styles.kpiLabel}>

                    Analysis period

                  </Text>



                  <Text style={styles.kpiHint}>

                    01 Feb – 28 Feb

                  </Text>

                </View>

              </View>



              {/* Visual distribution */}

              <View style={styles.visualCard}>

                <Text style={styles.visualTitle}>

                  Flagged Order Distribution

                </Text>



                <Text style={styles.visualSubtitle}>

                  Relative size of the largest anomalous orders

                </Text>



                {result.anomalies.slice(0, 5).map(

                  (order: any, index: number) => {

                    const maxValue =

                      result.anomalies[0].revenue;



                    const width =

                      (order.revenue / maxValue) * 100;



                    return (

                      <View

                        key={order.order_id}

                        style={styles.barRow}

                      >

                        <View style={styles.barHeader}>

                          <Text style={styles.barLabel}>

                            #{index + 1}{" "}

                            {order.order_id.slice(0, 7)}…

                          </Text>



                          <Text style={styles.barValue}>

                            $

                            {order.revenue.toLocaleString(

                              undefined,

                              {

                                maximumFractionDigits: 0,

                              }

                            )}

                          </Text>

                        </View>



                        <View style={styles.barTrack}>

                          <View

                            style={[

                              styles.barFill,

                              {

                                width: `${Math.max(

                                  width,

                                  8

                                )}%`,

                              },

                            ]}

                          />

                        </View>

                      </View>

                    );

                  }

                )}



                <View style={styles.thresholdRow}>

                  <View style={styles.thresholdDot} />



                  <Text style={styles.thresholdText}>

                    P99 threshold: $

                    {result.anomalies[0].threshold.toFixed(2)}

                  </Text>

                </View>

              </View>



              {/* Top orders */}

              <View style={styles.visualCard}>

                <Text style={styles.visualTitle}>

                  Top Flagged Orders

                </Text>



                {result.anomalies.slice(0, 5).map(

                  (order: any, index: number) => (

                    <View

                      key={order.order_id}

                      style={styles.orderRow}

                    >

                      <View style={styles.orderRank}>

                        <Text style={styles.orderRankText}>

                          {index + 1}

                        </Text>

                      </View>



                      <View style={styles.orderInfo}>

                        <Text style={styles.orderId}>

                          {order.order_id.slice(0, 10)}…

                        </Text>



                        <Text style={styles.orderDate}>

                          {new Date(

                            order.order_date

                          ).toLocaleDateString()}

                        </Text>

                      </View>



                      <Text style={styles.orderValue}>

                        $

                        {order.revenue.toLocaleString(

                          undefined,

                          {

                            minimumFractionDigits: 2,

                            maximumFractionDigits: 2,

                          }

                        )}

                      </Text>

                    </View>

                  )

                )}

              </View>



              {/* Takeaways */}

              <View style={styles.takeawayCard}>

                <View style={styles.insightHeader}>

                  <Ionicons

                    name="bulb-outline"

                    size={17}

                    color="#039855"

                  />



                  <Text style={styles.takeawayTitle}>

                    Key Takeaways

                  </Text>

                </View>



                <Text style={styles.takeawayText}>

                  ① {result.anomalies.length} orders exceeded

                  the February P99 threshold.

                </Text>



                <Text style={styles.takeawayText}>

                  ② The largest order was $

                  {result.anomalies[0].revenue.toLocaleString()}

                  , more than{" "}

                  {(

                    result.anomalies[0].revenue /

                    result.anomalies[0].threshold

                  ).toFixed(1)}

                  × the P99 threshold.

                </Text>



                <Text style={styles.takeawayText}>

                  ③ These orders are statistical anomalies,

                  not automatically errors or fraudulent

                  transactions.

                </Text>

              </View>



              {/* Recommendation */}

              <View style={styles.recommendationCard}>

                <View style={styles.insightHeader}>

                  <Ionicons

                    name="navigate-circle-outline"

                    size={18}

                    color="#5547FF"

                  />



                  <Text style={styles.recommendationTitle}>

                    Recommendation

                  </Text>

                </View>



                <Text style={styles.recommendationText}>

                  ✓ Review the highest-value orders for

                  common customers, sellers, or categories.

                </Text>



                <Text style={styles.recommendationText}>

                  ✓ Check whether these transactions represent

                  legitimate bulk purchases.

                </Text>



                <Text style={styles.recommendationText}>

                  ✓ Monitor similar high-value orders in

                  subsequent periods.

                </Text>

              </View>



              <View style={styles.metaRow}>

                <Ionicons

                  name="shield-checkmark-outline"

                  size={13}

                  color="#667085"

                />



                <Text style={styles.metaText}>

                  Confidence: High · Rule-based P99 detection

                  {"\n"}

                  Data source: Olist E-commerce · Feb 2017

                </Text>

              </View>

            </View>

          )}



          {/* Explore more */}

          <View style={styles.exploreHeader}>

            <Text style={styles.exploreEyebrow}>

              EXPLORE MORE

            </Text>



            <Text style={styles.exploreTitle}>

              Try another investigation

            </Text>



            <Text style={styles.exploreText}>

              Or explore one of these example questions.

            </Text>

          </View>



          <Pressable style={styles.modeButton} onPress={openOlistAnalytics}>
            <Ionicons name="bar-chart-outline" size={18} color="#5547FF" />
            <Text style={styles.modeText}>View Olist analytics</Text>
          </Pressable>

          </>) : (
            <View style={styles.olistAnalytics}>
              <Text style={styles.dashboardTitle}>Olist Analytics</Text>
              <Text style={styles.dashboardSummary}>Explore the demo dataset using calculated Olist metrics.</Text>
              <View style={styles.analyticsTabs}>
                {(["revenue", "orders", "categories", "sellers"] as const).map((kind) =>
                  <Pressable key={kind} style={[styles.analyticsTab, analyticsKind === kind && styles.analyticsTabActive]} onPress={() => setAnalyticsKind(kind)}>
                    <Text style={[styles.analyticsTabText, analyticsKind === kind && styles.analyticsTabTextActive]}>{kind[0].toUpperCase() + kind.slice(1)}</Text>
                  </Pressable>
                )}
              </View>
              {analyticsLoading && <ActivityIndicator color="#5547FF" />}
              {!!analyticsError && <View style={styles.resultCard}><Text style={styles.resultText}>{analyticsError}</Text><Pressable onPress={openOlistAnalytics}><Text style={styles.modeText}>Retry</Text></Pressable></View>}
              {analyticsData && (() => {
                const comparison = analyticsData.revenue?.comparison ?? {};
                const current = comparison.current ?? {};
                const previous = comparison.previous ?? {};
                const categories = Array.isArray(analyticsData.revenue?.top_categories) ? analyticsData.revenue.top_categories : [];
                const sellers = Array.isArray(analyticsData.sellers?.sellers) ? analyticsData.sellers.sellers : [];
                const fmt = (n: any) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
                const rows: { label: string; value: number }[] = analyticsKind === "revenue"
                  ? [{ label: "Previous period", value: Number(previous.revenue || 0) }, { label: "Current period", value: Number(current.revenue || 0) }]
                  : analyticsKind === "orders"
                  ? [{ label: "Previous period", value: Number(previous.order_count || 0) }, { label: "Current period", value: Number(current.order_count || 0) }]
                  : analyticsKind === "categories"
                  ? categories.slice(0, 5).map((item: any) => ({ label: String(item.product_category_name || "Unknown"), value: Number(item.revenue ?? item.gmv ?? 0) }))
                  : sellers.slice(0, 5).map((item: any) => ({ label: String(item.seller_id || "Unknown").slice(0, 8) + "…", value: Number(item.revenue || 0) }));
                const max = Math.max(1, ...rows.map((row) => row.value));
                return <View style={styles.visualCard}>
                  <Text style={styles.visualTitle}>{analyticsKind === "revenue" ? "Revenue by period" : analyticsKind === "orders" ? "Orders by period" : analyticsKind === "categories" ? "Top categories" : "Top sellers by revenue"}</Text>
                  {rows.length === 0 ? <Text style={styles.resultText}>No data available.</Text> : rows.map((row, index) =>
                    <View key={`${row.label}-${index}`} style={styles.barRow}>
                      <View style={styles.barHeader}><Text style={styles.barLabel} numberOfLines={1}>{row.label}</Text><Text style={styles.barValue}>{analyticsKind === "orders" ? fmt(row.value) : `$${fmt(row.value)}`}</Text></View>
                      <View style={styles.barTrack}><View style={[styles.barFill, { width: `${Math.min(100, Math.max(0, row.value / max * 100))}%` }]} /></View>
                    </View>
                  )}
                  <Text style={styles.metaText}>Source: Olist E-commerce demo data · Figures from the analytics API</Text>
                </View>;
              })()}
            </View>
          )}

        </ScrollView>



        {/* Olist navigation */}
        <View style={styles.nav}>
          <NavButton label="Home" icon="home" active={olistTab === "home"} onPress={() => { setOlistTab("home"); scrollRef.current?.scrollTo({ y: 0, animated: true }); }} />
          <NavButton label="Analytics" icon="bar-chart" active={olistTab === "analytics"} onPress={openOlistAnalytics} />
        </View>

      </View>

    </View>

  );

}



function InvestigationCard({

  icon,

  title,

  question,

  description,

  onPress,

}: {

  icon: any;

  title: string;

  question: string;

  description: string;

  onPress?: () => void;

}) {

  return (

    <Pressable

      style={styles.investigationCard}

      onPress={onPress}

    >

      <View style={styles.investigationIcon}>

        <Ionicons

          name={icon}

          size={18}

          color="#5547FF"

        />

      </View>



      <View style={styles.investigationContent}>

        <Text style={styles.investigationLabel}>

          {title}

        </Text>



        <Text style={styles.investigationQuestion}>

          {question}

        </Text>



        <Text style={styles.investigationDescription}>

          {description}

        </Text>

      </View>



      <Ionicons

        name="chevron-forward"

        size={15}

        color="#B1B6C5"

      />

    </Pressable>

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

      style={styles.navButton}

      onPress={onPress}

    >

      <Ionicons

        name={active ? icon : `${icon}-outline`}

        size={19}

        color={active ? "#5547FF" : "#8189A4"}

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

    backgroundColor: "#F4F6FB",

    alignItems: "center",

  },



  phone: {

    flex: 1,

    width: "100%",

    maxWidth: 430,

    backgroundColor: "#FFFFFF",

  },



  scroll: {

    flex: 1,

  },



  content: {

    paddingHorizontal: 18,

    paddingTop: 20,

    paddingBottom: 28,

  },



  header: {

    flexDirection: "row",

    alignItems: "flex-start",

    justifyContent: "space-between",

  },



  brand: {

    fontSize: 10,

    fontWeight: "700",

    letterSpacing: 1,

    color: "#5547FF",

  },



  tagline: {

    marginTop: 4,

    fontSize: 10,

    color: "#98A2B3",

  },



  demoBadge: {

    paddingHorizontal: 8,

    paddingVertical: 4,

    borderRadius: 6,

    backgroundColor: "#F1EFFF",

  },



  demoBadgeText: {

    fontSize: 7,

    fontWeight: "800",

    letterSpacing: 0.6,

    color: "#5547FF",

  },



  sourceSelector: {

    marginTop: 19,

    minHeight: 54,

    paddingHorizontal: 13,

    borderRadius: 13,

    borderWidth: 1,

    borderColor: "#E9EBF3",

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    backgroundColor: "#FFFFFF",

  },



  sourceLeft: {

    flexDirection: "row",

    alignItems: "center",

  },



  sourceIcon: {

    width: 34,

    height: 34,

    marginRight: 10,

    borderRadius: 9,

    backgroundColor: "#F1EFFF",

    alignItems: "center",

    justifyContent: "center",

  },



  sourceLabel: {

    fontSize: 7,

    fontWeight: "700",

    letterSpacing: 0.6,

    color: "#98A2B3",

  },



  sourceName: {

    marginTop: 2,

    fontSize: 11,

    fontWeight: "700",

    color: "#1F2552",

  },



  sourceMenu: {
    marginTop: 4,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#E9EBF3",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  sourceOption: {
    minHeight: 48,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  sourceOptionText: {
    fontSize: 14,
    color: "#1F2552",
    fontWeight: "600",
  },

  quickQuestions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 18 },
  quickQuestion: { width: "48%", minHeight: 57, padding: 10, borderRadius: 12, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E7E4FF", justifyContent: "center" },
  quickQuestionText: { fontSize: 12, lineHeight: 16, color: "#1F2552", fontWeight: "600" },
  inputModes: { flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 14 },
  modeButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 12, backgroundColor: "#F1EFFF", marginTop: 8 },
  modeText: { fontSize: 12, color: "#5547FF", fontWeight: "700" },
  olistAnalytics: { paddingTop: 26, paddingBottom: 30 },
  analyticsTabs: { flexDirection: "row", gap: 4, marginTop: 16, marginBottom: 18 },
  analyticsTab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8, backgroundColor: "#F5F6FC" },
  analyticsTabActive: { backgroundColor: "#5547FF" },
  analyticsTabText: { fontSize: 10, color: "#667085", fontWeight: "700" },
  analyticsTabTextActive: { color: "#FFFFFF" },
  hero: {

    marginTop: 18,

    padding: 17,

    borderRadius: 17,

    backgroundColor: "#F8F7FF",

    borderWidth: 1,

    borderColor: "#E7E4FF",

  },



  heroEyebrow: {

    fontSize: 8,

    fontWeight: "700",

    letterSpacing: 0.7,

    color: "#5547FF",

  },



  heroTitle: {

    marginTop: 7,

    fontSize: 21,

    lineHeight: 27,

    fontWeight: "700",

    color: "#1F2552",

  },



  heroText: {

    marginTop: 6,

    maxWidth: 310,

    fontSize: 10.5,

    lineHeight: 16,

    color: "#667085",

  },



  voiceButton: {

    marginTop: 17,

    minHeight: 158,
    padding: 14,
    borderRadius: 20,
    backgroundColor: "#F8F7FF",
    alignItems: "center",
    justifyContent: "center",
  },

  voiceIcon: {

    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#5547FF",

    alignItems: "center",

    justifyContent: "center",

  },



  voiceContent: {
    alignItems: "center",
    marginTop: 10,
  },



  voiceTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2552",

  },



  voiceSubtitle: {

    marginTop: 3,

    fontSize: 8.5,

    color: "#667085",

  },



  sectionHeader: {

    marginTop: 25,

    marginBottom: 9,

    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

  },



  sectionTitle: {

    fontSize: 14,

    fontWeight: "700",

    color: "#1F2552",

  },



  sectionCaption: {

    fontSize: 7,

    fontWeight: "700",

    letterSpacing: 0.6,

    color: "#98A2B3",

  },



  investigationCard: {

    minHeight: 91,

    marginBottom: 9,

    padding: 13,

    borderRadius: 14,

    borderWidth: 1,

    borderColor: "#E9EBF3",

    backgroundColor: "#FFFFFF",

    flexDirection: "row",

    alignItems: "center",

  },



  investigationIcon: {

    width: 38,

    height: 38,

    marginRight: 11,

    borderRadius: 10,

    backgroundColor: "#F5F3FF",

    alignItems: "center",

    justifyContent: "center",

  },



  investigationContent: {

    flex: 1,

    paddingRight: 8,

  },



  investigationLabel: {

    fontSize: 7.5,

    fontWeight: "700",

    letterSpacing: 0.4,

    color: "#5547FF",

  },



  investigationQuestion: {

    marginTop: 3,

    fontSize: 11.5,

    fontWeight: "700",

    color: "#252A45",

  },



  investigationDescription: {

    marginTop: 4,

    fontSize: 8.5,

    lineHeight: 13,

    color: "#8189A4",

  },



  infoCard: {

    marginTop: 9,

    padding: 14,

    borderRadius: 14,

    backgroundColor: "#F8F7FF",

    flexDirection: "row",

  },



  infoIcon: {

    width: 34,

    height: 34,

    marginRight: 10,

    borderRadius: 9,

    backgroundColor: "#FFFFFF",

    alignItems: "center",

    justifyContent: "center",

  },



  infoContent: {

    flex: 1,

  },



  infoTitle: {

    fontSize: 10.5,

    fontWeight: "700",

    color: "#1F2552",

  },



  infoText: {

    marginTop: 4,

    fontSize: 8.5,

    lineHeight: 13,

    color: "#667085",

  },



  nav: {

    height: 61,

    borderTopWidth: 1,

    borderTopColor: "#E9EBF3",

    backgroundColor: "#FFFFFF",

    flexDirection: "row",

  },



  navButton: {

    flex: 1,

    alignItems: "center",

    justifyContent: "center",

  },



  navText: {

    marginTop: 4,

    fontSize: 9,

    color: "#8189A4",

  },



  navTextActive: {

    color: "#5547FF",

    fontWeight: "600",

  },



  resultCard: {

    marginBottom: 12,

    padding: 16,

    borderRadius: 14,

    backgroundColor: "#F8F7FF",

    borderWidth: 1,

    borderColor: "#E7E4FF",

  },



  loadingText: {

    marginTop: 9,

    fontSize: 10,

    textAlign: "center",

    color: "#667085",

  },



  resultEyebrow: {

    fontSize: 7.5,

    fontWeight: "800",

    letterSpacing: 0.7,

    color: "#5547FF",

  },



  resultTitle: {

    marginTop: 7,

    fontSize: 17,

    fontWeight: "700",

    color: "#1F2552",

  },



  resultText: {

    marginTop: 7,

    fontSize: 10,

    lineHeight: 16,

    color: "#667085",

  },



  evidenceBox: {

    marginTop: 12,

    padding: 12,

    borderRadius: 10,

    backgroundColor: "#FFFFFF",

  },



  evidenceLabel: {

    fontSize: 7,

    fontWeight: "800",

    letterSpacing: 0.6,

    color: "#98A2B3",

  },



  evidenceText: {

    marginTop: 6,

    fontSize: 9.5,

    lineHeight: 16,

    color: "#252A45",

  },



  confidence: {

    marginTop: 10,

    fontSize: 8,

    color: "#8189A4",

  },



  transcriptCard: {

    marginTop: 10,

    padding: 12,

    borderRadius: 11,

    backgroundColor: "#FFFFFF",

    borderWidth: 1,

    borderColor: "#E7E4FF",

  },



  transcriptLabel: {

    fontSize: 7,

    fontWeight: "800",

    letterSpacing: 0.7,

    color: "#5547FF",

  },



  transcriptText: {

    marginTop: 5,

    fontSize: 11,

    lineHeight: 17,

    color: "#252A45",

  },



  orRow: {

    marginTop: 14,

    flexDirection: "row",

    alignItems: "center",

  },



  orLine: {

    flex: 1,

    height: 1,

    backgroundColor: "#E2E0F3",

  },



  orText: {

    marginHorizontal: 9,

    fontSize: 7,

    fontWeight: "700",

    letterSpacing: 0.6,

    color: "#98A2B3",

  },



  questionInputRow: {

    marginTop: 11,

    height: 48,

    paddingLeft: 13,

    paddingRight: 5,

    borderWidth: 1,

    borderColor: "#DDD9F5",

    borderRadius: 12,

    backgroundColor: "#FFFFFF",

    flexDirection: "row",

    alignItems: "center",

  },



  questionInput: {

    flex: 1,

    height: "100%",

    fontSize: 11,

    color: "#252A45",

    outlineStyle: "none",

  } as any,



  sendButton: {

    width: 38,

    height: 38,

    borderRadius: 10,

    backgroundColor: "#5547FF",

    alignItems: "center",

    justifyContent: "center",

  },



  resultSectionHeader: {

    marginTop: 24,

    marginBottom: 10,

  },



  resultSectionEyebrow: {

    fontSize: 8,

    fontWeight: "800",

    letterSpacing: 0.8,

    color: "#5547FF",

  },



  resultSectionTitle: {

    marginTop: 4,

    fontSize: 16,

    fontWeight: "700",

    color: "#1F2552",

  },



  exploreHeader: {

    marginTop: 28,

    marginBottom: 12,

    paddingTop: 20,

    borderTopWidth: 1,

    borderTopColor: "#E9EBF3",

  },



  exploreEyebrow: {

    fontSize: 8,

    fontWeight: "800",

    letterSpacing: 0.8,

    color: "#98A2B3",

  },



  exploreTitle: {

    marginTop: 5,

    fontSize: 16,

    fontWeight: "700",

    color: "#1F2552",

  },



  exploreText: {

    marginTop: 4,

    fontSize: 10,

    color: "#8189A4",

  },



  dashboardCard: {

    marginBottom: 14,

    padding: 14,

    borderRadius: 17,

    backgroundColor: "#F8F7FF",

    borderWidth: 1,

    borderColor: "#E3DFFF",

  },



  dashboardTopRow: {

    flexDirection: "row",

    alignItems: "flex-start",

    gap: 8,

  },



  dashboardTitle: {

    marginTop: 6,

    fontSize: 19,

    lineHeight: 25,

    fontWeight: "800",

    color: "#151B4A",

  },



  dashboardSummary: {

    marginTop: 8,

    fontSize: 11,

    lineHeight: 17,

    color: "#667085",

  },



  generatedBadge: {

    paddingHorizontal: 8,

    paddingVertical: 5,

    borderRadius: 12,

    backgroundColor: "#E7F8F0",

    flexDirection: "row",

    alignItems: "center",

    gap: 4,

  },



  generatedText: {

    fontSize: 7,

    fontWeight: "700",

    color: "#039855",

  },



  kpiGrid: {

    marginTop: 15,

    flexDirection: "row",

    flexWrap: "wrap",

    justifyContent: "space-between",

    rowGap: 9,

  },



  kpiCard: {

    width: "48.7%",

    minHeight: 120,

    padding: 12,

    borderRadius: 13,

    backgroundColor: "#FFFFFF",

    borderWidth: 1,

    borderColor: "#E9E7F5",

  },



  kpiIcon: {

    width: 31,

    height: 31,

    borderRadius: 9,

    backgroundColor: "#F2F0FF",

    alignItems: "center",

    justifyContent: "center",

  },



  kpiValue: {

    marginTop: 9,

    fontSize: 18,

    fontWeight: "800",

    color: "#151B4A",

  },



  kpiLabel: {

    marginTop: 3,

    fontSize: 9.5,

    fontWeight: "700",

    color: "#344054",

  },



  kpiHint: {

    marginTop: 3,

    fontSize: 8,

    color: "#98A2B3",

  },



  visualCard: {

    marginTop: 11,

    padding: 13,

    borderRadius: 13,

    backgroundColor: "#FFFFFF",

    borderWidth: 1,

    borderColor: "#E9E7F5",

  },



  visualTitle: {

    fontSize: 12,

    fontWeight: "800",

    color: "#1F2552",

  },



  visualSubtitle: {

    marginTop: 3,

    marginBottom: 12,

    fontSize: 8.5,

    color: "#98A2B3",

  },



  barRow: {

    marginBottom: 10,

  },



  barHeader: {

    marginBottom: 4,

    flexDirection: "row",

    justifyContent: "space-between",

  },



  barLabel: {

    fontSize: 8.5,

    color: "#667085",

  },



  barValue: {

    fontSize: 8.5,

    fontWeight: "700",

    color: "#252A45",

  },



  barTrack: {

    height: 7,

    borderRadius: 4,

    overflow: "hidden",

    backgroundColor: "#EEEAFE",

  },



  barFill: {

    height: "100%",

    borderRadius: 4,

    backgroundColor: "#6657FF",

  },



  thresholdRow: {

    marginTop: 3,

    paddingTop: 10,

    borderTopWidth: 1,

    borderTopColor: "#F0EEF8",

    flexDirection: "row",

    alignItems: "center",

  },



  thresholdDot: {

    width: 7,

    height: 7,

    marginRight: 6,

    borderRadius: 4,

    backgroundColor: "#E5484D",

  },



  thresholdText: {

    fontSize: 8,

    color: "#667085",

  },



  orderRow: {

    minHeight: 49,

    borderBottomWidth: 1,

    borderBottomColor: "#F1F0F6",

    flexDirection: "row",

    alignItems: "center",

  },



  orderRank: {

    width: 25,

    height: 25,

    marginRight: 9,

    borderRadius: 8,

    backgroundColor: "#F2F0FF",

    alignItems: "center",

    justifyContent: "center",

  },



  orderRankText: {

    fontSize: 9,

    fontWeight: "800",

    color: "#5547FF",

  },



  orderInfo: {

    flex: 1,

  },



  orderId: {

    fontSize: 9,

    fontWeight: "700",

    color: "#344054",

  },



  orderDate: {

    marginTop: 2,

    fontSize: 7.5,

    color: "#98A2B3",

  },



  orderValue: {

    fontSize: 10,

    fontWeight: "800",

    color: "#1F2552",

  },



  takeawayCard: {

    marginTop: 11,

    padding: 13,

    borderRadius: 13,

    backgroundColor: "#EFFBF6",

  },



  insightHeader: {

    marginBottom: 8,

    flexDirection: "row",

    alignItems: "center",

    gap: 6,

  },



  takeawayTitle: {

    fontSize: 11,

    fontWeight: "800",

    color: "#176B4D",

  },



  takeawayText: {

    marginTop: 5,

    fontSize: 9,

    lineHeight: 14,

    color: "#475467",

  },



  recommendationCard: {

    marginTop: 11,

    padding: 13,

    borderRadius: 13,

    backgroundColor: "#F0F4FF",

  },



  recommendationTitle: {

    fontSize: 11,

    fontWeight: "800",

    color: "#3446A8",

  },



  recommendationText: {

    marginTop: 5,

    fontSize: 9,

    lineHeight: 14,

    color: "#475467",

  },



  metaRow: {

    marginTop: 12,

    flexDirection: "row",

    alignItems: "flex-start",

  },



  metaText: {

    flex: 1,

    marginLeft: 6,

    fontSize: 7.5,

    lineHeight: 12,

    color: "#8189A4",

  },



});
