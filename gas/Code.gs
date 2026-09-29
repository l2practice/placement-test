// VENUS ENGLISH — IELTS PLACEMENT TEST BACKEND
// Setup: 1) Paste vào Apps Script  2) Project Settings → Script properties → thêm TEACHER_PASSWORD
// 3) Run initialSetup() (lần đầu) hoặc upgradeSheets() (đã có dữ liệu)  4) Run authorizeOnce()
// 5) Deploy → Manage deployments → Edit → Version: New version → Deploy (giữ nguyên URL)
// Chi tiết: gas/README.md trong repo placement-test.

const CONFIG = {
  TEACHER_EMAIL:      'duongthanhtu.dnu@gmail.com',
  // Kept out of source control: set it in Project Settings → Script properties.
  TEACHER_PASSWORD:   PropertiesService.getScriptProperties().getProperty('TEACHER_PASSWORD') || '',
  DEADLINE_DAYS:      7,
  SPEAKING_FOLDER_ID: '17RaSVy23p-_mZkbQDuUmZwCxIMBTgOmS',
  FEEDBACK_FOLDER_ID: '1JP7VbcP-D7y-iVTQ17vHEbXH7Ul7TJEF',
  APP_URL:            'https://edragon-cloud.github.io/placement-test/',
};

const C = {
  USERNAME:0,FULLNAME:1,DOB:2,EMAIL:3,PHONE:4,SCHOOL:5,
  STUDIED_BEFORE:6,WHERE_STUDIED:7,YEARS_LEARNING:8,
  RW_DIFFICULTY:9,RW_SOURCE:10,WRITING_TYPES:11,CERTIFICATES:12,
  LISTENING_ABILITY:13,SPEAKING_ABILITY:14,READING_ABILITY:15,WRITING_ABILITY:16,
  WHY_IELTS:17,TARGET_BAND:18,EXAM_DATE:19,COURSE_QUESTIONS:20,
  REGISTERED_AT:21,DEADLINE:22,
  VG_DONE:23,WRITING_DONE:24,LISTENING_DONE:25,SPEAKING_DONE:26,
  VG_SCORE:27,WRITING_BAND:28,LISTENING_SCORE:29,SPEAKING_FILE:30,
  OVERALL_LEVEL:31,FEEDBACK_SENT:32,REPORT_NOTES:33,
};
const STUDENT_COLS = 34;

const VG_KEY = {
  1:'b',2:'a',3:'c',4:'b',5:'b',6:'c',7:'a',8:'a',9:'b',10:'c',
  11:'a',12:'b',13:'a',14:'c',15:'b',16:'b',17:'a',18:'c',19:'a',20:'a',
  21:'b',22:'b',23:'c',24:'c',25:'b',26:'a',27:'b',28:'a',29:'a',30:'c',
  31:'c',32:'b',33:'a',34:'b',35:'b',36:'c',37:'b',38:'b',39:'a',40:'c',
  41:'b',42:'a',43:'a',44:'c',45:'a',46:'c',47:'b',48:'c',49:'b',50:'a'  // Q50: 'as such' (option a)
};

const LIS_KEY = {
  1:'b',2:'d',3:'b',4:'d',5:'d',6:'d',7:'a',8:'a',
  9:'b',10:'b',11:'a',12:'b',13:'c',14:'d',15:'b',16:'b',
  17:'a',18:'b',19:'b',20:'d',21:'b',22:'d',23:'c',24:'d'
};


