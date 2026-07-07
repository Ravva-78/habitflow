import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput } from 'react-native';
import { Colors, Spacing, Radius, Typography } from '../theme';
import { useStore } from '../store/useStore';

const COLORS = ['#00E5CC', '#7B61FF', '#4DA6FF', '#00E5A0', '#9B6DFF', '#FF61DC', '#FFB800', '#FF5E5E'];
const ICONS = ['📚', '🏃', '🧘', '💧', '😴', '📝', '🥗', '💻', '💪', '🎨'];

export default function AddHabitModal({ visible, onClose }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [reminderTime, setReminderTime] = useState('09:00');
  
  const addHabit = useStore(state => state.addHabit);

  const handleSave = () => {
    if (!name.trim()) return;
    addHabit({ name: name.trim(), icon, color, reminderTime, goal: 30 });
    setName('');
    setIcon(ICONS[0]);
    setColor(COLORS[0]);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={s.overlay}>
        <View style={s.modalContainer}>
          <View style={s.header}>
            <Text style={s.title}>New Quest</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={s.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.label}>Habit Name</Text>
          <TextInput
            style={s.input}
            placeholder="e.g. Read 10 Pages"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <Text style={s.label}>Icon</Text>
          <View style={s.row}>
            {ICONS.map(i => (
              <TouchableOpacity key={i} onPress={() => setIcon(i)} style={[s.chip, icon === i && s.chipActive]}>
                <Text style={{ fontSize: 20 }}>{i}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Color</Text>
          <View style={s.row}>
            {COLORS.map(c => (
              <TouchableOpacity key={c} onPress={() => setColor(c)} style={[s.colorCircle, { backgroundColor: c }, color === c && s.colorActive]} />
            ))}
          </View>

          <Text style={s.label}>Reminder Time (e.g. 09:00)</Text>
          <TextInput
            style={s.input}
            placeholder="09:00"
            placeholderTextColor={Colors.textMuted}
            value={reminderTime}
            onChangeText={setReminderTime}
          />

          <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
            <Text style={s.saveBtnTxt}>Add Quest</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: Colors.bgCard, padding: Spacing.xl, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  title: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  closeIcon: { fontSize: 20, color: Colors.textMuted, padding: Spacing.sm },
  label: { ...Typography.caption, marginBottom: Spacing.sm, marginTop: Spacing.md, color: Colors.textSecondary },
  input: { backgroundColor: Colors.bgInput, borderRadius: Radius.lg, padding: Spacing.md, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border, fontSize: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.bgInput, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryDim },
  colorCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'transparent' },
  colorActive: { borderColor: Colors.textPrimary },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', marginTop: Spacing.xl, marginBottom: Spacing.lg },
  saveBtnTxt: { color: Colors.bg, fontWeight: '800', fontSize: 16 }
});
