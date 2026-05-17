import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Share, Linking } from 'react-native';
import { Settings as SettingsIcon, Share2, MessageSquare, Mail, Star, CircleHelp as HelpCircle, Shield, Bell, Palette, CreditCard, ChevronRight } from 'lucide-react-native';

export default function SettingsScreen() {
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
    showBadge: boolean = false
  ) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        {icon}
        <View style={styles.menuItemText}>
          <Text style={styles.menuItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.menuItemRight}>
        {showBadge && <View style={styles.badge} />}
        <ChevronRight size={20} color="#6b7280" />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>More</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        {renderMenuItem(
          <SettingsIcon size={24} color="#6366f1" />,
          'App Settings',
          'Customize your experience',
          () => {}
        )}
        {renderMenuItem(
          <Bell size={24} color="#8b5cf6" />,
          'Notifications',
          'Manage alerts and reminders',
          () => {},
          true
        )}
        {renderMenuItem(
          <Palette size={24} color="#ec4899" />,
          'Appearance',
          'Dark mode and themes',
          () => {}
        )}
        {renderMenuItem(
          <CreditCard size={24} color="#14b8a6" />,
          'Payment Methods',
          'Manage your payment options',
          () => {}
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        {renderMenuItem(
          <HelpCircle size={24} color="#06b6d4" />,
          'Help Center',
          'FAQs and guides',
          () => {}
        )}
        {renderMenuItem(
          <Shield size={24} color="#10b981" />,
          'Privacy & Security',
          'Manage your data and security',
          () => {}
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connect</Text>
        {renderMenuItem(
          <Share2 size={24} color="#f59e0b" />,
          'Share App',
          'Invite friends and family',
          handleShare
        )}
        {renderMenuItem(
          <MessageSquare size={24} color="#ef4444" />,
          'Send Feedback',
          'Help us improve',
          handleFeedback
        )}
        {renderMenuItem(
          <Star size={24} color="#f97316" />,
          'Rate Us',
          'Love the app? Let us know!',
          () => Linking.openURL('https://example.com/rate')
        )}
        {renderMenuItem(
          <Mail size={24} color="#6366f1" />,
          'Contact Us',
          'Get in touch with our team',
          () => Linking.openURL('mailto:contact@example.com')
        )}
      </View>

      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 20,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#6b7280',
    paddingHorizontal: 20,
    paddingVertical: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    fontFamily: 'Inter_500Medium',
    color: '#111827',
  },
  menuItemSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6b7280',
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
    backgroundColor: '#ef4444',
    marginRight: 8,
  },
  version: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6b7280',
    marginVertical: 20,
  },
});