// ════════════════════════════════════════════════════
// SETUP
// ════════════════════════════════════════════════════
function initialSetup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var stu = _sheet(ss,'Students');
  stu.clearContents();
  stu.appendRow(['username','fullName','dob','email','phone','school','studiedBefore','whereStudied','yearsLearning','rwDifficulty','rwSource','writingTypes','certificates','listeningAbility','speakingAbility','readingAbility','writingAbility','whyIELTS','targetBand','examDate','courseQuestions','registeredAt','deadline','vgDone','writingDone','listeningDone','speakingDone','vgScore','writingBand','listeningScore','speakingFile','overallLevel','feedbackSent','reportNotes']);
  stu.getRange(1,1,1,STUDENT_COLS).setFontWeight('bold').setBackground('#063672').setFontColor('#ffffff');
  stu.setFrozenRows(1);

  var vg = _sheet(ss,'VG_Results');
  vg.clearContents();
  vg.appendRow(['username','submittedAt','answers_json','score','level']);
  vg.getRange(1,1,1,5).setFontWeight('bold').setBackground('#063672').setFontColor('#ffffff');
  vg.setFrozenRows(1);

  var wr = _sheet(ss,'Writing_Results');
  wr.clearContents();
  wr.appendRow(['username','submittedAt','topic','essay','aiBand','aiComment','teacherBand','teacherComment']);
  wr.getRange(1,1,1,8).setFontWeight('bold').setBackground('#063672').setFontColor('#ffffff');
  wr.setFrozenRows(1);

  var lr = _sheet(ss,'Listening_Results');
  lr.clearContents();
  lr.appendRow(['username','submittedAt','answers_json','score','level']);
  lr.getRange(1,1,1,5).setFontWeight('bold').setBackground('#063672').setFontColor('#ffffff');
  lr.setFrozenRows(1);

  var sp = _sheet(ss,'Speaking_Results');
  sp.clearContents();
  sp.appendRow(['username','submittedAt','driveFileId','driveFileUrl','teacherBand','teacherComment']);
  sp.getRange(1,1,1,6).setFontWeight('bold').setBackground('#063672').setFontColor('#ffffff');
  sp.setFrozenRows(1);

  var sq = _sheet(ss,'Speaking_Questions');
  sq.clearContents();
  sq.appendRow(['order','question','active']);
  sq.getRange(1,1,1,3).setFontWeight('bold').setBackground('#063672').setFontColor('#ffffff');
  sq.appendRow([1,"Talk about yourself: your name, where you are from, what you do, and your hobbies.",true]);
  sq.appendRow([2,"Describe your hometown. What do you like or dislike about it?",true]);
  sq.appendRow([3,"Talk about a subject you enjoyed studying at school and explain why.",true]);
  sq.appendRow([4,"Describe a person who has been important in your life and explain why.",true]);
  sq.appendRow([5,"Talk about something you enjoy doing in your free time. How often and why?",true]);
  sq.setFrozenRows(1);

  var wt = _sheet(ss,'Writing_Topics');  wt.clearContents();
  wt.appendRow(['order','title','description','active']);
  wt.getRange(1,1,1,4).setFontWeight('bold').setBackground('#063672').setFontColor('#ffffff');
  wt.appendRow([1,"Ho so ca nhan (Personal Profile)","Write a personal profile. Include name/age, where you are from and what you do, interests and likes/dislikes, what kind of friends you want to meet.",true]);
  wt.appendRow([2,"Email ve dat nuoc (Your Country)","Write an email to a friend who wants to know more about your country. Include geography, cities, culture, people, food and music. Invite them to visit.",true]);
  wt.appendRow([3,"Ky uc tuoi tho (Childhood Memory)","Write about a strong childhood memory. Include details like sounds, smells, colours and weather. Explain how you felt and how you feel now.",true]);
  wt.appendRow([4,"Danh gia phim sach (Review)","Write a review of your favourite film, play or book. Describe the story, characters, and explain why it is your favourite.",true]);
  wt.appendRow([5,"The gioi tot hon hay te hon? (World Article)","Write an article about whether our world is getting better or worse. Include medicine, technology, conflict, freedom, education. Finish with a conclusion.",true]);
  wt.setFrozenRows(1);

  // Activity Log — ghi lại lần đăng nhập, thoát bài của thí sinh
  var al = _sheet(ss,'Activity_Log');
  al.clearContents();
  al.appendRow(['timestamp','username','fullName','testType','action','note']);
  al.getRange(1,1,1,6).setFontWeight('bold').setBackground('#063672').setFontColor('#ffffff');
  al.setFrozenRows(1);

  Logger.log('Setup xong! 8 sheets da tao.');
}

// Chạy 1 lần khi nâng cấp từ bản cũ (không xoá dữ liệu): thêm cột reportNotes.
function upgradeSheets() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Students');
  sh.getRange(1, C.REPORT_NOTES + 1).setValue('reportNotes')
    .setFontWeight('bold').setBackground('#063672').setFontColor('#ffffff');
  Logger.log('Da them cot reportNotes.');
}

// Chạy 1 lần sau khi sửa đáp án câu 50: chấm lại điểm V&G đã lưu theo VG_KEY hiện tại.
function rescoreVG() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sh = ss.getSheetByName('VG_Results');
  var rows = sh.getDataRange().getValues(), changed = 0;
  for (var i = 1; i < rows.length; i++) {
    var ans; try { ans = JSON.parse(rows[i][2] || '{}'); } catch (e) { continue; }
    var score = 0;
    for (var q = 1; q <= 50; q++) if (String(ans[q] || '').toLowerCase() === VG_KEY[q]) score++;
    var level = score<=10?'A1':score<=20?'A2':score<=30?'B1':score<=40?'B2':score<=47?'C1':'C2';
    if (score !== rows[i][3]) {
      changed++;
      sh.getRange(i + 1, 4, 1, 2).setValues([[score, level]]);
      var st = _findStudent(rows[i][0]);
      if (st) _set(st.rowIndex, C.VG_SCORE, score);
    }
  }
  Logger.log('Da cham lai ' + changed + ' bai V&G.');
}

// Chạy 1 lần trong trình soạn thảo để cấp quyền Drive + UrlFetch (tạo Google Doc từ HTML).
function authorizeOnce() {
  DriveApp.getRootFolder();
  UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
    headers: {Authorization: 'Bearer ' + ScriptApp.getOAuthToken()}, muteHttpExceptions: true});
  Logger.log('Da cap quyen. TEACHER_PASSWORD ' + (CONFIG.TEACHER_PASSWORD ? 'da cau hinh.' : 'CHUA cau hinh!'));
}

