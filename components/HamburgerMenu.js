import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet, Switch, Platform } from 'react-native';

export default function HamburgerMenu({ isDarkMode, settings, onSettingChange }) {
  const [visible, setVisible] = useState(false);

  const colors = {
    bg: isDarkMode ? '#1F2937' : '#FFFFFF',
    overlay: 'rgba(0,0,0,0.4)',
    text: isDarkMode ? '#F9FAFB' : '#111827',
    subText: isDarkMode ? '#9CA3AF' : '#6B7280',
    border: isDarkMode ? '#374151' : '#E5E7EB',
    primary: '#3B82F6',
    icon: isDarkMode ? '#F9FAFB' : '#111827',
  };

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)} style={styles.hamburgerBtn} hitSlop={10}>
        <Text style={[styles.hamburgerIcon, { color: colors.icon }]}>☰</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={() => setVisible(false)}>
          {/* Prevent taps inside the drawer from closing it */}
          <Pressable style={[styles.drawer, { backgroundColor: colors.bg }]} onPress={e => e.stopPropagation()}>

            <Text style={[styles.drawerTitle, { color: colors.text, borderBottomColor: colors.border }]}>Settings</Text>

            <View style={[styles.row, { borderBottomColor: colors.border }]}>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>Show Completed</Text>
                <Text style={[styles.rowSub, { color: colors.subText }]}>Display tasks marked as done</Text>
              </View>
              <Switch
                value={settings.showCompleted}
                onValueChange={val => onSettingChange('showCompleted', val)}
                trackColor={{ false: '#374151', true: colors.primary }}
                thumbColor="#FFF"
              />
            </View>

          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  hamburgerBtn: { padding: 4 },
  hamburgerIcon: { fontSize: 22 },
  overlay: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  drawer: {
    width: 280,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '800',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  rowText: { flex: 1, marginRight: 12 },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 12, marginTop: 2 },
});
