import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GOAL_CATEGORIES } from '../data/habits';
import { Colors, Spacing, Radius, Typography } from '../theme';

const STATUSES = [
  {key:'not_started',label:'❌ Not Started',color:Colors.textMuted},
  {key:'in_progress',label:'▶️ In Progress',color:Colors.amber},
  {key:'achieved',   label:'✔️ Achieved',   color:Colors.green},
];

const init = {};
GOAL_CATEGORIES.forEach(c => { init[c.id] = []; });

export default function GoalsScreen() {
  const [goals,setGoals] = useState(init);
  const [expanded,setExpanded] = useState(null);
  const [showModal,setShowModal] = useState(false);
  const [editGoal,setEditGoal] = useState(null);
  const [selectedCat,setSelectedCat] = useState(null);
  const [form,setForm] = useState({title:'',why:'',measure:'',deadline:'',reward:'',status:'not_started'});

  const openAdd = (catId) => { setSelectedCat(catId); setEditGoal(null); setForm({title:'',why:'',measure:'',deadline:'',reward:'',status:'not_started'}); setShowModal(true); };
  const openEdit = (catId,goal) => { setSelectedCat(catId); setEditGoal(goal.id); setForm({...goal}); setShowModal(true); };

  const save = () => {
    if (!form.title.trim()) return;
    setGoals(prev => {
      const list = [...(prev[selectedCat]||[])];
      if (editGoal) { const i=list.findIndex(g=>g.id===editGoal); if(i!==-1) list[i]={...form,id:editGoal}; }
      else list.push({...form,id:Date.now().toString()});
      return {...prev,[selectedCat]:list};
    });
    setShowModal(false);
  };

  const cycleStatus = (catId,goalId) => setGoals(prev => ({
    ...prev,[catId]:(prev[catId]||[]).map(g => {
      if(g.id!==goalId) return g;
      const i=STATUSES.findIndex(s=>s.key===g.status);
      return {...g,status:STATUSES[(i+1)%STATUSES.length].key};
    })
  }));

  const total = Object.values(goals).flat().length;
  const achieved = Object.values(goals).flat().filter(g=>g.status==='achieved').length;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Goals</Text>
        <View style={s.summRow}>
          {[[total,'total',Colors.primary],[achieved,'achieved',Colors.green],[total-achieved,'in progress',Colors.amber]].map(([v,l,c])=>(
            <View key={l} style={s.chip}><Text style={[s.chipV,{color:c}]}>{v}</Text><Text style={s.chipL}>{l}</Text></View>
          ))}
        </View>

        {GOAL_CATEGORIES.map(cat => {
          const catGoals = goals[cat.id]||[];
          const isExp = expanded===cat.id;
          const ach = catGoals.filter(g=>g.status==='achieved').length;
          return (
            <View key={cat.id} style={s.catCard}>
              <TouchableOpacity style={s.catHdr} onPress={() => setExpanded(isExp?null:cat.id)}>
                <View style={[s.catIcon,{backgroundColor:cat.color+'22'}]}><Text style={{fontSize:20}}>{cat.icon}</Text></View>
                <View style={{flex:1}}>
                  <Text style={s.catName}>{cat.name}</Text>
                  <Text style={s.catCount}>{ach}/{catGoals.length} achieved</Text>
                </View>
                <Text style={s.chev}>{isExp?'▲':'▼'}</Text>
              </TouchableOpacity>
              {isExp && (
                <View style={s.goalList}>
                  {catGoals.length===0 && <Text style={s.empty}>No goals yet — tap + to add one</Text>}
                  {catGoals.map(goal => {
                    const st = STATUSES.find(s=>s.key===goal.status)||STATUSES[0];
                    return (
                      <TouchableOpacity key={goal.id} style={s.goalRow} onPress={() => openEdit(cat.id,goal)}>
                        <TouchableOpacity onPress={() => cycleStatus(cat.id,goal.id)} style={s.stBtn}>
                          <Text style={{fontSize:10}}>{st.label}</Text>
                        </TouchableOpacity>
                        <View style={{flex:1,marginLeft:Spacing.sm}}>
                          <Text style={s.goalTitle}>{goal.title}</Text>
                          {!!goal.deadline && <Text style={s.goalDl}>🗓 {goal.deadline}</Text>}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity style={[s.addBtn,{borderColor:cat.color+'88'}]} onPress={() => openAdd(cat.id)}>
                    <Text style={[s.addBtnT,{color:cat.color}]}>+ Add Goal</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
        <View style={{height:100}}/>
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={s.overlay}>
          <View style={s.sheet}>
            <Text style={s.modalTitle}>{editGoal?'Edit Goal':'New Goal'}</Text>
            {[['What do you want to achieve?','title','e.g. Run a 5K'],['Why is this important?','why','Your motivation...'],['How do you measure success?','measure','e.g. Complete a race'],['Deadline','deadline','Dec 2025'],['Reward 🎁','reward','Treat yourself']].map(([label,field,ph])=>(
              <View key={field}>
                <Text style={s.fieldLabel}>{label}</Text>
                <TextInput style={s.input} value={form[field]} onChangeText={t=>setForm(f=>({...f,[field]:t}))} placeholder={ph} placeholderTextColor={Colors.textMuted}/>
              </View>
            ))}
            <Text style={s.fieldLabel}>Status</Text>
            <View style={s.stRow}>
              {STATUSES.map(st=>(
                <TouchableOpacity key={st.key} style={[s.stOpt,form.status===st.key&&{borderColor:st.color,backgroundColor:st.color+'22'}]} onPress={()=>setForm(f=>({...f,status:st.key}))}>
                  <Text style={{fontSize:10,color:form.status===st.key?st.color:Colors.textSecondary}}>{st.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={()=>setShowModal(false)}><Text style={s.cancelT}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={save}><Text style={s.saveT}>Save Goal</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:Colors.bg},
  title:{...Typography.h1,marginHorizontal:Spacing.lg,marginTop:Spacing.lg,marginBottom:Spacing.md},
  summRow:{flexDirection:'row',marginHorizontal:Spacing.lg,marginBottom:Spacing.lg,gap:Spacing.sm},
  chip:{flex:1,backgroundColor:Colors.bgCard,borderRadius:Radius.lg,padding:Spacing.md,alignItems:'center',borderWidth:1,borderColor:Colors.border},
  chipV:{fontSize:24,fontWeight:'700'},chipL:{...Typography.caption,marginTop:2},
  catCard:{marginHorizontal:Spacing.lg,marginBottom:Spacing.sm,backgroundColor:Colors.bgCard,borderRadius:Radius.lg,borderWidth:1,borderColor:Colors.border,overflow:'hidden'},
  catHdr:{flexDirection:'row',alignItems:'center',padding:Spacing.md},
  catIcon:{width:40,height:40,borderRadius:Radius.md,alignItems:'center',justifyContent:'center',marginRight:Spacing.md},
  catName:{...Typography.body,fontWeight:'600'},catCount:{...Typography.caption,marginTop:2},chev:{color:Colors.textMuted,fontSize:12},
  goalList:{borderTopWidth:1,borderColor:Colors.border,padding:Spacing.md,gap:8},
  empty:{...Typography.caption,textAlign:'center',paddingVertical:Spacing.md},
  goalRow:{flexDirection:'row',alignItems:'center',backgroundColor:Colors.bgInput,borderRadius:Radius.md,padding:Spacing.sm},
  stBtn:{paddingHorizontal:Spacing.sm,paddingVertical:4},
  goalTitle:{...Typography.body,fontSize:14},goalDl:{...Typography.caption,marginTop:2},
  addBtn:{borderWidth:1,borderStyle:'dashed',borderRadius:Radius.md,padding:Spacing.sm,alignItems:'center'},
  addBtnT:{...Typography.caption,fontWeight:'700'},
  overlay:{flex:1,justifyContent:'flex-end',backgroundColor:'rgba(0,0,0,0.6)'},
  sheet:{backgroundColor:Colors.bgCard,borderTopLeftRadius:24,borderTopRightRadius:24,padding:Spacing.lg,paddingBottom:Spacing.xxl},
  modalTitle:{...Typography.h2,marginBottom:Spacing.lg},
  fieldLabel:{...Typography.label,marginBottom:Spacing.xs,marginTop:Spacing.sm},
  input:{backgroundColor:Colors.bgInput,borderRadius:Radius.md,padding:Spacing.md,color:Colors.textPrimary,borderWidth:1,borderColor:Colors.border},
  stRow:{flexDirection:'row',gap:Spacing.sm,marginTop:Spacing.xs},
  stOpt:{flex:1,borderWidth:1,borderColor:Colors.border,borderRadius:Radius.md,padding:Spacing.sm,alignItems:'center'},
  modalBtns:{flexDirection:'row',marginTop:Spacing.lg,gap:Spacing.md},
  cancelBtn:{flex:1,padding:Spacing.md,borderRadius:Radius.lg,borderWidth:1,borderColor:Colors.border,alignItems:'center'},
  cancelT:{...Typography.body,color:Colors.textSecondary},
  saveBtn:{flex:1,padding:Spacing.md,borderRadius:Radius.lg,backgroundColor:Colors.primary,alignItems:'center'},
  saveT:{...Typography.body,color:'#fff',fontWeight:'700'},
});