function testSetup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var have = ss.getSheets().map(function(s){return s.getName();});
  var need = ['Students','VG_Results','Writing_Results','Listening_Results','Speaking_Results','Speaking_Questions','Writing_Topics','Activity_Log'];
  var missing = need.filter(function(s){return !have.includes(s);});
  if (missing.length) Logger.log('THIEU: ' + missing.join(', ') + ' -> Chay initialSetup()!');
  else Logger.log('Tat ca sheets OK!');
  Logger.log('TEACHER_PASSWORD ' + (CONFIG.TEACHER_PASSWORD ? 'da cau hinh.' : 'CHUA cau hinh trong Script properties!'));
}

function _sheet(ss,name) { return ss.getSheetByName(name)||ss.insertSheet(name); }

// ════════════════════════════════════════════════════
// HTTP ROUTING
// ════════════════════════════════════════════════════
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({status:'Venus English API OK'})).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var r;
    switch(d.action){
      case 'register':         r=_register(d);         break;
      case 'login':            r=_login(d);            break;
      case 'submitVG':         r=_submitVG(d);         break;
      case 'submitWriting':    r=_submitWriting(d);    break;
      case 'submitListening':  r=_submitListening(d);  break;
      case 'uploadSpeaking':   r=_uploadSpeaking(d);   break;
      case 'trackActivity':    r=_trackActivity(d);    break;
      case 'getActivityLog':   r=_getActivityLog(d);   break;
      case 'updateDeadline':   r=_updateDeadline(d);   break;
      case 'teacherLogin':     r=_teacherLogin(d);     break;
      case 'getStudentList':   r=_getStudentList(d);   break;
      case 'getStudentDetail': r=_getStudentDetail(d); break;
      case 'gradeWriting':     r=_gradeWriting(d);     break;
      case 'gradeSpeaking':    r=_gradeSpeaking(d);    break;
      case 'saveReportNotes':  r=_saveReportNotes(d);  break;
      case 'exportReportDoc':  r=_exportReportDoc(d);  break;
      case 'getQuestions':     r=_getQuestions();      break;
      case 'saveQuestions':    r=_saveQuestions(d);    break;
      case 'getTopics':        r=_getTopics();         break;
      case 'saveTopics':       r=_saveTopics(d);       break;
      default: r={ok:false,error:'Unknown action: '+d.action};
    }
    return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:err.message})).setMimeType(ContentService.MimeType.JSON);
  }
}

// ════════════════════════════════════════════════════
// REGISTER
// ════════════════════════════════════════════════════
function _register(d) {
  if (!d.fullName||!d.dob||!d.email) return {ok:false,error:'Thieu ho ten, ngay sinh hoac email.'};
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  var sh=ss.getSheetByName('Students');
  var rows=sh.getDataRange().getValues();
  for (var i=1;i<rows.length;i++) {
    if (rows[i][C.EMAIL]===d.email.trim()) return {ok:false,error:'Email da dang ky. Tai khoan: '+rows[i][C.USERNAME]};
  }
  var uname=_makeUsername(d.fullName,d.dob);
  var existing=rows.slice(1).map(function(r){return r[C.USERNAME];});
  var n=2; var base=uname;
  while(existing.includes(uname)){uname=base+n++;}
  var dl=new Date(); dl.setDate(dl.getDate()+CONFIG.DEADLINE_DAYS);
  var deadline=Utilities.formatDate(dl,'Asia/Ho_Chi_Minh','dd/MM/yyyy');
  var row=new Array(STUDENT_COLS).fill('');
  row[C.USERNAME]=uname; row[C.FULLNAME]=d.fullName.trim(); row[C.DOB]=d.dob;
  row[C.EMAIL]=d.email.trim(); row[C.PHONE]=d.phone||''; row[C.SCHOOL]=d.school||'';
  row[C.STUDIED_BEFORE]=d.studiedBefore||''; row[C.WHERE_STUDIED]=d.whereStudied||'';
  row[C.YEARS_LEARNING]=d.yearsLearning||''; row[C.RW_DIFFICULTY]=d.rwDifficulty||'';
  row[C.RW_SOURCE]=d.rwSource||''; row[C.WRITING_TYPES]=d.writingTypes||'';
  row[C.CERTIFICATES]=d.certificates||''; row[C.LISTENING_ABILITY]=d.listeningAbility||'';
  row[C.SPEAKING_ABILITY]=d.speakingAbility||''; row[C.READING_ABILITY]=d.readingAbility||'';
  row[C.WRITING_ABILITY]=d.writingAbility||''; row[C.WHY_IELTS]=d.whyIELTS||'';
  row[C.TARGET_BAND]=d.targetBand||''; row[C.EXAM_DATE]=d.examDate||'';
  row[C.COURSE_QUESTIONS]=d.courseQuestions||''; row[C.REGISTERED_AT]=new Date().toISOString();
  row[C.DEADLINE]=deadline; row[C.VG_DONE]=false; row[C.WRITING_DONE]=false;
  row[C.LISTENING_DONE]=false; row[C.SPEAKING_DONE]=false;
  sh.appendRow(row);
  _emailWelcome(d.email.trim(),d.fullName.trim(),uname,deadline);
  return {ok:true,username:uname,deadline:deadline};
}

