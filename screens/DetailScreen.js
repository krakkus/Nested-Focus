import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, SafeAreaView, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HamburgerMenu from '../components/HamburgerMenu';

const SETTINGS_KEY = '@settings_v1';

const REAPPEAR_OPTIONS = [
  { label: 'Never', value: 0 },
  { label: '1 day', value: 86400000 },
  { label: '3 days', value: 259200000 },
  { label: '1 week', value: 604800000 },
  { label: '2 weeks', value: 1209600000 },
  { label: '1 month', value: 2592000000 },
];

export default function DetailScreen({ route, navigation }) {
  const { task, onSave } = route.params;
  const isDarkMode = useColorScheme() === 'dark';

  const [note, setNote] = useState(task.note || '');
  const [completed, setCompleted] = useState(task.completed || false);
  const [reappearAfter, setReappearAfter] = useState(task.reappearAfter || 0);
  const [settings, setSettings] = useState({ showCompleted: true });

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then(raw => { if (raw) setSettings(JSON.parse(raw)); });
  }, []);

  const handleSettingChange = (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  };

  // Keep refs so the beforeRemove listener always has the latest values
  const noteRef = useRef(note);
  const completedRef = useRef(completed);
  const reappearAfterRef = useRef(reappearAfter);
  useEffect(() => { noteRef.current = note; }, [note]);
  useEffect(() => { completedRef.current = completed; }, [completed]);
  useEffect(() => { reappearAfterRef.current = reappearAfter; }, [reappearAfter]);

  // Auto-save whenever the screen is left (back gesture, hardware back, or ← Done)
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', () => {
      onSave(task.id, {
        note: noteRef.current,
        completed: completedRef.current,
        reappearAfter: reappearAfterRef.current,
        completedAt: completedRef.current ? (task.completedAt || Date.now()) : null,
      });
    });
    return unsub;
  }, [navigation]);

  const colors = {
    bg: isDarkMode ? '#111827' : '#F9FAFB',
    card: isDarkMode ? '#1F2937' : '#FFF',
    text: isDarkMode ? '#FFF' : '#000',
    subText: isDarkMode ? '#9CA3AF' : '#6B7280',
    border: isDarkMode ? '#374151' : '#E5E7EB',
    primary: '#3B82F6',
    success: '#10B981',
  };

  const toggleComplete = () => setCompleted(prev => !prev);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backTxt}>← Done</Text>
            </TouchableOpacity>
            <HamburgerMenu isDarkMode={isDarkMode} settings={settings} onSettingChange={handleSettingChange} />
          </View>

          <Text style={[styles.title, { color: colors.text, textDecorationLine: completed ? 'line-through' : 'none', opacity: completed ? 0.5 : 1 }]}>
            {task.text}
          </Text>

          {/* COMPLETE BUTTON */}
          <TouchableOpacity
            onPress={toggleComplete}
            style={[styles.completeBtn, { backgroundColor: completed ? colors.success : colors.primary, borderColor: completed ? colors.success : colors.primary }]}
          >
            <Text style={[styles.completeBtnText, { color: '#FFF' }]}>
              {completed ? '✓  Completed' : 'Mark as Complete'}
            </Text>
          </TouchableOpacity>

          {/* NOTES */}
          <Text style={[styles.label, { color: colors.subText }]}>NOTES</Text>
          <TextInput
            style={[styles.noteInput, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
            placeholder="Add details, links, or sub-notes..."
            placeholderTextColor="#6B7280"
            multiline
            value={note}
            onChangeText={setNote}
          />

          {/* REAPPEAR SETTING */}
          <Text style={[styles.label, { color: colors.subText, marginTop: 24 }]}>REAPPEAR AFTER COMPLETION</Text>
          <View style={styles.chipRow}>
            {REAPPEAR_OPTIONS.map(opt => {
              const active = reappearAfter === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setReappearAfter(opt.value)}
                  style={[styles.chip, { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border }]}
                >
                  <Text style={[styles.chipText, { color: active ? '#FFF' : colors.subText }]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {reappearAfter > 0 && (
            <Text style={[styles.reappearHint, { color: colors.subText }]}>
              Task will reappear {REAPPEAR_OPTIONS.find(o => o.value === reappearAfter)?.label} after being marked complete.
            </Text>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  backBtn: {},
  backTxt: { color: '#3B82F6', fontSize: 18, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  completeBtn: { borderWidth: 1.5, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 32 },
  completeBtnText: { fontSize: 16, fontWeight: '700' },
  label: { fontSize: 12, fontWeight: '800', marginBottom: 10, letterSpacing: 1 },
  noteInput: { minHeight: 160, padding: 15, borderRadius: 12, borderWidth: 1, fontSize: 16, textAlignVertical: 'top', marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  chipText: { fontSize: 13, fontWeight: '600' },
  reappearHint: { fontSize: 12, fontStyle: 'italic' },
});
