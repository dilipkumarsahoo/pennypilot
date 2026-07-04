import CurrencyModal from "@/components/CurrencyModal";
import LanguageModal from "@/components/LanguageModal";
import { useCurrencyStore } from "@/store/currencyStore";
import { useLanguageStore } from "@/store/languageStore";
import { ThemeColor, colorMap, useThemeStore } from "@/store/themeStore";
import { formatCurrency } from "@/utils/formatCurrency";
import { LinearGradient } from "expo-linear-gradient";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  FileText,
  CircleHelp as HelpCircle,
  Languages,
  Mail,
  Moon,
  Palette,
  Settings as SettingsIcon,
  Shield,
  Star,
} from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SettingsScreen() {
  const { colors, themeMode, themeColor, isDark, setThemeMode, setThemeColor } =
    useThemeStore();
  const { selectedCurrency } = useCurrencyStore();
  const { selectedLanguage } = useLanguageStore();
  const { t } = useTranslation();
  const [isCurrencyModalVisible, setIsCurrencyModalVisible] =
    React.useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] =
    React.useState(false);

  const isRTL = !!selectedLanguage.isRTL;

  const handleShare = async () => {
    try {
      await Share.share({
        message: t("share_message"),
        title: t("settings"),
      });
    } catch (error) {
      console.error(error);
    }
  };

  const renderMenuItem = (
    icon: React.ReactNode,
    title: string,
    subtitle: string | null = null,
    onPress: () => void,
    showBadge: boolean = false,
    isLast: boolean = false,
  ) => (
    <TouchableOpacity
      style={[
        styles.menuItem,
        {
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: colors.border,
          flexDirection: isRTL ? "row-reverse" : "row",
        },
      ]}
      onPress={onPress}
    >
      <View style={[styles.menuItemLeft, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        {icon}
        <View
          style={[
            styles.menuItemText,
            isRTL ? { marginRight: 16, marginLeft: 0 } : { marginLeft: 16, marginRight: 0 },
            { alignItems: isRTL ? "flex-end" : "flex-start" },
          ]}
        >
          <Text style={[styles.menuItemTitle, { color: colors.text, textAlign: isRTL ? "right" : "left" }]}>
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.menuItemSubtitle,
                { color: colors.textSecondary, textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <View style={[styles.menuItemRight, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        {showBadge && (
          <View
            style={[
              styles.badge,
              { backgroundColor: colors.danger },
              isRTL ? { marginLeft: 8, marginRight: 0 } : { marginRight: 8, marginLeft: 0 },
            ]}
          />
        )}
        {isRTL ? (
          <ChevronLeft size={20} color={colors.textSecondary} />
        ) : (
          <ChevronRight size={20} color={colors.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text, textAlign: isRTL ? "right" : "left" }]}>
          {t("settings")}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, textAlign: isRTL ? "right" : "left" }]}>
          {t("appearance")}
        </Text>

        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              padding: 24,
              borderRadius: 20,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <View
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View style={{ alignItems: isRTL ? "flex-end" : "flex-start" }}>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: 13,
                    fontFamily: "Inter_500Medium",
                    textAlign: isRTL ? "right" : "left",
                  }}
                >
                  {t("theme_preview")}
                </Text>
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 28,
                    fontFamily: "Inter_700Bold",
                    marginTop: 4,
                    letterSpacing: -0.5,
                    textAlign: isRTL ? "right" : "left",
                  }}
                >
                  {formatCurrency(12450)}
                </Text>
              </View>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Star size={22} color="#ffffff" />
              </View>
            </View>
          </LinearGradient>
        </View>

        <View
          style={[
            styles.cardGroup,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.menuItem,
              {
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                flexDirection: isRTL ? "row-reverse" : "row",
              },
            ]}
          >
            <View style={[styles.menuItemLeft, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Moon size={24} color={colors.primary} />
              <View
                style={[
                  styles.menuItemText,
                  isRTL ? { marginRight: 16, marginLeft: 0 } : { marginLeft: 16, marginRight: 0 },
                  { alignItems: isRTL ? "flex-end" : "flex-start" },
                ]}
              >
                <Text style={[styles.menuItemTitle, { color: colors.text, textAlign: isRTL ? "right" : "left" }]}>
                  {t("dark_mode")}
                </Text>
                <Text
                  style={[
                    styles.menuItemSubtitle,
                    { color: colors.textSecondary, textAlign: isRTL ? "right" : "left" },
                  ]}
                >
                  {themeMode === "system"
                    ? t("theme_system_default")
                    : isDark
                      ? t("theme_on")
                      : t("theme_off")}
                </Text>
              </View>
            </View>
            <View style={[styles.menuItemRight, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Switch
                value={isDark}
                onValueChange={(val) => setThemeMode(val ? "dark" : "light")}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={"#ffffff"}
              />
            </View>
          </View>

          <View
            style={[
              styles.menuItem,
              {
                paddingVertical: 20,
                flexDirection: isRTL ? "row-reverse" : "row",
              },
            ]}
          >
            <View style={[styles.menuItemLeft, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Palette size={24} color={colors.primary} />
              <View
                style={[
                  styles.menuItemText,
                  isRTL ? { marginRight: 16, marginLeft: 0 } : { marginLeft: 16, marginRight: 0 },
                  { alignItems: isRTL ? "flex-end" : "flex-start" },
                ]}
              >
                <Text style={[styles.menuItemTitle, { color: colors.text, textAlign: isRTL ? "right" : "left" }]}>
                  {t("theme_color")}
                </Text>
              </View>
            </View>
          </View>
          <View
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              justifyContent: "space-around",
              paddingBottom: 20,
              paddingHorizontal: 20,
            }}
          >
            {(Object.keys(colorMap) as ThemeColor[]).map((color) => (
              <TouchableOpacity
                key={color}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colorMap[color].primary,
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 3,
                  borderColor:
                    themeColor === color ? colors.text : "transparent",
                }}
                onPress={() => setThemeColor(color)}
              >
                {themeColor === color && <Check size={20} color="#ffffff" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, textAlign: isRTL ? "right" : "left" }]}>
          {t("preferences")}
        </Text>
        <View
          style={[
            styles.cardGroup,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {renderMenuItem(
            <SettingsIcon size={24} color={colors.primary} />,
            t("app_settings"),
            t("customize_experience"),
            () => {},
          )}
          {renderMenuItem(
            <DollarSign size={24} color={colors.primary} />,
            t("currency"),
            selectedCurrency.code + " (" + selectedCurrency.symbol + ")",
            () => setIsCurrencyModalVisible(true),
            false,
            false,
          )}
          {renderMenuItem(
            <Languages size={24} color={colors.primary} />,
            t("language"),
            selectedLanguage.nativeName,
            () => setIsLanguageModalVisible(true),
            false,
            true,
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, textAlign: isRTL ? "right" : "left" }]}>
          {t("support")}
        </Text>

        <View
          style={[
            styles.cardGroup,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {renderMenuItem(
            <HelpCircle size={24} color={colors.primary} />,
            t("help_center"),
            t("faqs_guides"),
            () => Linking.openURL("https://pennypilot.heatmapstudios.com"),
          )}

          {renderMenuItem(
            <Shield size={24} color={colors.primary} />,
            t("privacy_security"),
            t("manage_data_security"),
            () =>
              Linking.openURL(
                "https://pennypilot.heatmapstudios.com/privacy-policy",
              ),
          )}

          {renderMenuItem(
            <FileText size={24} color={colors.primary} />,
            t("terms_conditions"),
            t("terms_subtitle"),
            () =>
              Linking.openURL(
                "https://pennypilot.heatmapstudios.com/terms-and-conditions",
              ),
            false,
            true,
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, textAlign: isRTL ? "right" : "left" }]}>
          {t("connect")}
        </Text>
        <View
          style={[
            styles.cardGroup,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {renderMenuItem(
            <Mail size={24} color={colors.primary} />,
            t("contact_us"),
            t("get_in_touch"),
            () => Linking.openURL("mailto:srisantapradhan7@gmail.com"),
            false,
            true,
          )}
        </View>
      </View>

      <Text style={[styles.version, { color: colors.textSecondary, textAlign: "center" }]}>
        {t("version")} 1.0.0
      </Text>

      <CurrencyModal
        visible={isCurrencyModalVisible}
        onClose={() => setIsCurrencyModalVisible(false)}
      />

      <LanguageModal
        visible={isLanguageModalVisible}
        onClose={() => setIsLanguageModalVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    paddingHorizontal: 24,
    paddingVertical: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardGroup: {
    marginHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 8,
  },
  menuItem: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuItemLeft: {
    alignItems: "center",
    flex: 1,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  menuItemSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  menuItemRight: {
    alignItems: "center",
  },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  version: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    marginVertical: 32,
  },
});