function _makeUsername(fullName,dob) {
  var parts=fullName.trim().split(/\s+/).filter(Boolean);
  var first=_nd(parts[parts.length-1]);
  var mids=parts.slice(1,-1).map(function(p){return _nd(p[0]).toLowerCase();}).join('');
  var sur=_nd(parts[0][0]).toLowerCase();
  var dd,mm;
  if(dob.includes('-')){var p=dob.split('-');dd=p[2];mm=p[1];}
  else{var p=dob.split('/');dd=p[0];mm=p[1];}
  return first+'.'+sur+mids+'_'+(dd||'01').padStart(2,'0')+(mm||'01').padStart(2,'0');
}

function _nd(s) {
  if(!s)return'';
  var m={'\u00e0':'a','\u00e1':'a','\u00e2':'a','\u00e3':'a','\u0103':'a','\u01b0':'u',
    '\u00e8':'e','\u00e9':'e','\u00ea':'e','\u00ec':'i','\u00ed':'i',
    '\u00f2':'o','\u00f3':'o','\u00f4':'o','\u00f9':'u','\u00fa':'u','\u00fb':'u',
    '\u00fd':'y','\u0111':'d','\u1eaf':'a','\u1ea7':'a','\u1ea5':'a','\u1ebf':'e',
    '\u1edb':'o','\u1edf':'o','\u1ee9':'u','\u1eeb':'u','\u1ef3':'y','\u1ef7':'y',
    '\u00c0':'A','\u00c1':'A','\u00c2':'A','\u0110':'D'};
  return s.split('').map(function(c){return m[c]||c;}).join('');
}

// ════════════════════════════════════════════════════
// LOGIN
// ════════════════════════════════════════════════════
function _login(d) {
  var row=_findStudent(d.username);
  if(!row)return{ok:false,error:'Khong tim thay tai khoan. Kiem tra lai username.'};
  var r=row.data;
  return{ok:true,student:{username:r[C.USERNAME],fullName:r[C.FULLNAME],deadline:_fmtDate(r[C.DEADLINE]),
    vgDone:r[C.VG_DONE]===true,writingDone:r[C.WRITING_DONE]===true,
    listeningDone:r[C.LISTENING_DONE]===true,speakingDone:r[C.SPEAKING_DONE]===true}};
}

// ════════════════════════════════════════════════════
// SUBMIT V&G
// ════════════════════════════════════════════════════
function _submitVG(d) {
  var row=_findStudent(d.username);
  if(!row)return{ok:false,error:'Khong tim thay tai khoan.'};
  if(row.data[C.VG_DONE]===true)return{ok:false,error:'Bai V&G da nop roi.'};
  var score=0;
  for(var q=1;q<=50;q++)if((d.answers[q]||'').toLowerCase()===VG_KEY[q])score++;
  var level=score<=10?'A1':score<=20?'A2':score<=30?'B1':score<=40?'B2':score<=47?'C1':'C2';
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('VG_Results')
    .appendRow([d.username,_now(),JSON.stringify(d.answers),score,level]);
  _set(row.rowIndex,C.VG_DONE,true); _set(row.rowIndex,C.VG_SCORE,score);
  _checkDone(d.username); return{ok:true};
}

// ════════════════════════════════════════════════════
// SUBMIT WRITING
// ════════════════════════════════════════════════════
function _submitWriting(d) {
  var row=_findStudent(d.username);
  if(!row)return{ok:false,error:'Khong tim thay tai khoan.'};
  if(row.data[C.WRITING_DONE]===true)return{ok:false,error:'Bai Writing da nop roi.'};
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Writing_Results')
    .appendRow([d.username,_now(),d.topic,d.essay,'','','','']);
  _set(row.rowIndex,C.WRITING_DONE,true); _checkDone(d.username); return{ok:true};
}

// ════════════════════════════════════════════════════
// SUBMIT LISTENING
// ════════════════════════════════════════════════════
function _submitListening(d) {
  var row=_findStudent(d.username);
  if(!row)return{ok:false,error:'Khong tim thay tai khoan.'};
  if(row.data[C.LISTENING_DONE]===true)return{ok:false,error:'Bai Listening da nop roi.'};
  var score=0;
  for(var q=1;q<=24;q++)if((d.answers[q]||'').toLowerCase()===LIS_KEY[q])score++;
  var level=score<=4?'A1':score<=8?'A2':score<=13?'B1':score<=18?'B2':score<=22?'C1':'C2';
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Listening_Results')
    .appendRow([d.username,_now(),JSON.stringify(d.answers),score,level]);
  _set(row.rowIndex,C.LISTENING_DONE,true); _set(row.rowIndex,C.LISTENING_SCORE,score);
  _checkDone(d.username); return{ok:true};
}

