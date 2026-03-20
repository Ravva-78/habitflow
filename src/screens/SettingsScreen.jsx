import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, TextInput, Modal, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHabits } from '../hooks/useHabits';
import { Colors, Spacing, Radius, Typography } from '../theme';

const ICONS  = ['📚','🏃','🧘','💧','🥗','🤸','🛁','💪','🎵','✍️','🌿','🧠','🚶','🎨','😴'];
const COLORS = ['#00E5CC','#4ADE80','#60A5FA','#FBBF24','#F87171','#A78BFA','#2DD4BF','#F472B6'];

export default function SettingsScreen() {
  const { habits, addHabit, updateHabit, deleteHabit } = useHabits();
  const [showModal,setShowModal] = useState(false);
  const [editingHabit,setEditingHabit] = useState(null);
  const [form,setForm] = useState({name:'',icon:'⭐',reminderTime:'08:00',color:'#00E5CC'});

  const openAdd = () => { setEditingHabit(null); setForm({name:'',icon:'⭐',reminderTime:'08:00',color:'#00E5CC'}); setShowModal(true); };
  const openEdit = h => { setEditingHabit(h); setForm({name:h.name,icon:h.icon,reminderTime:h.reminderTime,color:h.color}); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (editingHabit) await updateHabit(editingHabit.id, form);
    else await addHabit(form);
    setShowModal(false);
  };

  const handleDelete = h => Alert.alert(`Delete "${h.name}"?`, 'This cannot be undone.', [
    {text:'Cancel',style:'cancel'},
    {text:'Delete',style:'destructive',onPress:()=>deleteHabit(h.id)},
  ]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Settings</Text>

        <Text style={s.secTitle}>MY HABITS</Text>
        {habits.map(h => (
          <View key={h.id} style={s.hRow}>
            <View style={[s.hIcon,{backgroundColor:h.color+'22'}]}><Text style={{fontSize:20}}>{h.icon}</Text></View>
            <View style={{flex:1}}>
              <Text style={s.hName}>{h.name}</Text>
              <Text style={s.hTime}>⏰ {h.reminderTime}</Text>
            </View>
            <TouchableOpacity onPress={()=>openEdit(h)} style={s.editBtn}><Text style={s.editT}>Edit</Text></TouchableOpacity>
            <TouchableOpacity onPress={()=>handleDelete(h)}><Text style={{fontSize:16}}>🗑</Text></TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={s.addBtn} onPress={openAdd}>
          <Text style={s.addBtnT}>+ Add New Habit</Text>
        </TouchableOpacity>

        <Text style={s.secTitle}>ABOUT</Text>
        <View style={s.card}>
          <Text style={s.aboutT}>HabitFlow v1.0 🔥</Text>
          <Text style={s.aboutS}>7 habits loaded from your Excel tracker</Text>
        </View>
        <View style={{height:100}}/>
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <Text style={s.modalTitle}>{editingHabit?'Edit Habit':'New Habit'}</Text>
            <Text style={s.fieldLabel}>Habit name</Text>
            <TextInput style={s.input} value={form.name} onChangeText={t=>setForm(f=>({...f,name:t}))} placeholder="e.g. Journaling" placeholderTextColor={Colors.textMuted}/>
            <Text style={s.fieldLabel}>Choose icon</Text>
            <View style={s.iconGrid}>
              {ICONS.map(icon=>(
                <TouchableOpacity key={icon} onPress={()=>setForm(f=>({...f,icon}))} style={[s.iconOpt,form.icon===icon&&s.iconSel]}>
                  <Text style={{fontSize:20}}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.fieldLabel}>Reminder time (HH:MM)</Text>
            <TextInput style={s.input} value={form.reminderTime} onChangeText={t=>setForm(f=>({...f,reminderTime:t}))} placeholder="08:00" placeholderTextColor={Colors.textMuted} keyboardType="numbers-and-punctuation"/>
            <Text style={s.fieldLabel}>Colour</Text>
            <View style={s.colorRow}>
              {COLORS.map(c=>(
                <TouchableOpacity key={c} onPress={()=>setForm(f=>({...f,color:c}))} style={[s.colorDot,{backgroundColor:c},form.color===c&&{borderWidth:3,borderColor:'#fff'}]}/>
              ))}
            </View>
            <View style={s.btns}>
              <TouchableOpacity style={s.cancelBtn} onPress={()=>setShowModal(false)}><Text style={s.cancelT}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={handleSave}><Text style={s.saveT}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:Colors.bg},
  title:{...Typography.h1,marginHorizontal:Spacing.lg,marginTop:Spacing.lg,marginBottom:Spacing.md},
  secTitle:{...Typography.label,marginHorizontal:Spacing.lg,marginBottom:Spacing.sm,marginTop:Spacing.sm},
  hRow:{flexDirection:'row',alignItems:'center',marginHorizontal:Spacing.lg,marginBottom:Spacing.sm,backgroundColor:Colors.bgCard,borderRadius:Radius.lg,padding:Spacing.md,borderWidth:1,borderColor:Colors.border},
  hIcon:{width:40,height:40,borderRadius:Radius.md,alignItems:'center',justifyContent:'center',marginRight:Spacing.md},
  hName:{...Typography.body,fontWeight:'600'},hTime:{...Typography.caption,marginTop:2},
  editBtn:{paddingHorizontal:Spacing.sm,paddingVertical:4,marginRight:4},editT:{color:Colors.primary,fontSize:13,fontWeight:'600'},
  addBtn:{marginHorizontal:Spacing.lg,marginBottom:Spacing.lg,borderWidth:1.5,borderStyle:'dashed',borderColor:Colors.primary+'66',borderRadius:Radius.lg,padding:Spacing.md,alignItems:'center'},
  addBtnT:{color:Colors.primary,fontWeight:'700',fontSize:15},
  card:{marginHorizontal:Spacing.lg,marginBottom:Spacing.md,backgroundColor:Colors.bgCard,borderRadius:Radius.lg,padding:Spacing.md,borderWidth:1,borderColor:Colors.border},
  aboutT:{...Typography.body,fontWeight:'600'},aboutS:{...Typography.caption,marginTop:4},
  overlay:{flex:1,justifyContent:'flex-end',backgroundColor:'rgba(0,0,0,0.6)'},
  sheet:{backgroundColor:Colors.bgCard,borderTopLeftRadius:24,borderTopRightRadius:24,padding:Spacing.lg,paddingBottom:Spacing.xxl},
  modalTitle:{...Typography.h2,marginBottom:Spacing.lg},
  fieldLabel:{...Typography.label,marginBottom:Spacing.xs,marginTop:Spacing.sm},
  input:{backgroundColor:Colors.bgInput,borderRadius:Radius.md,padding:Spacing.md,color:Colors.textPrimary,borderWidth:1,borderColor:Colors.border},
  iconGrid:{flexDirection:'row',flexWrap:'wrap',gap:Spacing.sm,marginBottom:Spacing.sm},
  iconOpt:{width:44,height:44,borderRadius:Radius.md,backgroundColor:Colors.bgInput,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:Colors.border},
  iconSel:{borderColor:Colors.primary,backgroundColor:Colors.primary+'22'},
  colorRow:{flexDirection:'row',gap:Spacing.sm,flexWrap:'wrap'},
  colorDot:{width:32,height:32,borderRadius:16},
  btns:{flexDirection:'row',marginTop:Spacing.lg,gap:Spacing.md},
  cancelBtn:{flex:1,padding:Spacing.md,borderRadius:Radius.lg,borderWidth:1,borderColor:Colors.border,alignItems:'center'},
  cancelT:{...Typography.body,color:Colors.textSecondary},
  saveBtn:{flex:1,padding:Spacing.md,borderRadius:Radius.lg,backgroundColor:Colors.primary,alignItems:'center'},
  saveT:{...Typography.body,color:'#fff',fontWeight:'700'},
});
