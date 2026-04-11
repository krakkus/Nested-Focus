/**
 * FILE REQUIREMENTS (DetailScreen.js):
 * 1.  [DONE] Detail View: "Open" button to enter a dedicated task page.
 * 2.  [DONE] Feature: "Notes" text area in Detail View.
 * 3.  [DONE] Persistence: Save notes back to the main task list.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, SafeAreaView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';

export default function DetailScreen({ route, navigation }) {
  const { task, onSave } = route.params; // We'll pass an onSave callback from Home
  const isDarkMode = useColorScheme() === 'dark';
  const [note, setNote] = useState(task.note || '');

  const handleSave = () => {
    onSave(task.id, note);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#111827' : '#F9FAFB' }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={styles.content}>
          <TouchableOpacity onPress={handleSave} style={styles.backBtn}>
            <Text style={styles.backTxt}>← Done</Text>
          </TouchableOpacity>
          
          <Text style={[styles.title, { color: isDarkMode ? '#FFF' : '#000' }]}>{task.text}</Text>
          
          <Text style={[styles.label, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>NOTES</Text>
          <TextInput
            style={[styles.noteInput, { 
              color: isDarkMode ? '#FFF' : '#000',
              backgroundColor: isDarkMode ? '#1F2937' : '#FFF',
              borderColor: isDarkMode ? '#374151' : '#E5E7EB'
            }]}
            placeholder="Add details, links, or sub-notes..."
            placeholderTextColor="#6B7280"
            multiline
            value={note}
            onChangeText={setNote}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, flex: 1 },
  backBtn: { marginBottom: 30 },
  backTxt: { color: '#3B82F6', fontSize: 18, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '800', marginBottom: 10, letterSpacing: 1 },
  noteInput: { 
    flex: 1, 
    padding: 15, 
    borderRadius: 12, 
    borderWidth: 1, 
    fontSize: 16, 
    textAlignVertical: 'top' 
  }
});