// ════════════════════════════════════════════════════
// UPLOAD SPEAKING
// ════════════════════════════════════════════════════
function _uploadSpeaking(d) {
  var row=_findStudent(d.username);
  if(!row)return{ok:false,error:'Khong tim thay tai khoan.'};
  if(row.data[C.SPEAKING_DONE]===true)return{ok:false,error:'Bai Speaking da nop roi.'};
  var folder;
  try{folder=DriveApp.getFolderById(CONFIG.SPEAKING_FOLDER_ID);}
  catch(e){return{ok:false,error:'Khong tim thay folder Drive audio.'};}
  var date=Utilities.formatDate(new Date(),'Asia/Ho_Chi_Minh','dd-MM-yyyy');
  var safe=_nd(d.fullName||d.username).replace(/[^a-zA-Z0-9 _-]/g,'').trim();
  var fname=safe+'_'+date+'.'+(d.ext||'webm');
  var blob=Utilities.newBlob(Utilities.base64Decode(d.audioBase64),d.mimeType||'audio/webm',fname);
  var file=folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
  var url='https://drive.google.com/file/d/'+file.getId()+'/view';
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Speaking_Results')
    .appendRow([d.username,_now(),file.getId(),url,'','']);
  _set(row.rowIndex,C.SPEAKING_DONE,true); _set(row.rowIndex,C.SPEAKING_FILE,url);
  _checkDone(d.username); return{ok:true,fileUrl:url};
}

// ════════════════════════════════════════════════════
// CHECK DONE — gửi email GV khi thí sinh xong cả 4 bài
// ════════════════════════════════════════════════════
function _checkDone(username) {
  var row=_findStudent(username); if(!row)return;
  var r=row.data;
  if(r[C.VG_DONE]===true&&r[C.WRITING_DONE]===true&&r[C.LISTENING_DONE]===true&&r[C.SPEAKING_DONE]===true){
    _emailStudentDone(r[C.EMAIL],r[C.FULLNAME]);
    _emailTeacherNotify(r[C.FULLNAME],username,r[C.EMAIL],r[C.SCHOOL]);
  }
}

// ════════════════════════════════════════════════════
// TEACHER AUTH
// ════════════════════════════════════════════════════
function _teacherLogin(d){
  try{_auth(d);return{ok:true};}catch(e){return{ok:false,error:e.message==='Unauthorized'?'Sai mat khau.':e.message};}
}
function _auth(d){
  if(!CONFIG.TEACHER_PASSWORD)throw new Error('Chua cau hinh TEACHER_PASSWORD trong Script properties.');
  if(d.password!==CONFIG.TEACHER_PASSWORD)throw new Error('Unauthorized');
}

// ════════════════════════════════════════════════════
// STUDENT LIST
// ════════════════════════════════════════════════════
function _getStudentList(d) {
  try{_auth(d);}catch(e){return{ok:false,error:e.message};}
  var rows=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Students').getDataRange().getValues();
  return{ok:true,students:rows.slice(1).map(function(r){return{
    username:r[C.USERNAME],fullName:r[C.FULLNAME],email:r[C.EMAIL],school:r[C.SCHOOL],
    deadline:_fmtDate(r[C.DEADLINE]),registeredAt:r[C.REGISTERED_AT],
    vgDone:r[C.VG_DONE]===true,writingDone:r[C.WRITING_DONE]===true,
    listeningDone:r[C.LISTENING_DONE]===true,speakingDone:r[C.SPEAKING_DONE]===true,
    vgScore:r[C.VG_SCORE],writingBand:r[C.WRITING_BAND],listeningScore:r[C.LISTENING_SCORE],
    overallLevel:r[C.OVERALL_LEVEL],feedbackSent:r[C.FEEDBACK_SENT]===true,
  };})};
}

