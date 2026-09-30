import { useState } from "react";

import {

  View,

  Text,

  Pressable,

  StyleSheet,

  Modal,

} from "react-native";

import { useRouter } from "expo-router";

import { Ionicons } from "@expo/vector-icons";



type DataSource = "personal" | "olist";



export default function MoreScreen() {

  const router = useRouter();



  const [sourceModal, setSourceModal] = useState(false);

  const [currentSource, setCurrentSource] =

    useState<DataSource>("personal");

  const [selectedSource, setSelectedSource] =

    useState<DataSource>("personal");



  function openSourceModal() {

    setSelectedSource(currentSource);

    setSourceModal(true);

  }



  function handleContinue() {

    setCurrentSource(selectedSource);

    setSourceModal(false);



    if (selectedSource === "olist") {

      router.replace("/olist");

      return;

    }



    router.replace("/");

  }



  return (

    <View style={styles.outside}>

      <View style={styles.phone}>

        <View style={styles.content}>

          <Text style={styles.eyebrow}>

            INSIGHTVOICE

          </Text>



          <Text style={styles.title}>More</Text>



          <Text style={styles.subtitle}>

            Manage your data source and app settings.

          </Text>



          <Text style={styles.sectionLabel}>

            DATA SOURCE

          </Text>



          <View style={styles.sourceCard}>

            <View style={styles.sourceTop}>

              <View style={styles.sourceIcon}>

                <Ionicons

                  name={

                    currentSource === "personal"

                      ? "wallet-outline"

                      : "storefront-outline"

                  }

                  size={19}

                  color="#5547FF"

                />

              </View>



              <View style={{ flex: 1 }}>

                <Text style={styles.sourceName}>

                  {currentSource === "personal"

                    ? "My Transactions"

                    : "Olist E-commerce"}

                </Text>



                <Text style={styles.sourceStatus}>

                  ACTIVE DATA SOURCE

                </Text>

              </View>

            </View>



            <Text style={styles.sourceDescription}>

              {currentSource === "personal"

                ? "Your personal spending captured by voice, receipt, or manual entry."

                : "Demo business data for investigating revenue, sellers, categories, and anomalies."}

            </Text>



            <Pressable

              onPress={openSourceModal}

              style={styles.changeButton}

            >

              <Text style={styles.changeButtonText}>

                Change Data Source

              </Text>



              <Ionicons

                name="chevron-forward"

                size={14}

                color="#5547FF"

              />

            </Pressable>

          </View>



          <View style={styles.aboutCard}>

            <View style={styles.aboutIcon}>

              <Ionicons

                name="sparkles-outline"

                size={17}

                color="#5547FF"

              />

            </View>



            <View style={{ flex: 1 }}>

              <Text style={styles.aboutTitle}>

                Two ways to use InsightVoice

              </Text>



              <Text style={styles.aboutText}>

                Track your own spending or explore a

                business dataset using the same

                voice-first experience.

              </Text>

            </View>

          </View>

        </View>



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

            onPress={() =>

              router.replace("/analytics")

            }

          />



          <NavButton

            label="More"

            icon="ellipsis-horizontal"

            active

            onPress={() => {}}

          />

        </View>



        <Modal

          visible={sourceModal}

          transparent

          animationType="fade"

          onRequestClose={() =>

            setSourceModal(false)

          }

        >

          <View style={styles.modalOverlay}>

            <View style={styles.modalCard}>

              <View style={styles.modalHandle} />



              <Text style={styles.modalEyebrow}>

                DATA SOURCE

              </Text>



              <Text style={styles.modalTitle}>

                Choose what to explore

              </Text>



              <Text style={styles.modalSubtitle}>

                Your data sources stay separate.

              </Text>



              <SourceOption

                title="My Transactions"

                description="Your personal expenses and spending patterns."

                icon="wallet-outline"

                selected={

                  selectedSource === "personal"

                }

                onPress={() =>

                  setSelectedSource("personal")

                }

              />



              <SourceOption

                title="Olist E-commerce"

                badge="DEMO"

                description="Explore business revenue, sellers, categories, and anomalies."

                icon="storefront-outline"

                selected={selectedSource === "olist"}

                onPress={() =>

                  setSelectedSource("olist")

                }

              />



              <Pressable

                onPress={handleContinue}

                style={styles.continueButton}

              >

                <Text style={styles.continueText}>

                  Continue

                </Text>



                <Ionicons

                  name="arrow-forward"

                  size={15}

                  color="#FFFFFF"

                />

              </Pressable>



              <Pressable

                onPress={() =>

                  setSourceModal(false)

                }

                style={styles.cancelButton}

              >

                <Text style={styles.cancelText}>

                  Cancel

                </Text>

              </Pressable>

            </View>

          </View>

        </Modal>

      </View>

    </View>

  );

}



