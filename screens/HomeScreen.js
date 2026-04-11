import React, { useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Keyboard,
  useColorScheme,
  StatusBar,
  TouchableOpacity,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HamburgerMenu from '../components/HamburgerMenu';

const SETTINGS_KEY = '@settings_v1';

const TABS = {
  TODO: { id: 'todo', label: 'Todo', key: '@todo_v1' },
  SHARED: { id: 'shared', label: 'Shared', key: '@shared_v1' },
  TEMPLATE: { id: 'template', label: 'Template', key: '@template_v1' },
};

export default function HomeScreen({ navigation }) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const theme = useMemo(() => ({
    background: isDarkMode ? '#111827' : '#F9FAFB',
    card: isDarkMode ? '#1F2937' : '#FFFFFF',
    text: isDarkMode ? '#F9FAFB' : '#111827',
    subText: isDarkMode ? '#9CA3AF' : '#6B7280',
    border: isDarkMode ? '#374151' : '#E5E7EB',
    selectedBorder: '#3B82F6', 
    inputPlaceholder: isDarkMode ? '#6B7280' : '#9CA3AF',
    primary: '#3B82F6',
    success: '#10B981',
    danger: '#EF4444',
    disabled: isDarkMode ? '#374151' : '#D1D5DB',
    menuBackground: isDarkMode ? '#1F2937' : '#FFFFFF',
  }), [isDarkMode]);

  const styles = createStyles(theme, isDarkMode);

  // ----------------------------------------------------------------
  // STATE MANAGEMENT
  // ----------------------------------------------------------------
  const [activeTab, setActiveTab] = useState(TABS.TODO);
  const [globalData, setGlobalData] = useState({ todo: [], shared: [], template: [] });
  const [mainInput, setMainInput] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [focusStack, setFocusStack] = useState([]);
  const [clipboard, setClipboard] = useState(null);
  const [settings, setSettings] = useState({ showCompleted: true });

  // The current list being displayed based on the active tab
  const taskList = globalData[activeTab.id];

  // ----------------------------------------------------------------
  // PERSISTENCE ENGINE
  // ----------------------------------------------------------------
  useEffect(() => {
    loadAllTabsFromDisk();
    loadSettings();
  }, []);

  // Re-read settings when screen regains focus (e.g. returning from DetailScreen)
  useEffect(() => {
    const unsub = navigation.addListener('focus', loadSettings);
    return unsub;
  }, [navigation]);

  const loadSettings = async () => {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (raw) setSettings(JSON.parse(raw));
    } catch (e) { console.error('Settings load error', e); }
  };

  const saveSettings = async (newSettings) => {
    setSettings(newSettings);
    try { await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings)); }
    catch (e) { console.error('Settings save error', e); }
  };

  const handleSettingChange = (key, value) => saveSettings({ ...settings, [key]: value });

  const loadAllTabsFromDisk = async () => {
    try {
      const todoVal = await AsyncStorage.getItem(TABS.TODO.key);
      const sharedVal = await AsyncStorage.getItem(TABS.SHARED.key);
      const templVal = await AsyncStorage.getItem(TABS.TEMPLATE.key);

      const now = Date.now();
      const collapseRecursive = (list) => (list || []).map(item => {
        const shouldReappear = item.completed && item.reappearAfter > 0 && item.completedAt && (item.completedAt + item.reappearAfter) <= now;
        return {
          ...item,
          isExpanded: false,
          showInput: false,
          completed: shouldReappear ? false : item.completed,
          completedAt: shouldReappear ? null : item.completedAt,
          subTasks: collapseRecursive(item.subTasks || [])
        };
      });

      setGlobalData({
        todo: collapseRecursive(JSON.parse(todoVal || '[]')),
        shared: collapseRecursive(JSON.parse(sharedVal || '[]')),
        template: collapseRecursive(JSON.parse(templVal || '[]')),
      });
    } catch (e) { 
      console.error("Critical Load Error", e); 
    }
  };

  const syncTabToDisk = async (tabId, data) => {
    try {
      const key = TABS[tabId.toUpperCase()].key;
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (e) { 
      console.error("Critical Save Error", e); 
    }
  };

  const updateGlobalData = (tabId, newList) => {
    setGlobalData(prev => ({ ...prev, [tabId]: newList }));
    syncTabToDisk(tabId, newList);
  };

  // ----------------------------------------------------------------
  // SEARCH & HELPER LOGIC
  // ----------------------------------------------------------------
  const findTaskGlobally = (id) => {
    const search = (list) => {
      for (const node of list) {
        if (node.id === id) return node;
        if (node.subTasks?.length > 0) {
          const found = search(node.subTasks);
          if (found) return found;
        }
      }
      return null;
    };
    return search(globalData.todo) || search(globalData.shared) || search(globalData.template);
  };

  const findTaskInActiveList = (tasks, id) => {
    for (const node of tasks) {
      if (node.id === id) return node;
      if (node.subTasks?.length > 0) {
        const found = findTaskInActiveList(node.subTasks, id);
        if (found) return found;
      }
    }
    return null;
  };

  // ----------------------------------------------------------------
  // CLIPBOARD & LINKING ACTIONS
  // ----------------------------------------------------------------
  const handleCopyTask = () => {
    if (selectedItem) {
      setClipboard({
        data: JSON.parse(JSON.stringify(selectedItem.item)),
        fromTabId: activeTab.id
      });
      setSelectedItem(null);
    }
  };

  // ----------------------------------------------------------------
  // CLIPBOARD & LINKING ACTIONS
  // ----------------------------------------------------------------
   const handlePasteTask = (currentFocusRoot) => {
    if (!clipboard) return;

    // 1. Prepare the Task to be Pasted
    let newTask;
    const isFromSharedTab = clipboard.fromTabId === 'shared';
    const isPastingToSharedTab = activeTab.id === 'shared';

    if (isFromSharedTab && !isPastingToSharedTab) {
      newTask = {
        id: Date.now(),
        text: `🔗 ${clipboard.data.text}`,
        isLink: true,
        originalId: clipboard.data.id,
        subTasks: [],
        note: `Reference to Shared Task.`,
      };
      // Sync Ref Counter
      const updatedShared = incrementReferenceCounter(globalData.shared, clipboard.data.id);
      updateGlobalData('shared', updatedShared);
    } else {
      newTask = {
        ...JSON.parse(JSON.stringify(clipboard.data)),
        id: Date.now() + Math.random(),
        refCount: 0
      };
    }

    // 2. Clone the entire global state to ensure React triggers a re-render
    const newGlobalData = JSON.parse(JSON.stringify(globalData));
    const currentTabList = newGlobalData[activeTab.id];

    // 3. Find the parent in the NEW cloned list
    if (selectedItem) {
      // Find the parent by ID in the cloned list to maintain reference integrity
      const parentInClone = findTaskInActiveList(currentTabList, selectedItem.item.id);
      if (parentInClone) {
        parentInClone.subTasks.push(newTask);
        parentInClone.isExpanded = true;
      }
    } else if (currentFocusRoot) {
      const parentInClone = findTaskInActiveList(currentTabList, currentFocusRoot.id);
      if (parentInClone) {
        parentInClone.subTasks.push(newTask);
        parentInClone.isExpanded = true;
      }
    } else {
      currentTabList.push(newTask);
    }

    // 4. Update the actual State
    setGlobalData(newGlobalData);
    syncTabToDisk(activeTab.id, currentTabList);
    setSelectedItem(null);
  };

  const incrementReferenceCounter = (list, targetId) => {
    return list.map(item => {
      if (item.id === targetId) {
        return { ...item, refCount: (item.refCount || 0) + 1 };
      }
      if (item.subTasks?.length > 0) {
        return { ...item, subTasks: incrementReferenceCounter(item.subTasks, targetId) };
      }
      return item;
    });
  };

  // ----------------------------------------------------------------
  // TASK MODIFICATION ACTIONS
  // ----------------------------------------------------------------
const handleDeleteTask = () => {
    if (!selectedItem) return;
    Alert.alert(
      'Delete Task',
      `Delete "${selectedItem.item.text}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => confirmDelete() },
      ]
    );
  };

  const confirmDelete = () => {
    if (!selectedItem) return;
    const idToDelete = selectedItem.item.id;

    // Helper: Deeply filters a list to remove a specific ID
    const removeById = (list) => {
      return list
        .filter(item => item.id !== idToDelete)
        .map(item => ({
          ...item,
          subTasks: removeById(item.subTasks || [])
        }));
    };

    // We update EVERY tab in the global data. 
    // This ensures that if you delete a sub-item inside a 'Shared' portal, 
    // it actually gets removed from the 'Shared' source data.
    const newGlobalData = {
      todo: removeById(globalData.todo),
      shared: removeById(globalData.shared),
      template: removeById(globalData.template),
    };

    // Update State
    setGlobalData(newGlobalData);

    // Save all tabs to disk to ensure the deletion sticks
    syncTabToDisk('todo', newGlobalData.todo);
    syncTabToDisk('shared', newGlobalData.shared);
    syncTabToDisk('template', newGlobalData.template);

    // Clear selection
    setSelectedItem(null);
  };

  const triggerInputCleanup = () => {
    const clean = (list) => list.map(item => ({
      ...item,
      showInput: item.tempInput?.trim().length > 0 ? item.showInput : false,
      subTasks: clean(item.subTasks || [])
    }));
    updateGlobalData(activeTab.id, clean([...taskList]));
  };

  const handleAddTask = (text, parentTask) => {
    if (!text.trim()) return;
    const newTask = { id: Date.now() + Math.random(), text: text.trim(), isExpanded: false, subTasks: [], showInput: false, note: '' };
    const newList = [...taskList];
    if (parentTask) {
      const target = findTaskInActiveList(newList, parentTask.id);
      if (target) { target.subTasks.push(newTask); target.isExpanded = true; }
    } else {
      newList.push(newTask);
    }
    updateGlobalData(activeTab.id, newList);
    setMainInput('');
  };

  // ----------------------------------------------------------------
  // FOCUS & NAVIGATION
  // ----------------------------------------------------------------
  const currentFocusId = focusStack[focusStack.length - 1];
  const focusedTask = currentFocusId ? findTaskInActiveList(taskList, currentFocusId) : null;

  const filterBySettings = (list) => {
    if (settings.showCompleted) return list;
    return list
      .filter(item => !item.completed)
      .map(item => ({ ...item, subTasks: filterBySettings(item.subTasks || []) }));
  };
  const displayData = filterBySettings(focusedTask ? [focusedTask] : taskList);

  // ----------------------------------------------------------------
  // RENDERING ENGINE
  // ----------------------------------------------------------------
  const renderTaskItem = (item, index, parentList) => {
    const isSelected = selectedItem?.item.id === item.id;
    const isRootOfFocus = item.id === currentFocusId;
    
    // PORTAL LOGIC (Requirement 26-29)
    const sourceTask = item.isLink ? findTaskGlobally(item.originalId) : null;
    const isBrokenLink = item.isLink && !sourceTask;
    const effectiveSubTasks = item.isLink ? (sourceTask?.subTasks || []) : (item.subTasks || []);
    const hasChildren = effectiveSubTasks.length > 0;

    return (
      <View style={styles.itemContainer} key={item.id}>
        <Pressable 
          onPress={() => { 
            Keyboard.dismiss(); 
            triggerInputCleanup(); 
            setSelectedItem(isSelected ? null : { item, index, parentList }); 
          }} 
          style={[styles.itemRow, isSelected && styles.selectedRow, isRootOfFocus && styles.rootFocusRow]}
        >
          {/* EXPAND/COLLAPSE ICON */}
          <Pressable 
            onPress={() => { 
              if (hasChildren && !isBrokenLink) { 
                item.isExpanded = !item.isExpanded; 
                updateGlobalData(activeTab.id, [...taskList]); 
              } 
            }} 
            hitSlop={10}
          >
            <View style={styles.iconWrapper}>
               {isBrokenLink ? (
                 <Text style={{ fontSize: 14 }}>⚠️</Text>
               ) : hasChildren ? (
                 <Text style={styles.expandIcon}>{item.isExpanded ? '▼' : '▶'}</Text>
               ) : (
                 <View style={{ width: 25 }} />
               )}
            </View>
          </Pressable>
          
          <Text style={[styles.itemText, isBrokenLink && { color: theme.danger, fontStyle: 'italic' }, item.completed && { textDecorationLine: 'line-through', opacity: 0.45 }]}>
            {item.text} {isBrokenLink && "(Broken Source)"}
            {item.refCount > 0 && <Text style={styles.refCounterText}> (Ref: {item.refCount})</Text>}
          </Text>

          {item.note?.trim().length > 0 && <Text style={styles.noteIcon}>📝</Text>}
          
          {/* INLINE ADD BUTTON (Disabled for Focused Root and Links) */}
          {!isRootOfFocus && !item.isLink && (
            <Pressable 
              onPress={() => { triggerInputCleanup(); item.isExpanded = true; item.showInput = true; updateGlobalData(activeTab.id, [...taskList]); }} 
              hitSlop={10}
            >
              <Text style={styles.inlinePlus}>+</Text>
            </Pressable>
          )}
        </Pressable>
        
        {/* RECURSIVE SUB-LIST RENDERING */}
        {item.isExpanded && !isBrokenLink && (
          <View style={styles.subListContainer}>
            {effectiveSubTasks.map((subItem, subIndex) => renderTaskItem(subItem, subIndex, effectiveSubTasks))}
            
            {/* INLINE SUB-INPUT */}
            {item.showInput && !item.isLink && (
              <View style={styles.subInputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter sub-task..."
                  placeholderTextColor={theme.inputPlaceholder}
                  autoFocus={true}
                  onBlur={triggerInputCleanup}
                  onSubmitEditing={(e) => {
                    const txt = e.nativeEvent.text;
                    if (txt.trim()) {
                      item.subTasks.push({ 
                        id: Date.now() + Math.random(), 
                        text: txt.trim(), 
                        isExpanded: false, 
                        subTasks: [], 
                        tempInput: '', 
                        showInput: false, 
                        note: '' 
                      });
                      updateGlobalData(activeTab.id, [...taskList]);
                    } else triggerInputCleanup();
                  }}
                />
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* HEADER TABS + HAMBURGER */}
      <View style={styles.topBar}>
        <View style={[styles.tabContainer, { flex: 1 }]}>
          {Object.values(TABS).map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => { setActiveTab(tab); setSelectedItem(null); setFocusStack([]); }}
              style={[styles.tabButton, activeTab.id === tab.id && styles.activeTabButton]}
            >
              <Text style={[styles.tabButtonText, activeTab.id === tab.id && styles.activeTabButtonText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <HamburgerMenu isDarkMode={isDarkMode} settings={settings} onSettingChange={handleSettingChange} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={styles.mainContentWrapper}>
          
          {/* NAV BAR / BREADCRUMBS */}
          <View style={styles.navigationHeader}>
            <View style={styles.navRow}>
              {focusStack.length > 0 && (
                <TouchableOpacity onPress={() => { setFocusStack(focusStack.slice(0, -1)); setSelectedItem(null); }}>
                  <Text style={styles.backLinkText}>← Back</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.breadcrumbText} numberOfLines={1}>
                {focusStack.length > 0 ? focusStack.map(id => findTaskInActiveList(taskList, id)?.text).join(' > ') : ''}
              </Text>
            </View>
            <Text style={styles.titleText}>{focusedTask ? focusedTask.text : "Nested Focus"}</Text>
          </View>

          <FlatList
            data={displayData}
            keyboardShouldPersistTaps="always"
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => renderTaskItem(item, index, focusedTask ? focusedTask.subTasks : taskList)}
            ListFooterComponent={
              <View style={[styles.mainInputWrapper, focusedTask && { marginLeft: 25, borderColor: theme.border }]}>
                <TextInput 
                  style={styles.textInput} 
                  placeholderTextColor={theme.inputPlaceholder}
                  placeholder={`Add to ${focusedTask ? focusedTask.text : activeTab.label}...`} 
                  value={mainInput} 
                  onChangeText={setMainInput} 
                  onSubmitEditing={() => handleAddTask(mainInput, focusedTask)} 
                />
              </View>
            }
          />
        </View>
      </KeyboardAvoidingView>

      {/* PERSISTENT BOTTOM MENU */}
      <View style={styles.bottomMenuBar}>
        <Text style={styles.menuStatusLabel}>
          {selectedItem ? `Selected: "${selectedItem.item.text}"` : clipboard ? "Clipboard: Item ready" : "Select a task to edit"}
        </Text>
        <View style={styles.menuButtonRow}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: selectedItem ? theme.primary : theme.disabled }]} 
            onPress={() => { setFocusStack([...focusStack, selectedItem.item.id]); setSelectedItem(null); }} 
            disabled={!selectedItem}
          >
            <Text style={styles.actionButtonText}>Focus</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: selectedItem ? theme.primary : theme.disabled }]} 
            onPress={handleCopyTask} 
            disabled={!selectedItem}
          >
            <Text style={styles.actionButtonText}>Copy</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: clipboard ? theme.success : theme.disabled }]} 
            onPress={() => handlePasteTask(focusedTask)} 
            disabled={!clipboard}
          >
            <Text style={styles.actionButtonText}>Paste</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: selectedItem ? theme.primary : theme.disabled }]} 
            onPress={() => navigation.navigate('Details', { 
              task: selectedItem.item,
              onSave: (id, { note, completed, reappearAfter, completedAt }) => {
                const newList = [...taskList];
                const target = findTaskInActiveList(newList, id);
                if (target) {
                  target.note = note;
                  target.completed = completed;
                  target.reappearAfter = reappearAfter;
                  target.completedAt = completedAt;
                  updateGlobalData(activeTab.id, newList);
                }
              }
            })} 
            disabled={!selectedItem}
          >
            <Text style={styles.actionButtonText}>Open</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: selectedItem ? theme.danger : theme.disabled }]} 
            onPress={handleDeleteTask} 
            disabled={!selectedItem}
          >
            <Text style={styles.actionButtonText}>Del</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme, isDarkMode) => StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: theme.background },
  topBar: { flexDirection: 'row', alignItems: 'center', marginTop: 60, marginHorizontal: 20, gap: 10 },
  tabContainer: { flexDirection: 'row', backgroundColor: theme.card, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: theme.border },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTabButton: { backgroundColor: theme.primary },
  tabButtonText: { fontSize: 13, fontWeight: '600', color: theme.subText },
  activeTabButtonText: { color: '#FFF' },
  mainContentWrapper: { paddingHorizontal: 20, flex: 1, paddingTop: 20 },
  navigationHeader: { marginBottom: 20 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 30 },
  backLinkText: { color: theme.primary, fontSize: 16, fontWeight: '600' },
  breadcrumbText: { color: theme.subText, fontSize: 11, flex: 1, textAlign: 'right', paddingLeft: 10 },
  titleText: { fontSize: 28, fontWeight: '800', color: theme.text },
  itemContainer: { marginBottom: 5 },
  itemRow: { backgroundColor: theme.card, padding: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  selectedRow: { borderColor: theme.primary, borderWidth: 2, backgroundColor: isDarkMode ? '#1E3A8A' : '#EFF6FF' },
  rootFocusRow: { borderStyle: 'dotted', borderColor: theme.primary }, 
  iconWrapper: { width: 25 },
  expandIcon: { fontSize: 18, color: theme.primary },
  itemText: { flex: 1, fontSize: 16, color: theme.text },
  refCounterText: { fontSize: 12, color: theme.primary, fontWeight: 'bold' },
  noteIcon: { fontSize: 14, marginRight: 8, opacity: 0.6 },
  inlinePlus: { fontSize: 26, color: theme.success, fontWeight: 'bold', paddingHorizontal: 5 },
  subListContainer: { marginLeft: 25, marginTop: 5 },
  subInputWrapper: { padding: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: theme.inputPlaceholder, borderRadius: 8, marginLeft: 10, marginVertical: 5 },
  mainInputWrapper: { padding: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: theme.primary, borderRadius: 12, marginTop: 10, marginBottom: 180 },
  textInput: { flex: 1, fontSize: 16, color: theme.text },
  bottomMenuBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: theme.menuBackground, padding: 15, paddingBottom: Platform.OS === 'ios' ? 40 : 15, borderTopWidth: 1, borderTopColor: theme.border, elevation: 20 },
  menuStatusLabel: { fontSize: 11, color: theme.subText, marginBottom: 10, textAlign: 'center' },
  menuButtonRow: { flexDirection: 'row', gap: 5 },
  actionButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  actionButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
});