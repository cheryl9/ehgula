import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const CATEGORIES = ['General', 'Medications', 'Appointments', 'Meals', 'Exercise'];

const GENERAL_REMINDERS = [
  {
    id: '1',
    time: 'Today 11am',
    title: 'Have not moved for 2h...\nTime to move!',
    tag: 'Exercise',
    tagColor: '#E8D5F5',
    tagTextColor: '#9B59B6',
  },
  {
    id: '2',
    time: 'Today 12pm – 1pm:',
    title: 'Time to eat!!!',
    tag: 'Meals',
    tagColor: '#FDE9C8',
    tagTextColor: '#E67E22',
  },
  {
    id: '3',
    time: 'Saturday 2pm – 3pm:',
    title: 'Appointment with Dr. Lee',
    tag: 'Medications',
    tagColor: '#C8E6C9',
    tagTextColor: '#2E7D32',
  },
  {
    id: '4',
    time: 'Saturday 4pm – 5pm',
    title: 'Eat your medicine!!!',
    tag: 'Medications',
    tagColor: '#C8E6C9',
    tagTextColor: '#2E7D32',
  },
];

const APPOINTMENT_URGENCY = {
  level: 'High Urgency',
  reason: 'Based on glucose trends + 3 missed doses this week',
  lastVisit: 'Last clinic visit: 47 days ago',
};