function SourceOption({

  title,

  description,

  icon,

  badge,

  selected,

  onPress,

}: {

  title: string;

  description: string;

  icon: any;

  badge?: string;

  selected: boolean;

  onPress: () => void;

}) {

  return (

    <Pressable

      onPress={onPress}

      style={[

        styles.option,

        selected && styles.optionSelected,

      ]}

    >

      <View

        style={[

          styles.optionIcon,

          selected && styles.optionIconSelected,

        ]}

      >

        <Ionicons

          name={icon}

          size={19}

          color={

            selected ? "#5547FF" : "#667085"

          }

        />

      </View>



      <View style={styles.optionContent}>

        <View style={styles.optionTitleRow}>

          <Text style={styles.optionTitle}>

            {title}

          </Text>



          {badge && (

            <View style={styles.badge}>

              <Text style={styles.badgeText}>

                {badge}

              </Text>

            </View>

          )}

        </View>



        <Text style={styles.optionDescription}>

          {description}

        </Text>

      </View>



      <View

        style={[

          styles.radio,

          selected && styles.radioSelected,

        ]}

      >

        {selected && (

          <View style={styles.radioDot} />

        )}

      </View>

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

      onPress={onPress}

      style={styles.navButton}

    >

      <Ionicons

        name={

          active ? icon : `${icon}-outline`

        }

        size={19}

        color={

          active ? "#5547FF" : "#8189A4"

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

    backgroundColor: "#F4F6FB",

    alignItems: "center",

  },



  phone: {

    flex: 1,

    width: "100%",

    maxWidth: 430,

    backgroundColor: "#FFFFFF",

  },



  content: {

    flex: 1,

    paddingHorizontal: 18,

    paddingTop: 20,

  },



  eyebrow: {

    fontSize: 9,

    fontWeight: "700",

    letterSpacing: 0.9,

    color: "#5547FF",

  },



  title: {

    marginTop: 5,

    fontSize: 24,

    lineHeight: 30,

    fontWeight: "700",

    color: "#1F2552",

  },



  subtitle: {

    marginTop: 4,

    fontSize: 11,

    color: "#98A2B3",

  },



  sectionLabel: {

    marginTop: 28,

    marginBottom: 8,

    fontSize: 9,

    fontWeight: "700",

    letterSpacing: 0.8,

    color: "#98A2B3",

  },



  sourceCard: {

    padding: 16,

    borderRadius: 16,

    borderWidth: 1,

    borderColor: "#E9EBF3",

    backgroundColor: "#FFFFFF",

  },



  sourceTop: {

    flexDirection: "row",

    alignItems: "center",

  },



  sourceIcon: {

    width: 40,

    height: 40,

    marginRight: 11,

    borderRadius: 11,

    backgroundColor: "#F1EFFF",

    alignItems: "center",

    justifyContent: "center",

  },



  sourceName: {

    fontSize: 14,

    fontWeight: "700",

    color: "#1F2552",

  },



  sourceStatus: {

    marginTop: 3,

    fontSize: 7.5,

    fontWeight: "700",

    letterSpacing: 0.6,

    color: "#5547FF",

  },



  sourceDescription: {

    marginTop: 13,

    fontSize: 10.5,

    lineHeight: 16,

    color: "#667085",

  },



  changeButton: {

    marginTop: 15,

    height: 40,

    paddingHorizontal: 13,

    borderRadius: 10,

    backgroundColor: "#F4F2FF",

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

  },



  changeButtonText: {

    fontSize: 10.5,

    fontWeight: "700",

    color: "#5547FF",

  },



  aboutCard: {

    marginTop: 14,

    padding: 14,

    borderRadius: 14,

    backgroundColor: "#F8F7FF",

    flexDirection: "row",

  },



  aboutIcon: {

    width: 34,

    height: 34,

    marginRight: 10,

    borderRadius: 9,

    backgroundColor: "#FFFFFF",

    alignItems: "center",

    justifyContent: "center",

  },



  aboutTitle: {

    fontSize: 11,

    fontWeight: "700",

    color: "#1F2552",

  },



  aboutText: {

    marginTop: 4,

    fontSize: 9.5,

    lineHeight: 14,

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



  modalOverlay: {

    flex: 1,

    padding: 18,

    backgroundColor: "rgba(31,37,82,0.25)",

    alignItems: "center",

    justifyContent: "center",

  },



  modalCard: {

    width: "100%",

    maxWidth: 390,

    padding: 18,

    borderRadius: 20,

    backgroundColor: "#FFFFFF",

  },



  modalHandle: {

    width: 34,

    height: 4,

    alignSelf: "center",

    marginBottom: 17,

    borderRadius: 2,

    backgroundColor: "#E4E7EC",

  },



  modalEyebrow: {

    fontSize: 8,

    fontWeight: "700",

    letterSpacing: 0.8,

    color: "#5547FF",

  },



  modalTitle: {

    marginTop: 4,

    fontSize: 19,

    fontWeight: "700",

    color: "#1F2552",

  },



  modalSubtitle: {

    marginTop: 4,

    marginBottom: 16,

    fontSize: 10,

    color: "#98A2B3",

  },



  option: {

    minHeight: 82,

    marginBottom: 9,

    padding: 12,

    borderRadius: 13,

    borderWidth: 1,

    borderColor: "#E9EBF3",

    flexDirection: "row",

    alignItems: "center",

  },



  optionSelected: {

    borderColor: "#BDB6FF",

    backgroundColor: "#F8F7FF",

  },



  optionIcon: {

    width: 38,

    height: 38,

    marginRight: 10,

    borderRadius: 10,

    backgroundColor: "#F4F5F7",

    alignItems: "center",

    justifyContent: "center",

  },



  optionIconSelected: {

    backgroundColor: "#EEEAFE",

  },



  optionContent: {

    flex: 1,

  },



  optionTitleRow: {

    flexDirection: "row",

    alignItems: "center",

  },



  optionTitle: {

    fontSize: 11.5,

    fontWeight: "700",

    color: "#1F2552",

  },



  optionDescription: {

    marginTop: 4,

    paddingRight: 6,

    fontSize: 9,

    lineHeight: 13,

    color: "#667085",

  },



  badge: {

    marginLeft: 6,

    paddingHorizontal: 6,

    paddingVertical: 2,

    borderRadius: 5,

    backgroundColor: "#EEEAFE",

  },



  badgeText: {

    fontSize: 6.5,

    fontWeight: "800",

    color: "#5547FF",

  },



  radio: {

    width: 18,

    height: 18,

    marginLeft: 7,

    borderRadius: 9,

    borderWidth: 1.5,

    borderColor: "#CBD0DB",

    alignItems: "center",

    justifyContent: "center",

  },



  radioSelected: {

    borderColor: "#5547FF",

  },



  radioDot: {

    width: 8,

    height: 8,

    borderRadius: 4,

    backgroundColor: "#5547FF",

  },



  continueButton: {

    marginTop: 8,

    height: 43,

    borderRadius: 11,

    backgroundColor: "#5547FF",

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 7,

  },



  continueText: {

    fontSize: 10.5,

    fontWeight: "700",

    color: "#FFFFFF",

  },



  cancelButton: {

    height: 38,

    alignItems: "center",

    justifyContent: "center",

  },



  cancelText: {

    fontSize: 10,

    fontWeight: "600",

    color: "#667085",

  },

});