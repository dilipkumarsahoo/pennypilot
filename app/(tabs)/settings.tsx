import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Share, Linking, Switch } from 'react-native';
import { Settings as SettingsIcon, Share2, MessageSquare, Mail, Star, CircleHelp as HelpCircle, Shield, Bell, Palette, CreditCard, ChevronRight, Moon, Check } from 'lucide-react-native';
import { useThemeStore, ThemeColor, colorMap } from '@/store/themeStore';
import { LinearGradient } from 'expo-linear-gradient';

export default function SettingsScreen() {
  const { colors, themeMode, themeColor, isDark, setThemeMode, setThemeColor } = useThemeStore();

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Check out this amazing finance tracking app!',
        title: 'Finance Tracker',
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleFeedback = () => {
    Linking.openURL('mailto:feedback@example.com?subject=App%20Feedback');
  };

  const renderMenuItem = (
    icon: React.ReactNode,
    title: string,
    subtitle: string | null = null,
    onPress: () => void,
    showBadge: boolean = false,
    isLast: boolean = false
  ) => (
    <TouchableOpacity 
      style={[styles.menuItem, { borderBottomWidth: isLast ? 0 : 1, borderBottomColor: colors.border }]} 
      onPress={onPress}
    >
      <View style={styles.menuItemLeft}>
        {icon}
        <View style={styles.menuItemText}>
          <Text style={[styles.menuItemTitle, { color: colors.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.menuItemSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.menuItemRight}>
        {showBadge && <View style={[styles.badge, { backgroundColor: colors.danger }]} />}
        <ChevronRight size={20} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Appearance</Text>
        
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ 
              padding: 24, 
              borderRadius: 20, 
              shadowColor: colors.primary, 
              shadowOffset: { width: 0, height: 8 }, 
              shadowOpacity: 0.3, 
              shadowRadius: 12,
              elevation: 8
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'Inter_500Medium' }}>Theme Preview</Text>
                <Text style={{ color: '#ffffff', fontSize: 28, fontFamily: 'Inter_700Bold', marginTop: 4, letterSpacing: -0.5 }}>$12,450.00</Text>
              </View>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                <Star size={22} color="#ffffff" />
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={[styles.cardGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.menuItem, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <View style={styles.menuItemLeft}>
              <Moon size={24} color={colors.primary} />
              <View style={styles.menuItemText}>
                <Text style={[styles.menuItemTitle, { color: colors.text }]}>Dark Mode</Text>
                <Text style={[styles.menuItemSubtitle, { color: colors.textSecondary }]}>
                  {themeMode === 'system' ? 'System Default' : (isDark ? 'On' : 'Off')}
                </Text>
              </View>
            </View>
            <View style={styles.menuItemRight}>
              <Switch
                value={isDark}
                onValueChange={(val) => setThemeMode(val ? 'dark' : 'light')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={'#ffffff'}
              />
            </View>
          </View>

          <View style={[styles.menuItem, { paddingVertical: 20 }]}>
            <View style={styles.menuItemLeft}>
              <Palette size={24} color={colors.primary} />
              <View style={styles.menuItemText}>
                <Text style={[styles.menuItemTitle, { color: colors.text }]}>Theme Color</Text>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 20, paddingHorizontal: 20 }}>
            {(Object.keys(colorMap) as ThemeColor[]).map((color) => (
              <TouchableOpacity
                key={color}
                style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: colorMap[color].primary,
                  justifyContent: 'center', alignItems: 'center',
                  borderWidth: 3,
                  borderColor: themeColor === color ? colors.text : 'transparent'
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
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Preferences</Text>
        <View style={[styles.cardGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {renderMenuItem(<SettingsIcon size={24} color={colors.primary} />, 'App Settings', 'Customize your experience', () => {})}
          {renderMenuItem(<Bell size={24} color={colors.primary} />, 'Notifications', 'Manage alerts and reminders', () => {}, true)}
          {renderMenuItem(<CreditCard size={24} color={colors.primary} />, 'Payment Methods', 'Manage your payment options', () => {}, false, true)}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Support</Text>
        <View style={[styles.cardGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {renderMenuItem(<HelpCircle size={24} color={colors.primary} />, 'Help Center', 'FAQs and guides', () => {})}
          {renderMenuItem(<Shield size={24} color={colors.primary} />, 'Privacy & Security', 'Manage your data and security', () => {}, false, true)}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Connect</Text>
        <View style={[styles.cardGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {renderMenuItem(<Share2 size={24} color={colors.primary} />, 'Share App', 'Invite friends and family', handleShare)}
          {renderMenuItem(<MessageSquare size={24} color={colors.primary} />, 'Send Feedback', 'Help us improve', handleFeedback)}
          {renderMenuItem(<Star size={24} color={colors.primary} />, 'Rate Us', 'Love the app? Let us know!', () => Linking.openURL('https://example.com/rate'))}
          {renderMenuItem(<Mail size={24} color={colors.primary} />, 'Contact Us', 'Get in touch with our team', () => Linking.openURL('mailto:contact@example.com'), false, true)}
        </View>
      </View>

      <Text style={[styles.version, { color: colors.textSecondary }]}>Version 1.0.0</Text>
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
    fontFamily: 'Inter_700Bold',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    paddingHorizontal: 24,
    paddingVertical: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardGroup: {
    marginHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    marginLeft: 16,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  menuItemSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  version: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginVertical: 32,
  },
});