// ════════════════════════════════════════════════════
// STUDENT DETAIL
// ════════════════════════════════════════════════════
function _getStudentDetail(d) {
  try{_auth(d);}catch(e){return{ok:false,error:e.message};}
  var username=d.username;
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  var sRow=_findStudent(username);
  var student=sRow?{
    fullName:sRow.data[C.FULLNAME],email:sRow.data[C.EMAIL],dob:sRow.data[C.DOB],
    school:sRow.data[C.SCHOOL],deadline:sRow.data[C.DEADLINE],
    vgDone:sRow.data[C.VG_DONE]===true,writingDone:sRow.data[C.WRITING_DONE]===true,
    listeningDone:sRow.data[C.LISTENING_DONE]===true,speakingDone:sRow.data[C.SPEAKING_DONE]===true,
    targetBand:sRow.data[C.TARGET_BAND],examDate:sRow.data[C.EXAM_DATE],
    whyIELTS:sRow.data[C.WHY_IELTS],certificates:sRow.data[C.CERTIFICATES],
    yearsLearning:sRow.data[C.YEARS_LEARNING],studiedBefore:sRow.data[C.STUDIED_BEFORE],
    whereStudied:sRow.data[C.WHERE_STUDIED],listeningAbility:sRow.data[C.LISTENING_ABILITY],
    speakingAbility:sRow.data[C.SPEAKING_ABILITY],readingAbility:sRow.data[C.READING_ABILITY],
    writingAbility:sRow.data[C.WRITING_ABILITY],
  }:null;
  var reportNotes=(sRow&&sRow.data[C.REPORT_NOTES])||'';

  var vg=null;
  var vgRows=ss.getSheetByName('VG_Results').getDataRange().getValues();
  for(var i=vgRows.length-1;i>=1;i--){
    if(vgRows[i][0]===username){
      try{vg={submittedAt:vgRows[i][1],answers:JSON.parse(vgRows[i][2]||'{}'),score:vgRows[i][3],level:vgRows[i][4]};}
      catch(e){vg={submittedAt:vgRows[i][1],answers:{},score:vgRows[i][3],level:vgRows[i][4]};}
      break;
    }
  }
  var writing=null;
  var wRows=ss.getSheetByName('Writing_Results').getDataRange().getValues();
  for(var i=wRows.length-1;i>=1;i--){
    if(wRows[i][0]===username){
      writing={submittedAt:wRows[i][1],topic:wRows[i][2],essay:wRows[i][3],
        aiBand:wRows[i][4],aiComment:wRows[i][5],teacherBand:wRows[i][6],teacherComment:wRows[i][7]};
      break;
    }
  }
  var listening=null;
  var lRows=ss.getSheetByName('Listening_Results').getDataRange().getValues();
  for(var i=lRows.length-1;i>=1;i--){
    if(lRows[i][0]===username){
      try{listening={submittedAt:lRows[i][1],answers:JSON.parse(lRows[i][2]||'{}'),score:lRows[i][3],level:lRows[i][4]};}
      catch(e){listening={submittedAt:lRows[i][1],answers:{},score:lRows[i][3],level:lRows[i][4]};}
      break;
    }
  }
  var speaking=null;
  var spRows=ss.getSheetByName('Speaking_Results').getDataRange().getValues();
  for(var i=spRows.length-1;i>=1;i--){
    if(spRows[i][0]===username){
      speaking={submittedAt:spRows[i][1],fileId:spRows[i][2],fileUrl:spRows[i][3],
        teacherBand:spRows[i][4],teacherComment:spRows[i][5]};
      break;
    }
  }
  return{ok:true,student:student,vg:vg,writing:writing,listening:listening,speaking:speaking,reportNotes:reportNotes};
}

// ════════════════════════════════════════════════════
// GRADE WRITING / SPEAKING
// ════════════════════════════════════════════════════
function _gradeWriting(d) {
  try{_auth(d);}catch(e){return{ok:false,error:e.message};}
  var sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Writing_Results');
  var rows=sh.getDataRange().getValues();
  for(var i=rows.length-1;i>=1;i--){
    if(rows[i][0]===d.username){
      sh.getRange(i+1,7).setValue(d.band); sh.getRange(i+1,8).setValue(d.comment);
      // Structured AI feedback (JSON) feeds the report; the sheet cell limit is 50 000 chars.
      if(d.aiFeedback!==undefined){
        sh.getRange(i+1,5).setValue(d.aiBand||'');
        sh.getRange(i+1,6).setValue(String(d.aiFeedback||'').slice(0,49000));
      }
      var sRow=_findStudent(d.username);
      if(sRow)_set(sRow.rowIndex,C.WRITING_BAND,d.band);
      return{ok:true};
    }
  }
  return{ok:false,error:'Khong tim thay bai Writing.'};
}

function _gradeSpeaking(d) {
  try{_auth(d);}catch(e){return{ok:false,error:e.message};}
  var sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Speaking_Results');
  var rows=sh.getDataRange().getValues();
  for(var i=rows.length-1;i>=1;i--){
    if(rows[i][0]===d.username){
      sh.getRange(i+1,5).setValue(d.band); sh.getRange(i+1,6).setValue(d.comment);
      return{ok:true};
    }
  }
  return{ok:false,error:'Khong tim thay bai Speaking.'};
}

// ════════════════════════════════════════════════════
// REPORT NOTES — nhận xét giáo viên chỉnh sửa trên trang chi tiết
// ════════════════════════════════════════════════════
function _saveReportNotes(d) {
  try{_auth(d);}catch(e){return{ok:false,error:e.message};}
  var row=_findStudent(d.username);
  if(!row)return{ok:false,error:'Khong tim thay tai khoan.'};
  _set(row.rowIndex,C.REPORT_NOTES,String(d.notes||'').slice(0,49000));
  return{ok:true};
}

