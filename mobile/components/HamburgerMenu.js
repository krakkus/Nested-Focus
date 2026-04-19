import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Pressable, StyleSheet, Switch, Platform, Clipboard } from 'react-native';

export default function HamburgerMenu({ isDarkMode, settings, onSettingChange, userId, onUserIdChange, generateUserId }) {
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);

  const colors = {
    bg: isDarkMode ? '#1F2937' : '#FFFFFF',
    overlay: 'rgba(0,0,0,0.4)',
    text: isDarkMode ? '#F9FAFB' : '#111827',
    subText: isDarkMode ? '#9CA3AF' : '#6B7280',
    border: isDarkMode ? '#374151' : '#E5E7EB',
    primary: '#3B82F6',
    icon: isDarkMode ? '#F9FAFB' : '#111827',
    inputBg: isDarkMode ? '#111827' : '#F3F4F6',
  };

  const startEdit = () => {
    setDraft(userId);
    setEditing(true);
  };

  const commitEdit = () => {
    const trimmed = draft.trim();
    if (trimmed) onUserIdChange(trimmed);
    setEditing(false);
  };

  const handleRandomize = () => {
    onUserIdChange(generateUserId());
    setEditing(false);
  };

  const handleCopy = () => {
    Clipboard.setString(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)} style={styles.hamburgerBtn} hitSlop={10}>
        <Text style={[styles.hamburgerIcon, { color: colors.icon }]}>☰</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={() => setVisible(false)}>
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

            <View style={[styles.idSection, { borderBottomColor: colors.border }]}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>User ID</Text>
              <Text style={[styles.rowSub, { color: colors.subText }]}>Unique identifier for this client</Text>
              <View style={styles.idRow}>
                {editing ? (
                  <TextInput
                    style={[styles.idInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.primary }]}
                    value={draft}
                    onChangeText={setDraft}
                    onSubmitEditing={commitEdit}
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    autoFocus
                  />
                ) : (
                  <TouchableOpacity onPress={handleCopy} style={[styles.idDisplay, { backgroundColor: colors.inputBg }]}>
                    <Text style={[styles.idText, { color: colors.text }]}>
                      {userId}{copied ? '  ✓' : ''}
                    </Text>
                  </TouchableOpacity>
                )}
                <View style={styles.idButtons}>
                  {editing ? (
                    <TouchableOpacity onPress={commitEdit} style={[styles.idBtn, { borderColor: colors.border }]}>
                      <Text style={{ color: colors.text, fontSize: 16 }}>✓</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={startEdit} style={[styles.idBtn, { borderColor: colors.border }]}>
                      <Text style={{ color: colors.text, fontSize: 16 }}>✎</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={handleRandomize} style={[styles.idBtn, { borderColor: colors.border }]}>
                    <Text style={{ color: colors.text, fontSize: 16 }}>⟳</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
  idSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  idDisplay: {
    flex: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  idText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 13,
  },
  idInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 13,
  },
  idButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  idBtn: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