const UPCOMING_APPOINTMENT = {
  time: 'Saturday 2pm – 3pm',
  status: 'Confirmed',
  doctor: 'Dr Lee Xavier',
  hospital: 'Raffles Hospital (Tampines)',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const CategoryPill = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.pill, active && styles.pillActive]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const ReminderRow = ({ item }) => (
  <View style={styles.reminderCard}>
    <View style={styles.reminderLeft}>
      <Text style={styles.reminderTime}>{item.time}</Text>
      <Text style={styles.reminderTitle}>{item.title}</Text>
    </View>
    <View style={styles.reminderRight}>
      <View style={[styles.tagBadge, { backgroundColor: item.tagColor }]}>
        <Text style={[styles.tagText, { color: item.tagTextColor }]}>{item.tag}</Text>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>Completed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>Snooze...</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

const AppointmentUrgencyCard = () => (
  <View style={styles.urgencyCard}>
    <Text style={styles.urgencyLabel}>⚠ High Urgency</Text>
    <Text style={styles.urgencyBody}>{APPOINTMENT_URGENCY.reason}</Text>
    <Text style={styles.urgencyMeta}>{APPOINTMENT_URGENCY.lastVisit}</Text>
    <TouchableOpacity style={styles.bookBtn} activeOpacity={0.8}>
      <Text style={styles.bookBtnText}>Book Suggested Slot</Text>
    </TouchableOpacity>
  </View>
);

const UpcomingAppointmentCard = () => (
  <View style={styles.upcomingCard}>
    <View style={styles.upcomingHeader}>
      <Text style={styles.upcomingTime}>{UPCOMING_APPOINTMENT.time}</Text>
      <View style={styles.confirmedBadge}>
        <Text style={styles.confirmedText}>Confirmed</Text>
      </View>
    </View>
    <Text style={styles.upcomingDoctor}>{UPCOMING_APPOINTMENT.doctor}</Text>
    <Text style={styles.upcomingHospital}>{UPCOMING_APPOINTMENT.hospital}</Text>

    <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.8}>
      <Text style={styles.outlineBtnText}>View pre-consultation health brief</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.8}>
      <Text style={styles.outlineBtnText}>View booking details</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.8}>
      <Text style={styles.outlineBtnText}>Reschedule booking</Text>
    </TouchableOpacity>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RemindersScreen({ onNavigate }) {
  const [activeCategory, setActiveCategory] = useState('General');

  const renderContent = () => {
    if (activeCategory === 'Appointments') {
      return (
        <>
          <Text style={styles.sectionLabel}>APPOINTMENT NEEDED</Text>
          <AppointmentUrgencyCard />

          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>UPCOMING APPOINTMENTS</Text>
          <UpcomingAppointmentCard />
        </>
      );
    }

    // General (and other tabs fall back to general list for now)
    return (
      <>
        {GENERAL_REMINDERS.map((item) => (
          <ReminderRow key={item.id} item={item} />
        ))}
      </>
    );
  };

  const mascotMessage =
    activeCategory === 'Appointments'
      ? 'Tick tock tick tock....'
      : "It's time to do these tasks!";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.pageTitle}>Reminders</Text>

        {/* Category pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pillRow}
          contentContainerStyle={styles.pillRowContent}
        >
          {CATEGORIES.map((cat) => (
            <CategoryPill
              key={cat}
              label={cat}
              active={activeCategory === cat}
              onPress={() => setActiveCategory(cat)}
            />
          ))}
        </ScrollView>

        {/* Dynamic content */}
        <View style={styles.contentBlock}>{renderContent()}</View>

        {/* Mascot + chat bubble */}
        <View style={styles.mascotRow}>
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>{mascotMessage}</Text>
          </View>
          <Image
            source={require('../assets/mascot.png')}
            style={styles.mascotImage}
            resizeMode="contain"
          />
        </View>
      </ScrollView>

      {/* Bottom tab bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem}>
          <MaterialCommunityIcons name="file-document" size={24} color="#555555" />
          <Text style={styles.tabLabel}>Summaries</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress = {() => onNavigate('chat')}>
          <MaterialCommunityIcons name="chat-outline" size={24} color="#555555" />
          <Text style={styles.tabLabel}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <MaterialCommunityIcons name="clock-outline" size={24} color="#5BAD8F" />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Reminders</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ACCENT_GREEN = '#5BAD8F';
const LIGHT_GREEN_BG = '#D8EFE3';
const CARD_BG = '#FFFFFF';
const PAGE_BG = '#F4F4F4';
const TEXT_DARK = '#1A1A1A';
const TEXT_MID = '#555555';
const TEXT_LIGHT = '#999999';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },

  // ── Title ──
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 16,
    letterSpacing: -0.5,
  },

  // ── Pills ──
  pillRow: {
    marginBottom: 20,
  },
  pillRowContent: {
    gap: 8,
    paddingRight: 8,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#E5E5E5',
  },
  pillActive: {
    backgroundColor: LIGHT_GREEN_BG,
    borderWidth: 1.5,
    borderColor: ACCENT_GREEN,
  },
  pillText: {
    fontSize: 13,
    color: TEXT_MID,
    fontWeight: '500',
  },
  pillTextActive: {
    color: ACCENT_GREEN,
    fontWeight: '700',
  },

  // ── Content ──
  contentBlock: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_LIGHT,
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 4,
  },

  // ── General Reminder Row ──
  reminderCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  reminderLeft: {
    flex: 1,
    paddingRight: 10,
  },
  reminderTime: {
    fontSize: 12,
    color: TEXT_LIGHT,
    marginBottom: 4,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_DARK,
    lineHeight: 20,
  },
  reminderRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  tagBadge: {
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    backgroundColor: '#EFEFEF',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionBtnText: {
    fontSize: 11,
    color: TEXT_MID,
    fontWeight: '500',
  },

  // ── Urgency Card ──
  urgencyCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  urgencyLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E53935',
    marginBottom: 6,
  },
  urgencyBody: {
    fontSize: 13,
    color: TEXT_DARK,
    marginBottom: 4,
    lineHeight: 18,
  },
  urgencyMeta: {
    fontSize: 12,
    color: TEXT_LIGHT,
    marginBottom: 14,
  },
  bookBtn: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  bookBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_DARK,
  },

  // ── Upcoming Appointment Card ──
  upcomingCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upcomingTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E53935',
  },
  confirmedBadge: {
    backgroundColor: '#C8E6C9',
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  confirmedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2E7D32',
  },
  upcomingDoctor: {
    fontSize: 14,
    color: TEXT_DARK,
    fontWeight: '500',
  },
  upcomingHospital: {
    fontSize: 13,
    color: TEXT_MID,
    marginBottom: 4,
  },
  outlineBtn: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  outlineBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_DARK,
  },

  // ── Mascot ──
  mascotRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    marginTop: 36,
    gap: 10,
  },
  speechBubble: {
    backgroundColor: ACCENT_GREEN,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    maxWidth: '60%',
  },
  speechText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  mascotImage: {
    width: 64,
    height: 64,
  },

  // ── Tab Bar ──
  tabBar: {
    flexDirection: 'row',
    backgroundColor: LIGHT_GREEN_BG,
    paddingVertical: 10,
    paddingBottom: 16,
    justifyContent: 'space-around',
    borderTopWidth: 0,
  },
  tabItem: {
    alignItems: 'center',
    gap: 6,
  },
  tabLabel: {
    fontSize: 12,
    color: TEXT_MID,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: ACCENT_GREEN,
    fontWeight: '700',
  },
});