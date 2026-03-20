import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, differenceInDays } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radius, Typography } from '../theme';

const SUBJECTS_KEY = 'hf_subjects';
const SESSIONS_KEY = 'hf_study_sessions';
const EXAMS_KEY    = 'hf_exams';
const JOURNAL_KEY  = 'hf_journal_';
const SUBJECT_COLORS = ['#00E5CC','#7B61FF','#4DA6FF','#00E5A0','#FFB800','#FF61DC','#FF5E5E','#9B6DFF'];

const PROMPTS = {
  morning: ["What's your top priority today?", "How are you feeling right now?", "One thing you're grateful for?"],
  night:   ["What did you accomplish today?", "What was the biggest challenge?", "What will you do better tomorrow?"],
};

const fmtMins = m => m >= 60 ? `${Math.floor(m/60)}h ${m%60}m` : `${m}m`;

export default function StudyScreen() {
  const [tab, setTab] = useState('journal');
  const today = format(new Date(), 'yyyy-MM-dd');

  // Journal
  const [jMode, setJMode]   = useState('morning');
  const [jData, setJData]   = useState({ morning:['','',''], night:['','',''], braindump:'' });
  const [jSaved, setJSaved] = useState(false);

  // Study
  const [subjects, setSubjects]   = useState([]);
  const [sessions, setSessions]   = useState([]);
  const [showSub, setShowSub]     = useState(false);
  const [showLog, setShowLog]     = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [curSub, setCurSub]       = useState(null);
  const [sHours, setSHours]       = useState('1');
  const [sMins, setSMins]         = useState('0');
  const [sNote, setSNote]         = useState('');

  // Exams
  const [exams, setExams]         = useState([]);
  const [showExam, setShowExam]   = useState(false);
  const [examForm, setExamForm]   = useState({name:'',subject:'',date:'',notes:''});

  useEffect(() => {
    AsyncStorage.getItem(JOURNAL_KEY+today).then(d => { if (d) { setJData(JSON.parse(d)); setJSaved(true); } });
    AsyncStorage.getItem(SUBJECTS_KEY).then(d => { if (d) setSubjects(JSON.parse(d)); });
    AsyncStorage.getItem(SESSIONS_KEY).then(d => { if (d) setSessions(JSON.parse(d)); });
    AsyncStorage.getItem(EXAMS_KEY).then(d => { if (d) setExams(JSON.parse(d)); });
  }, []);

  const saveJournal = async () => {
    await AsyncStorage.setItem(JOURNAL_KEY+today, JSON.stringify(jData));
    setJSaved(true);
    Alert.alert('Saved! 📝', 'Journal entry saved.');
  };

  const addSubject = async () => {
    if (!newSubName.trim()) return;
    const s = { id: Date.now().toString(), name: newSubName.trim(), color: SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length], totalMins: 0 };
    const u = [...subjects, s];
    setSubjects(u);
    await AsyncStorage.setItem(SUBJECTS_KEY, JSON.stringify(u));
    setNewSubName(''); setShowSub(false);
  };

  const logSession = async () => {
    if (!curSub) return;
    const mins = parseInt(sHours||'0')*60 + parseInt(sMins||'0');
    if (mins === 0) return;
    const sess = { id: Date.now().toString(), subjectId: curSub.id, subject: curSub.name, color: curSub.color, mins, note: sNote, date: format(new Date(),'dd MMM yyyy'), dateKey: today };
    const u = [sess, ...sessions];
    setSessions(u);
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(u));
    const us = subjects.map(s => s.id === curSub.id ? {...s, totalMins: s.totalMins+mins} : s);
    setSubjects(us);
    await AsyncStorage.setItem(SUBJECTS_KEY, JSON.stringify(us));
    setSHours('1'); setSMins('0'); setSNote(''); setShowLog(false);
  };

  const addExam = async () => {
    if (!examForm.name.trim() || !examForm.date.trim()) return;
    const u = [...exams, {...examForm, id: Date.now().toString()}].sort((a,b) => new Date(a.date)-new Date(b.date));
    setExams(u);
    await AsyncStorage.setItem(EXAMS_KEY, JSON.stringify(u));
    setExamForm({name:'',subject:'',date:'',notes:''}); setShowExam(false);
  };

  const deleteExam = async id => {
    const u = exams.filter(e => e.id !== id);
    setExams(u);
    await AsyncStorage.setItem(EXAMS_KEY, JSON.stringify(u));
  };

  const daysLeft = d => { try { return differenceInDays(new Date(d), new Date()); } catch { return null; } };
  const urgency  = d => d===null ? Colors.textMuted : d<0 ? Colors.textMuted : d<=3 ? Colors.coral : d<=7 ? Colors.amber : d<=14 ? Colors.primary : Colors.green;

  const todayMins = sessions.filter(s=>s.dateKey===today).reduce((t,s)=>t+s.mins,0);
  const totalMins = sessions.reduce((t,s)=>t+s.mins,0);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.tabs}>
        {[['journal','📝 Journal'],['study','📚 Study'],['exams','📅 Exams']].map(([k,l]) => (
          <TouchableOpacity key={k} style={[s.tab, tab===k && s.tabA]} onPress={()=>setTab(k)}>
            <Text style={[s.tabTxt, tab===k && s.tabTxtA]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── JOURNAL ─── */}
      {tab==='journal' && (
        <ScrollView contentContainerStyle={{paddingBottom:100}} showsVerticalScrollIndicator={false}>
          <View style={s.jHeader}>
            <View><Text style={s.jDate}>{format(new Date(),'EEEE, MMMM d')}</Text><Text style={s.jSub}>Daily Journal</Text></View>
            {jSaved && <View style={s.savedBadge}><Text style={s.savedTxt}>✓ Saved</Text></View>}
          </View>

          <View style={s.modeRow}>
            {[['morning','🌅 Morning'],['night','🌙 Night']].map(([k,l])=>(
              <TouchableOpacity key={k} style={[s.modeBtn, jMode===k && s.modeBtnA]} onPress={()=>setJMode(k)}>
                <Text style={[s.modeTxt, jMode===k && s.modeTxtA]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.promptCard}>
            {PROMPTS[jMode].map((q,i)=>(
              <View key={i} style={s.promptRow}>
                <View style={s.promptNum}><Text style={s.promptNumTxt}>{i+1}</Text></View>
                <View style={{flex:1}}>
                  <Text style={s.promptQ}>{q}</Text>
                  <TextInput style={s.promptIn} value={jData[jMode][i]}
                    onChangeText={t=>{ const a=[...jData[jMode]]; a[i]=t; setJData(p=>({...p,[jMode]:a})); setJSaved(false); }}
                    placeholder="Write your answer..." placeholderTextColor={Colors.textMuted} multiline />
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity style={s.saveBtn2} onPress={saveJournal}>
            <Text style={s.saveBtnTxt}>💾 Save Journal Entry</Text>
          </TouchableOpacity>

          <View style={s.brainCard}>
            <Text style={s.brainTitle}>🧠 Brain Dump</Text>
            <Text style={s.brainSub}>Dump everything on your mind freely</Text>
            <TextInput style={s.brainIn} value={jData.braindump||''}
              onChangeText={t=>{setJData(p=>({...p,braindump:t}));setJSaved(false);}}
              placeholder="Start typing anything..." placeholderTextColor={Colors.textMuted}
              multiline numberOfLines={5} />
          </View>
        </ScrollView>
      )}

      {/* ─── STUDY TRACKER ─── */}
      {tab==='study' && (
        <ScrollView contentContainerStyle={{paddingBottom:100}} showsVerticalScrollIndicator={false}>
          <View style={s.overview}>
            {[[fmtMins(todayMins),'today',Colors.primary],[fmtMins(totalMins),'total',Colors.green],[`${subjects.length}`,'subjects',Colors.amber]].map(([v,l,c])=>(
              <View key={l} style={s.overviewChip}>
                <Text style={[s.overviewVal,{color:c}]}>{v}</Text>
                <Text style={s.overviewKey}>{l}</Text>
              </View>
            ))}
          </View>

          <View style={s.secRow}>
            <Text style={s.secTitle}>SUBJECTS</Text>
            <TouchableOpacity style={s.addPill} onPress={()=>setShowSub(true)}><Text style={s.addPillTxt}>+ Add</Text></TouchableOpacity>
          </View>

          {subjects.length===0 && (
            <View style={s.empty}>
              <Text style={{fontSize:36}}>📚</Text>
              <Text style={s.emptyTxt}>No subjects yet</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={()=>setShowSub(true)}><Text style={s.emptyBtnTxt}>Add first subject</Text></TouchableOpacity>
            </View>
          )}

          {subjects.map(sub => {
            const todayS = sessions.filter(s=>s.subjectId===sub.id&&s.dateKey===today).reduce((t,s)=>t+s.mins,0);
            return (
              <TouchableOpacity key={sub.id} style={[s.subCard,{borderLeftColor:sub.color,borderLeftWidth:4}]}
                onPress={()=>{setCurSub(sub);setShowLog(true);}}>
                <View style={{flex:1}}>
                  <Text style={s.subName}>{sub.name}</Text>
                  <View style={{flexDirection:'row',gap:12,marginTop:3}}>
                    <Text style={s.subMeta}>Total: {fmtMins(sub.totalMins)}</Text>
                    {todayS>0&&<Text style={[s.subMeta,{color:sub.color}]}>Today: {fmtMins(todayS)}</Text>}
                  </View>
                </View>
                <View style={[s.logBtn,{backgroundColor:sub.color+'22',borderColor:sub.color+'60'}]}>
                  <Text style={[s.logBtnTxt,{color:sub.color}]}>+ Log</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {sessions.length>0 && <>
            <Text style={[s.secTitle,{marginHorizontal:Spacing.lg,marginTop:Spacing.lg,marginBottom:Spacing.sm}]}>RECENT SESSIONS</Text>
            {sessions.slice(0,8).map(ss=>(
              <View key={ss.id} style={s.sessRow}>
                <View style={[s.sessDot,{backgroundColor:ss.color}]}/>
                <View style={{flex:1}}><Text style={s.sessSubj}>{ss.subject}</Text>{!!ss.note&&<Text style={s.sessNote}>{ss.note}</Text>}</View>
                <View style={{alignItems:'flex-end'}}><Text style={[s.sessDur,{color:ss.color}]}>{fmtMins(ss.mins)}</Text><Text style={s.sessDate}>{ss.date}</Text></View>
              </View>
            ))}
          </>}
        </ScrollView>
      )}

      {/* ─── EXAMS ─── */}
      {tab==='exams' && (
        <ScrollView contentContainerStyle={{paddingBottom:100}} showsVerticalScrollIndicator={false}>
          <View style={s.secRow}>
            <Text style={s.secTitle}>UPCOMING EXAMS</Text>
            <TouchableOpacity style={s.addPill} onPress={()=>setShowExam(true)}><Text style={s.addPillTxt}>+ Add exam</Text></TouchableOpacity>
          </View>

          {exams.length===0 && (
            <View style={s.empty}>
              <Text style={{fontSize:40}}>📅</Text>
              <Text style={s.emptyTxt}>No exams added yet</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={()=>setShowExam(true)}><Text style={s.emptyBtnTxt}>Add your first exam</Text></TouchableOpacity>
            </View>
          )}

          {exams.map(exam => {
            const d = daysLeft(exam.date);
            const c = urgency(d);
            const past = d!==null&&d<0;
            return (
              <View key={exam.id} style={[s.examCard,{borderColor:c+'44'}]}>
                <View style={[s.examBadge,{backgroundColor:c+'15'}]}>
                  <Text style={[s.examDays,{color:c}]}>{past?'✓':d===0?'NOW':`${d}`}</Text>
                  <Text style={[s.examDaysSub,{color:c}]}>{past?'done':d===0?'today':'days'}</Text>
                </View>
                <View style={{flex:1}}>
                  <Text style={s.examName}>{exam.name}</Text>
                  {!!exam.subject&&<Text style={[s.examSubj,{color:Colors.primary}]}>{exam.subject}</Text>}
                  <Text style={s.examDate}>📅 {exam.date}</Text>
                  {!!exam.notes&&<Text style={s.examNotes}>{exam.notes}</Text>}
                </View>
                <TouchableOpacity onPress={()=>deleteExam(exam.id)}>
                  <Text style={{color:Colors.textMuted,fontSize:22,paddingLeft:8}}>×</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Add Subject Modal */}
      <Modal visible={showSub} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={s.overlay}>
          <View style={s.sheet}>
            <Text style={s.modalTitle}>Add Subject</Text>
            <TextInput style={s.modalIn} value={newSubName} onChangeText={setNewSubName} placeholder="e.g. DSA, Core CS..." placeholderTextColor={Colors.textMuted} autoFocus/>
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={()=>setShowSub(false)}><Text style={s.cancelTxt}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={addSubject}><Text style={s.confirmTxt}>Add</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Log Session Modal */}
      <Modal visible={showLog} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={s.overlay}>
          <View style={s.sheet}>
            <Text style={s.modalTitle}>Log Study Session</Text>
            {curSub&&<View style={[s.subBadge,{backgroundColor:curSub.color+'22',borderColor:curSub.color}]}><Text style={[s.subBadgeTxt,{color:curSub.color}]}>{curSub.name}</Text></View>}
            <Text style={s.fieldLbl}>Duration</Text>
            <View style={{flexDirection:'row',gap:8,alignItems:'center'}}>
              <View style={s.durBox}><TextInput style={s.durIn} value={sHours} onChangeText={setSHours} keyboardType="number-pad" placeholder="0" placeholderTextColor={Colors.textMuted}/><Text style={s.durUnit}>h</Text></View>
              <Text style={{fontSize:24,color:Colors.textSecondary,fontWeight:'700'}}>:</Text>
              <View style={s.durBox}><TextInput style={s.durIn} value={sMins} onChangeText={setSMins} keyboardType="number-pad" placeholder="0" placeholderTextColor={Colors.textMuted}/><Text style={s.durUnit}>m</Text></View>
            </View>
            <Text style={s.fieldLbl}>Note (optional)</Text>
            <TextInput style={s.modalIn} value={sNote} onChangeText={setSNote} placeholder="What did you study?" placeholderTextColor={Colors.textMuted}/>
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={()=>setShowLog(false)}><Text style={s.cancelTxt}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={logSession}><Text style={s.confirmTxt}>Log Session</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Exam Modal */}
      <Modal visible={showExam} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={s.overlay}>
          <View style={s.sheet}>
            <Text style={s.modalTitle}>Add Exam / Deadline</Text>
            {[['Exam name *','name','e.g. DSA Final Exam'],['Subject','subject','Computer Science'],['Date (YYYY-MM-DD) *','date','2026-04-15'],['Notes','notes','Topics to cover...']].map(([l,f,p])=>(
              <View key={f}><Text style={s.fieldLbl}>{l}</Text><TextInput style={s.modalIn} value={examForm[f]} onChangeText={t=>setExamForm(x=>({...x,[f]:t}))} placeholder={p} placeholderTextColor={Colors.textMuted}/></View>
            ))}
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={()=>setShowExam(false)}><Text style={s.cancelTxt}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={addExam}><Text style={s.confirmTxt}>Add Exam</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       {flex:1,backgroundColor:Colors.bg},
  tabs:       {flexDirection:'row',marginHorizontal:Spacing.lg,marginTop:Spacing.md,backgroundColor:Colors.bgCard,borderRadius:Radius.xl,padding:4,borderWidth:1,borderColor:Colors.border,gap:4},
  tab:        {flex:1,paddingVertical:9,borderRadius:Radius.lg,alignItems:'center'},
  tabA:       {backgroundColor:Colors.primary},
  tabTxt:     {...Typography.caption,fontWeight:'700',color:Colors.textMuted},
  tabTxtA:    {color:Colors.bg,fontWeight:'800'},

  jHeader:    {flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginHorizontal:Spacing.lg,marginTop:Spacing.md,marginBottom:Spacing.sm},
  jDate:      {fontSize:18,fontWeight:'800',color:Colors.textPrimary},
  jSub:       {...Typography.caption,marginTop:2},
  savedBadge: {backgroundColor:Colors.green+'22',borderRadius:Radius.full,paddingHorizontal:Spacing.md,paddingVertical:4,borderWidth:1,borderColor:Colors.green+'44'},
  savedTxt:   {color:Colors.green,fontSize:12,fontWeight:'700'},
  modeRow:    {flexDirection:'row',marginHorizontal:Spacing.lg,marginBottom:Spacing.md,backgroundColor:Colors.bgCard,borderRadius:Radius.xl,padding:3,borderWidth:1,borderColor:Colors.border},
  modeBtn:    {flex:1,paddingVertical:10,borderRadius:Radius.lg,alignItems:'center'},
  modeBtnA:   {backgroundColor:Colors.accent},
  modeTxt:    {fontSize:13,fontWeight:'700',color:Colors.textMuted},
  modeTxtA:   {color:'#fff',fontWeight:'800'},
  promptCard: {marginHorizontal:Spacing.lg,backgroundColor:Colors.bgCard,borderRadius:Radius.xl,padding:Spacing.lg,borderWidth:1,borderColor:Colors.border,marginBottom:Spacing.md,gap:Spacing.md},
  promptRow:  {flexDirection:'row',gap:Spacing.md,alignItems:'flex-start'},
  promptNum:  {width:22,height:22,borderRadius:11,backgroundColor:Colors.accent,alignItems:'center',justifyContent:'center'},
  promptNumTxt:{color:'#fff',fontWeight:'800',fontSize:11},
  promptQ:    {fontSize:13,fontWeight:'600',color:Colors.textPrimary,marginBottom:5},
  promptIn:   {backgroundColor:Colors.bgInput,borderRadius:Radius.md,padding:Spacing.sm,color:Colors.textPrimary,borderWidth:1,borderColor:Colors.border,fontSize:14,minHeight:55},
  saveBtn2:   {marginHorizontal:Spacing.lg,marginBottom:Spacing.md,backgroundColor:Colors.accent,borderRadius:Radius.xl,padding:Spacing.md,alignItems:'center'},
  saveBtnTxt: {color:'#fff',fontWeight:'800',fontSize:15},
  brainCard:  {marginHorizontal:Spacing.lg,backgroundColor:Colors.bgCard,borderRadius:Radius.xl,padding:Spacing.lg,borderWidth:1,borderColor:Colors.border},
  brainTitle: {fontSize:16,fontWeight:'700',color:Colors.textPrimary,marginBottom:4},
  brainSub:   {...Typography.caption,marginBottom:Spacing.md},
  brainIn:    {backgroundColor:Colors.bgInput,borderRadius:Radius.md,padding:Spacing.md,color:Colors.textPrimary,borderWidth:1,borderColor:Colors.border,minHeight:100,fontSize:14},

  overview:   {flexDirection:'row',marginHorizontal:Spacing.lg,marginTop:Spacing.md,marginBottom:Spacing.lg,gap:Spacing.sm},
  overviewChip:{flex:1,backgroundColor:Colors.bgCard,borderRadius:Radius.lg,padding:Spacing.md,alignItems:'center',borderWidth:1,borderColor:Colors.border},
  overviewVal:{fontSize:16,fontWeight:'800'},
  overviewKey:{...Typography.caption,marginTop:2},
  secRow:     {flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginHorizontal:Spacing.lg,marginBottom:Spacing.sm},
  secTitle:   {...Typography.label},
  addPill:    {backgroundColor:Colors.primaryDim,borderRadius:Radius.full,paddingHorizontal:Spacing.md,paddingVertical:5,borderWidth:1,borderColor:Colors.primary+'44'},
  addPillTxt: {color:Colors.primary,fontSize:12,fontWeight:'700'},
  subCard:    {marginHorizontal:Spacing.lg,marginBottom:Spacing.sm,backgroundColor:Colors.bgCard,borderRadius:Radius.lg,padding:Spacing.md,flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:Colors.border},
  subName:    {fontSize:15,fontWeight:'700',color:Colors.textPrimary},
  subMeta:    {...Typography.caption},
  logBtn:     {paddingHorizontal:Spacing.md,paddingVertical:7,borderRadius:Radius.full,borderWidth:1},
  logBtnTxt:  {fontSize:12,fontWeight:'700'},
  sessRow:    {flexDirection:'row',alignItems:'center',marginHorizontal:Spacing.lg,marginBottom:Spacing.sm,backgroundColor:Colors.bgCard,borderRadius:Radius.lg,padding:Spacing.md,borderWidth:1,borderColor:Colors.border,gap:Spacing.md},
  sessDot:    {width:10,height:10,borderRadius:5},
  sessSubj:   {fontSize:14,fontWeight:'600',color:Colors.textPrimary},
  sessNote:   {...Typography.caption,marginTop:2},
  sessDur:    {fontSize:14,fontWeight:'800'},
  sessDate:   {...Typography.caption,marginTop:2},

  examCard:   {flexDirection:'row',alignItems:'center',marginHorizontal:Spacing.lg,marginBottom:Spacing.sm,backgroundColor:Colors.bgCard,borderRadius:Radius.xl,padding:Spacing.md,borderWidth:1,gap:Spacing.md},
  examBadge:  {width:60,height:60,borderRadius:30,alignItems:'center',justifyContent:'center'},
  examDays:   {fontSize:20,fontWeight:'900'},
  examDaysSub:{fontSize:9,fontWeight:'700'},
  examName:   {fontSize:15,fontWeight:'700',color:Colors.textPrimary},
  examSubj:   {...Typography.caption,marginTop:2},
  examDate:   {...Typography.caption,marginTop:3},
  examNotes:  {...Typography.caption,marginTop:4,fontStyle:'italic'},

  empty:      {alignItems:'center',paddingVertical:Spacing.xxl,gap:Spacing.sm},
  emptyTxt:   {fontSize:16,fontWeight:'700',color:Colors.textSecondary},
  emptyBtn:   {backgroundColor:Colors.primaryDim,borderRadius:Radius.full,paddingHorizontal:Spacing.lg,paddingVertical:Spacing.sm,borderWidth:1,borderColor:Colors.primary+'44',marginTop:Spacing.sm},
  emptyBtnTxt:{color:Colors.primary,fontWeight:'700',fontSize:14},

  overlay:    {flex:1,justifyContent:'flex-end',backgroundColor:'rgba(0,0,0,0.7)'},
  sheet:      {backgroundColor:Colors.bgCard,borderTopLeftRadius:24,borderTopRightRadius:24,padding:Spacing.lg,paddingBottom:Spacing.xxl,borderTopWidth:1,borderColor:Colors.border},
  modalTitle: {...Typography.h2,marginBottom:Spacing.lg},
  modalIn:    {backgroundColor:Colors.bgInput,borderRadius:Radius.md,padding:Spacing.md,color:Colors.textPrimary,borderWidth:1,borderColor:Colors.border,fontSize:15},
  fieldLbl:   {...Typography.label,marginBottom:6,marginTop:Spacing.sm},
  durBox:     {flex:1,flexDirection:'row',alignItems:'center',backgroundColor:Colors.bgInput,borderRadius:Radius.md,borderWidth:1,borderColor:Colors.border,paddingHorizontal:Spacing.md},
  durIn:      {flex:1,padding:Spacing.md,color:Colors.textPrimary,fontSize:24,fontWeight:'700'},
  durUnit:    {...Typography.caption},
  subBadge:   {alignSelf:'flex-start',paddingHorizontal:Spacing.md,paddingVertical:6,borderRadius:Radius.full,borderWidth:1,marginBottom:Spacing.md},
  subBadgeTxt:{fontSize:13,fontWeight:'700'},
  modalBtns:  {flexDirection:'row',marginTop:Spacing.lg,gap:Spacing.md},
  cancelBtn:  {flex:1,padding:Spacing.md,borderRadius:Radius.lg,borderWidth:1,borderColor:Colors.border,alignItems:'center'},
  cancelTxt:  {...Typography.body,color:Colors.textSecondary},
  confirmBtn: {flex:1,padding:Spacing.md,borderRadius:Radius.lg,backgroundColor:Colors.primary,alignItems:'center'},
  confirmTxt: {...Typography.body,color:Colors.bg,fontWeight:'800'},
});