// ════════════════════════════════════════════════════
// EXPORT REPORT — Google Doc từ HTML của trang giáo viên
// Trang teacher-detail dựng phiếu theo template (font, màu, heading) dưới dạng
// HTML inline-style; Drive tự chuyển HTML → Google Doc nên định dạng được giữ nguyên.
// ════════════════════════════════════════════════════
function _exportReportDoc(d) {
  try{_auth(d);}catch(e){return{ok:false,error:e.message};}
  if(!d.html)return{ok:false,error:'Thieu noi dung phieu (html).'};
  var sRow=_findStudent(d.username);
  if(!sRow)return{ok:false,error:'Khong tim thay tai khoan.'};
  var title=d.title||('Venus English — Phiếu Nhận Xét — '+sRow.data[C.FULLNAME]);
  var file=_createDocFromHtml(title,d.html,CONFIG.FEEDBACK_FOLDER_ID);
  if(d.overallLevel)_set(sRow.rowIndex,C.OVERALL_LEVEL,d.overallLevel);
  if(d.notes)_set(sRow.rowIndex,C.REPORT_NOTES,String(d.notes).slice(0,49000));
  _set(sRow.rowIndex,C.FEEDBACK_SENT,true);
  return{ok:true,docId:file.id,docUrl:file.webViewLink||('https://docs.google.com/document/d/'+file.id+'/edit')};
}

/** Uploads HTML to Drive with conversion to a Google Doc (Drive API v3 multipart upload). */
function _createDocFromHtml(title,html,folderId) {
  var meta={name:title,mimeType:MimeType.GOOGLE_DOCS};
  if(folderId)meta.parents=[folderId];
  var boundary='venus'+Utilities.getUuid().replace(/-/g,'');
  var head='--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify(meta)+
           '\r\n--'+boundary+'\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n';
  var tail='\r\n--'+boundary+'--';
  var utf8=function(str){return Utilities.newBlob('').setDataFromString(str,'UTF-8').getBytes();};
  var bytes=utf8(head).concat(utf8(html)).concat(utf8(tail));
  var res=UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,webViewLink',{
    method:'post',contentType:'multipart/related; boundary='+boundary,payload:bytes,
    headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},muteHttpExceptions:true});
  if(res.getResponseCode()>=300)throw new Error('Drive API '+res.getResponseCode()+': '+res.getContentText().slice(0,300));
  return JSON.parse(res.getContentText());
}

function _updateDeadline(d) {
  try { _auth(d); } catch(e) { return {ok:false, error:e.message}; }
  var row = _findStudent(d.username);
  if (!row) return {ok:false, error:'Không tìm thấy tài khoản.'};
  // Validate dd/MM/yyyy
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(d.deadline)) return {ok:false, error:'Định dạng deadline không hợp lệ (dd/MM/yyyy).'};
  _set(row.rowIndex, C.DEADLINE, d.deadline);
  return {ok:true};
}

// ════════════════════════════════════════════════════
// TRACK ACTIVITY — ghi log đăng nhập / thoát bài
// ════════════════════════════════════════════════════
function _trackActivity(d) {
  // d: {username, testType, action, note}
  // action: 'enter' | 'exit' | 'resume'
  // testType: 'vg' | 'listening' | 'writing' | 'speaking'
  var row = _findStudent(d.username);
  var fullName = row ? row.data[C.FULLNAME] : (d.username || '');
  try {
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Activity_Log')
      .appendRow([_now(), d.username, fullName, d.testType||'', d.action||'', d.note||'']);
  } catch(e) { Logger.log('Activity log error: ' + e.message); }
  return {ok:true};
}

// Lấy activity log của 1 thí sinh (dùng cho trang giáo viên)
function _getActivityLog(d) {
  try { _auth(d); } catch(e) { return {ok:false, error:e.message}; }
  var rows = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Activity_Log').getDataRange().getValues();
  var logs = rows.slice(1)
    .filter(function(r){ return !d.username || r[1]===d.username; })
    .map(function(r){ return {time:r[0],username:r[1],fullName:r[2],testType:r[3],action:r[4],note:r[5]}; });
  return {ok:true, logs:logs};
}

// ════════════════════════════════════════════════════
// QUESTIONS & TOPICS
// ════════════════════════════════════════════════════
function _getQuestions() {
  var rows=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Speaking_Questions').getDataRange().getValues();
  var qs=rows.slice(1).filter(function(r){return r[2]===true;}).sort(function(a,b){return a[0]-b[0];}).map(function(r){return{order:r[0],question:r[1]};});
  return{ok:true,questions:qs};
}
function _saveQuestions(d) {
  try{_auth(d);}catch(e){return{ok:false,error:e.message};}
  var sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Speaking_Questions');
  var last=sh.getLastRow(); if(last>1)sh.deleteRows(2,last-1);
  d.questions.forEach(function(q,i){sh.appendRow([i+1,q.question,q.active!==false]);});
  return{ok:true};
}
function _getTopics() {
  var rows=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Writing_Topics').getDataRange().getValues();
  var topics=rows.slice(1).filter(function(r){return r[3]===true;}).sort(function(a,b){return a[0]-b[0];}).map(function(r){return{order:r[0],title:r[1],description:r[2]};});
  return{ok:true,topics:topics};
}
function _saveTopics(d) {
  try{_auth(d);}catch(e){return{ok:false,error:e.message};}
  var sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Writing_Topics');
  var last=sh.getLastRow(); if(last>1)sh.deleteRows(2,last-1);
  d.topics.forEach(function(t,i){sh.appendRow([i+1,t.title,t.description,t.active!==false]);});
  return{ok:true};
}

// ════════════════════════════════════════════════════
// EMAIL
// ════════════════════════════════════════════════════
function _emailWelcome(email,name,uname,deadline) {
  try{GmailApp.sendEmail(email,'[Venus English] Dang ky thanh cong','',{name:'Venus English',htmlBody:'<div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto"><div style="background:#063672;padding:20px;text-align:center;border-radius:8px 8px 0 0"><h2 style="color:#fff;margin:0">Venus English</h2></div><div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px"><p>Xin chao <strong>'+name+'</strong>,</p><p>Ban da dang ky bai kiem tra xep lop IELTS tai Venus English.</p><div style="background:#f0f7ff;border-radius:8px;padding:16px;margin:16px 0"><p><strong>Tai khoan:</strong> <code style="background:#063672;color:#fff;padding:2px 8px;border-radius:4px">'+uname+'</code></p><p><strong>Han nop bai:</strong> '+deadline+'</p></div><p>Bai kiem tra gom 4 phan: Ngu Phap, Viet, Nghe, Noi. Co the lam moi phan vao ngay khac nhau.</p><div style="text-align:center;margin:20px 0"><a href="'+CONFIG.APP_URL+'login.html" style="background:#063672;color:#fff;padding:11px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Dang nhap lam bai</a></div></div></div>'});}
  catch(e){Logger.log('Email loi: '+e.message);}
}

function _emailStudentDone(email,name) {
  try{GmailApp.sendEmail(email,'[Venus English] Ban da hoan thanh bai kiem tra!','',{name:'Venus English',htmlBody:'<div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto"><div style="background:#063672;padding:20px;text-align:center;border-radius:8px 8px 0 0"><h2 style="color:#fff;margin:0">Venus English</h2></div><div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px"><p>Xin chao <strong>'+name+'</strong>,</p><p>Cam on ban da hoan thanh toan bo 4 phan bai kiem tra xep lop IELTS tai Venus English!</p><p>Giao vien se cham bai va gui ket qua + nhan xet chi tiet den email nay trong thoi gian som nhat.</p><p>Vui long cho thong bao tu Venus English.</p></div></div>'});}
  catch(e){Logger.log('Email loi: '+e.message);}
}

function _emailTeacherNotify(name,uname,studentEmail,school) {
  try{GmailApp.sendEmail(CONFIG.TEACHER_EMAIL,'[Venus English] Thi sinh hoan thanh: '+name,'',{name:'Venus English',htmlBody:'<div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto"><div style="background:#063672;padding:20px;text-align:center;border-radius:8px 8px 0 0"><h2 style="color:#fff;margin:0">Venus English</h2><p style="color:rgba(255,255,255,.7);font-size:13px;margin:4px 0 0">Thong bao hoan thanh bai thi</p></div><div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px"><p>Thi sinh <strong>'+name+'</strong> da hoan thanh toan bo <strong>4 phan</strong> bai kiem tra xep lop.</p><div style="background:#f0f7ff;border-radius:8px;padding:16px;margin:16px 0"><p><strong>Username:</strong> <code>'+uname+'</code></p><p><strong>Email:</strong> '+studentEmail+'</p><p><strong>Truong:</strong> '+(school||'--')+'</p></div><div style="text-align:center;margin:20px 0"><a href="'+CONFIG.APP_URL+'teacher-detail.html?u='+encodeURIComponent(uname)+'" style="background:#063672;color:#fff;padding:11px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Xem chi tiet & cham bai</a></div></div></div>'});}
  catch(e){Logger.log('Email thong bao GV loi: '+e.message);}
}

// ════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════
function _fmtDate(v) {
  // Google Sheets returns Date objects for date cells; convert to dd/MM/yyyy
  if (!v) return '';
  if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy');
  var s = String(v);
  // Already dd/MM/yyyy format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  // ISO string like 2026-06-06T17:00:00.000Z
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    var d = new Date(s);
    return Utilities.formatDate(d, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy');
  }
  return s;
}

function _findStudent(username) {
  var sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Students');
  var rows=sh.getDataRange().getValues();
  for(var i=1;i<rows.length;i++)if(rows[i][C.USERNAME]===username)return{rowIndex:i+1,data:rows[i]};
  return null;
}
function _set(sheetRow,col,val) {
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Students').getRange(sheetRow,col+1).setValue(val);
}
function _now() {
  return Utilities.formatDate(new Date(),'Asia/Ho_Chi_Minh','dd/MM/yyyy HH:mm');
}