import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile, GoogleAuthProvider,
  signInWithRedirect, getRedirectResult
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getStorage, ref as storageRef, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";
import {
  getFunctions, httpsCallable
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-functions.js";
import {
  getFirestore, collection, addDoc, query, orderBy, onSnapshot, where,
  serverTimestamp, limit, doc, updateDoc, deleteDoc, setDoc, getDoc,
  addDoc as addFirestoreDoc, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDO67tH4DPCkTVg0eVGgR12oQNfYrtGj_Y",
  authDomain: "bubble-chat-b6aed.firebaseapp.com",
  projectId: "bubble-chat-b6aed",
  storageBucket: "bubble-chat-b6aed.firebasestorage.app",
  messagingSenderId: "156336364256",
  appId: "1:156336364256:web:c7a39d384941d72f40ce85"
};

const isConfigured = !Object.values(firebaseConfig).some(v => v.includes("PASTE_"));
let db = null;
let auth = null;
let storage = null;
let functions = null;
if (isConfigured) {
  const fbApp = initializeApp(firebaseConfig);
  db = getFirestore(fbApp);
  auth = getAuth(fbApp);
  storage = getStorage(fbApp);
  functions = getFunctions(fbApp);
}

const $ = id => document.getElementById(id);
const els = {
  modal:$("nameModal"), displayName:$("displayNameInput"), start:$("startChatBtn"), ownerGoogleLogin:$("ownerGoogleLoginBtn"), password:$("passwordInput"), loginTab:$("loginTabBtn"), registerTab:$("registerTabBtn"), registerNameWrap:$("registerNameWrap"), demoLogin:$("demoLoginBtn"), rememberedAccountWrap:$("rememberedAccountWrap"), rememberedAccountName:$("rememberedAccountName"), switchAccount:$("switchAccountBtn"), loginUsernameWrap:$("loginUsernameWrap"), loginUsername:$("loginUsernameInput"), rememberedAccountWrap:$("rememberedAccountWrap"), rememberedAccountName:$("rememberedAccountName"), switchAccount:$("switchAccountBtn"), loginUsernameWrap:$("loginUsernameWrap"), loginUsername:$("loginUsernameInput"),
  form:$("messageForm"), input:$("messageInput"), list:$("messageList"), roomTitle:$("roomTitle"), onlineText:$("onlineText"),
  toast:$("toast"), preview:$("generalPreview"), emoji:$("emojiBtn"),
  attach:$("attachBtn"), info:$("infoBtn"), typing:$("typingBar"),
  file:$("fileInput"), unread:$("unreadDot"),
  mic:$("micBtn"), audioCall:$("audioCallBtn"), videoCall:$("videoCallBtn"),
  callModal:$("callModal"), localVideo:$("localVideo"), remoteVideo:$("remoteVideo"),
  audioCallAvatar:$("audioCallAvatar"), callStatus:$("callStatus"),
  toggleMic:$("toggleMicBtn"), toggleCamera:$("toggleCameraBtn"),
  switchCamera:$("switchCameraBtn"), endCall:$("endCallBtn"),
  attachMenu:$("attachMenu"), photoOption:$("photoOptionBtn"), locationOption:$("locationOptionBtn"),
  profileModal:$("profileModal"), closeProfile:$("closeProfileBtn"), profileName:$("profileName"),
  profileStatus:$("profileStatus"), profilePhoto:$("profilePhotoImg"), profileFallback:$("profileFallback"),
  profilePhotoInput:$("profilePhotoInput"), changePhoto:$("changePhotoBtn"), friendAction:$("friendActionBtn"),
  headerProfile:$("headerProfileBtn"), roomProfile:$("roomProfileBtn"), headerAvatar:$("headerAvatar"), sidebarMainName:$("sidebarMainName"), chatHeroName:$("chatHeroName"), heroAvatar:$("heroAvatar"), menuBtn:$("menuBtn"), menuDrawer:$("menuDrawer"), closeMenu:$("closeMenuBtn"), menuChats:$("menuChatsBtn"), menuPeople:$("menuPeopleBtn"), menuFriendList:$("menuFriendListBtn"), menuGroupChat:$("menuGroupChatBtn"), ownerMenuSection:$("ownerMenuSection"), ownerPrivateReview:$("ownerPrivateReviewBtn"), ownerGroupReview:$("ownerGroupReviewBtn"), friendRequestModal:$("friendRequestModal"), friendRequestPeople:$("friendRequestPeople"), closeFriendRequest:$("closeFriendRequestBtn"), groupCreateModal:$("groupCreateModal"), closeGroupCreate:$("closeGroupCreateBtn"), groupNameInput:$("groupNameInput"), groupMemberPicker:$("groupMemberPicker"), createGroup:$("createGroupBtn"), chatContextBar:$("chatContextBar"), menuFriendRequests:$("menuFriendRequestsBtn"), requestCountBadge:$("requestCountBadge"), incomingRequestsModal:$("incomingRequestsModal"), incomingRequestsList:$("incomingRequestsList"), closeIncomingRequests:$("closeIncomingRequestsBtn"), logout:$("logoutBtn"), enableNotifications:$("enableNotificationsBtn"), incomingCallModal:$("incomingCallModal"), incomingCallerAvatar:$("incomingCallerAvatar"), incomingCallerName:$("incomingCallerName"), incomingCallType:$("incomingCallType"), answerCall:$("answerCallBtn"), declineCall:$("declineCallBtn")
};

let currentName = localStorage.getItem("niceChartName") || "";
let currentUid = localStorage.getItem("niceChartUid") || "";
let localMessages = JSON.parse(localStorage.getItem("niceChartLocalMessages") || "[]");
const roomId = "general";
let typingTimer = null;
let mediaRecorder = null;
let recordedChunks = [];
let localStream = null;
let peerConnection = null;
let activeCallId = null;
let currentCallType = null;
let facingMode = "user";
let selectedProfileName = "Nice Chart";
let profilePhotos = JSON.parse(localStorage.getItem("niceChartProfilePhotos") || "{}");
let friends = JSON.parse(localStorage.getItem("niceChartFriends") || "{}");
let knownUsers = JSON.parse(localStorage.getItem("niceChartKnownUsers") || "[]");
let renderedMessages = [];
let currentView = "general";
let activePrivateChatId = null;
let activeGroupId = null;
let activeChatLabel = "";
let friendships = JSON.parse(localStorage.getItem("niceChartFriendships") || "{}");
let privateChats = JSON.parse(localStorage.getItem("niceChartPrivateChats") || "{}");
let groups = JSON.parse(localStorage.getItem("niceChartGroups") || "{}");
let ownerMode = localStorage.getItem("niceChartOwnerMode") === "true";
let authMode = "login";
let pendingIncomingCall = null;
let seenUnsubscribe = null;
let typingUnsubscribe = null;
let lastTypingWrite = 0;
const OWNER_UID = "SET_YOUR_OWNER_FIREBASE_UID";
const OWNER_GMAIL = "SET_YOUR_OWNER_GMAIL";
// Set BOTH values after creating/signing in to the Owner Google account.
// Normal users never receive an owner profile document in the public users collection.
if(currentName && !knownUsers.includes(currentName)) knownUsers.push(currentName);

const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]
};

if (currentName && !isConfigured) els.modal.classList.remove("show");

function toast(text){
  els.toast.textContent=text; els.toast.classList.add("show");
  setTimeout(()=>els.toast.classList.remove("show"),1600);
}
function initials(name="U"){
  return name.trim().split(/\s+/).slice(0,2).map(x=>x[0]?.toUpperCase()).join("") || "U";
}
function formatTime(ts){
  try{
    const d=ts?.toDate?ts.toDate():new Date(ts||Date.now());
    return d.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
  }catch{return ""}
}
function saveLocal(){
  localStorage.setItem("niceChartLocalMessages",JSON.stringify(localMessages.slice(-300)));
}
function savePeople(){
  localStorage.setItem("niceChartProfilePhotos", JSON.stringify(profilePhotos));
  localStorage.setItem("niceChartFriends", JSON.stringify(friends));
  localStorage.setItem("niceChartKnownUsers", JSON.stringify(knownUsers));
  localStorage.setItem("niceChartFriendships", JSON.stringify(friendships));
  localStorage.setItem("niceChartPrivateChats", JSON.stringify(privateChats));
  localStorage.setItem("niceChartGroups", JSON.stringify(groups));
}
function rememberUser(name, uid=""){
  if(!name) return;
  const users=normalizedKnownUsers();
  const existing=users.find(u=>u.displayName===name || (uid && u.uid===uid));
  if(!existing){
    users.push({uid:uid||name,displayName:name,online:false});
    knownUsers=users; savePeople();
  }
}
function dataUrlToBlob(dataUrl){
  const parts = dataUrl.split(",");
  const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const binary = atob(parts[1]);
  const array = new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++) array[i] = binary.charCodeAt(i);
  return new Blob([array], { type: mime });
}
async function compressImageFile(file, maxSize = 720, quality = 0.82){
  return await new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        const scale = Math.min(1, maxSize / Math.max(width, height));
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function applyProfilePhotoToAvatar(el, name){
  if(!el) return;
  const photo = profilePhotos[name];
  el.style.backgroundImage = "";
  el.style.backgroundSize = "";
  el.style.backgroundPosition = "";
  if(photo){
    el.textContent = "";
    el.style.backgroundImage = `url(${photo})`;
    el.style.backgroundSize = "cover";
    el.style.backgroundPosition = "center";
  }else{
    el.textContent = initials(name || "U");
  }
}
function refreshIdentityUI(){
  const displayName = currentName || "Your Account";
  if(els.roomTitle) els.roomTitle.textContent = displayName;
  if(els.sidebarMainName) els.sidebarMainName.textContent = displayName;
  if(els.chatHeroName) els.chatHeroName.textContent = displayName;
  if(els.onlineText) els.onlineText.textContent = currentName ? "This is your account" : "Active now";
  applyProfilePhotoToAvatar(els.headerAvatar, currentName);
  applyProfilePhotoToAvatar(els.heroAvatar, currentName);
}



function normalizeUsername(raw){
  return String(raw||"").trim().toLowerCase().replace(/\s+/g,"_").replace(/[^a-z0-9._-]/g,"");
}

async function registerWithUniquePassword(username, displayName, password){
  if(!functions) throw new Error("functions-not-configured");
  const registerUsername = httpsCallable(functions, "registerUsername");
  const result = await registerUsername({username, displayName, password});
  return result.data;
}

function usernameToInternalEmail(username){
  const safe=normalizeUsername(username);
  return `${safe}@nicechart.local`;
}
function rememberedUsername(){
  return localStorage.getItem("niceChartRememberedUsername") || "";
}
function setRememberedUsername(username){
  localStorage.setItem("niceChartRememberedUsername", username);
}

function userDocId(){
  return currentUid || currentName;
}
function currentIdentity(){
  return {uid:currentUid||currentName, displayName:currentName};
}
async function publishPresence(online){
  if(!db || !currentUid) return;
  try{
    if(isOwner()){
      await setDoc(doc(db,"owners",currentUid),{
        uid:currentUid,
        displayName:currentName,
        email:auth?.currentUser?.email||"",
        photoURL:auth?.currentUser?.photoURL||"",
        online,
        lastSeen:serverTimestamp()
      },{merge:true});
    }else{
      await setDoc(doc(db,"users",currentUid),{
        uid:currentUid,
        displayName:currentName,
        online,
        lastSeen:serverTimestamp()
      },{merge:true});
    }
  }catch{}
}
function findKnownUserByName(name){
  return knownUsers.find(u => (typeof u==="string"?u:u.displayName)===name);
}
function normalizedKnownUsers(){
  return knownUsers.map(u=>typeof u==="string"?{uid:u,displayName:u,online:false}:u);
}


async function uploadFileToStorage(file, path){
  if(!storage) throw new Error("Storage not configured");
  const ref=storageRef(storage,path);
  await uploadBytes(ref,file);
  return await getDownloadURL(ref);
}
async function uploadDataUrlToStorage(dataUrl,path){
  const blob=dataUrlToBlob(dataUrl);
  if(!storage) throw new Error("Storage not configured");
  const ref=storageRef(storage,path);
  await uploadBytes(ref,blob);
  return await getDownloadURL(ref);
}
function currentChatPresenceRef(){
  if(!db || !currentUid) return null;
  if(currentView==="private" && activePrivateChatId) return doc(db,"privateChats",activePrivateChatId,"presence",currentUid);
  if(currentView==="group" && activeGroupId) return doc(db,"groups",activeGroupId,"presence",currentUid);
  return doc(db,"rooms",roomId,"presence",currentUid);
}
async function setTypingState(isTyping){
  const ref=currentChatPresenceRef();
  if(!ref) return;
  try{
    await setDoc(ref,{uid:currentUid,name:currentName,typing:isTyping,lastSeen:serverTimestamp()},{merge:true});
  }catch{}
}
function watchTyping(){
  if(typingUnsubscribe){typingUnsubscribe();typingUnsubscribe=null;}
  if(!db) return;
  let col=null;
  if(currentView==="private" && activePrivateChatId) col=collection(db,"privateChats",activePrivateChatId,"presence");
  else if(currentView==="group" && activeGroupId) col=collection(db,"groups",activeGroupId,"presence");
  else col=collection(db,"rooms",roomId,"presence");
  typingUnsubscribe=onSnapshot(col,snap=>{
    const typers=[];
    snap.forEach(d=>{
      const v=d.data();
      if(v.uid!==currentUid && v.typing) typers.push(v.name||"Someone");
    });
    els.typing.textContent=typers.length?`${typers.join(", ")} ${typers.length>1?"are":"is"} typing…`:"";
  });
}
async function markSeen(){
  const ref=currentChatPresenceRef();
  if(!ref) return;
  try{
    await setDoc(ref,{uid:currentUid,name:currentName,typing:false,lastSeen:serverTimestamp(),seenAt:serverTimestamp()},{merge:true});
  }catch{}
}

function canonicalPair(a,b){
  return [a,b].sort((x,y)=>x.localeCompare(y)).join("::");
}
function privateChatIdFor(a,b){
  return canonicalPair(a,b).replace(/[^\p{L}\p{N}:_-]/gu,"_");
}
function friendshipRecord(a,b){
  return Object.values(friendships).find(f=>{
    const names=f.userNames||f.users||[];
    return names.includes(a)&&names.includes(b);
  });
}
function areFriends(a,b){
  return friendshipRecord(a,b)?.status==="accepted";
}
function setFriendship(a,b,status="accepted"){
  const key=canonicalPair(a,b);
  friendships[key]={userNames:[a,b],users:[a,b],status,updatedAt:Date.now()};
  savePeople();
}
function getFriendsOf(name){
  return Object.values(friendships).filter(f=>f.status==="accepted" && f.users.includes(name))
    .map(f=>f.users.find(x=>x!==name)).filter(Boolean);
}
function isOwner(){
  if(auth?.currentUser){
    if(OWNER_UID !== "SET_YOUR_OWNER_FIREBASE_UID" && auth.currentUser.uid === OWNER_UID) return true;
    if(OWNER_GMAIL !== "SET_YOUR_OWNER_GMAIL" && (auth.currentUser.email||"").toLowerCase() === OWNER_GMAIL.toLowerCase()) return true;
  }
  return ownerMode && !isConfigured;
}
function setViewLabel(name,status=""){
  if(els.roomTitle) els.roomTitle.textContent=name;
  if(els.onlineText) els.onlineText.textContent=status || "Active now";
}
function showChatContext(text){
  if(!els.chatContextBar) return;
  els.chatContextBar.textContent=text || "";
  els.chatContextBar.classList.toggle("show",!!text);
}
function renderSidebarItems(items, type="friend"){
  const list=document.getElementById("roomList");
  list.innerHTML="";
  items.forEach(item=>{
    const row=document.createElement("button");
    row.className=type==="group"?"group-row":type==="review"?"review-row":"friend-row";
    const av=document.createElement("div"); av.className="avatar blue"; av.textContent=initials(item.avatarName||item.name||"C");
    const main=document.createElement("div"); main.className="row-main";
    const strong=document.createElement("strong"); strong.textContent=item.name;
    const span=document.createElement("span"); span.textContent=item.subtitle||"";
    main.appendChild(strong); main.appendChild(span);
    row.appendChild(av); row.appendChild(main);
    if(item.badge){const badge=document.createElement("span");badge.className=item.owner?"owner-badge":"friend-badge";badge.textContent=item.badge;row.appendChild(badge);}
    row.onclick=item.onclick;
    list.appendChild(row);
  });
  if(!items.length){
    const empty=document.createElement("div"); empty.style.padding="20px"; empty.style.color="#6b7280"; empty.textContent="Nothing here yet.";
    list.appendChild(empty);
  }
}
function renderPeopleView(){
  currentView="people";
  const users=normalizedKnownUsers().filter(u=>u.displayName && u.displayName!==currentName);
  renderSidebarItems(users.map(u=>({
    name:u.displayName,
    subtitle:(u.online?"● Online · ":"") + (areFriends(currentName,u.displayName) ? "Friend" : "Tap profile to add friend"),
    badge:areFriends(currentName,u.displayName)?"Chat":"Add Friend",
    avatarName:u.displayName,
    onclick:()=>openProfile(u.displayName)
  })));
}

async function sendFriendRequest(name){
  if(name===currentName)return;
  const target=normalizedKnownUsers().find(u=>u.displayName===name);
  if(!target){toast("User not found.");return;}
  const existing=friendshipRecord(currentName,name);
  if(existing?.status==="accepted"){openPrivateChat(name);return;}
  if(existing?.status==="pending"){toast("Friend request already sent.");return;}

  const id=canonicalPair(currentUid||currentName,target.uid||name).replace(/[^\w:-]/g,"_");
  const record={
    users:[currentUid||currentName,target.uid||name],
    userNames:[currentName,name],
    fromUid:currentUid||currentName,
    toUid:target.uid||name,
    fromName:currentName,
    toName:name,
    status:"pending",
    updatedAt:db?serverTimestamp():Date.now()
  };
  friendships[id]={...record,updatedAt:Date.now()};savePeople();
  if(db) await setDoc(doc(db,"friendships",id),record,{merge:true});
  toast(`Friend request sent to ${name}`);
}
async function acceptFriendRequest(id,f){
  if(db) await updateDoc(doc(db,"friendships",id),{status:"accepted",updatedAt:serverTimestamp()});
  friendships[id]={...f,status:"accepted",updatedAt:Date.now()};savePeople();
  const other=(f.userNames||[]).find(n=>n!==currentName) || f.fromName;
  const chatId=privateChatIdFor(currentName,other);
  privateChats[chatId]=privateChats[chatId]||{participants:[currentName,other],messages:[]};savePeople();
  if(db){
    const uids=f.users||[];
    await setDoc(doc(db,"privateChats",chatId),{
      participants:[currentName,other],
      participantUids:uids,
      participantNames:[currentName,other],
      updatedAt:serverTimestamp()
    },{merge:true});
  }
  renderIncomingRequests();
}
async function declineFriendRequest(id){
  if(db) await deleteDoc(doc(db,"friendships",id));
  delete friendships[id];savePeople();renderIncomingRequests();
}
function renderIncomingRequests(){
  const entries=Object.entries(friendships).filter(([id,f])=>f.status==="pending" && (f.toUid===currentUid || f.toName===currentName));
  els.incomingRequestsList.innerHTML="";
  entries.forEach(([id,f])=>{
    const row=document.createElement("div");row.className="picker-person";
    const av=document.createElement("div");av.className="avatar blue";av.textContent=initials(f.fromName||"U");
    const meta=document.createElement("div");meta.className="picker-meta";
    const strong=document.createElement("strong");strong.textContent=f.fromName||"Unknown";
    const span=document.createElement("span");span.textContent="Wants to be your friend";
    meta.appendChild(strong);meta.appendChild(span);
    const actions=document.createElement("div");actions.className="request-actions";
    const accept=document.createElement("button");accept.className="accept-btn";accept.textContent="Accept";accept.onclick=()=>acceptFriendRequest(id,f);
    const decline=document.createElement("button");decline.className="decline-btn";decline.textContent="Decline";decline.onclick=()=>declineFriendRequest(id);
    actions.appendChild(accept);actions.appendChild(decline);
    row.appendChild(av);row.appendChild(meta);row.appendChild(actions);els.incomingRequestsList.appendChild(row);
  });
  if(!entries.length){els.incomingRequestsList.innerHTML='<div style="padding:18px;color:#6b7280">No pending requests.</div>';}
}

function renderFriendList(){
  currentView="friends";
  const names=getFriendsOf(currentName);
  renderSidebarItems(names.map(name=>({
    name,
    subtitle:"Private conversation",
    badge:"Chat",
    avatarName:name,
    onclick:()=>openPrivateChat(name)
  })));
}
function renderGroupList(){
  currentView="groups";
  const visible=Object.entries(groups).filter(([id,g])=>g.members?.includes(currentName) || g.memberUids?.includes(currentUid));
  renderSidebarItems(visible.map(([id,g])=>({
    name:g.name,
    subtitle:`${g.members.length} members`,
    badge:"Group",
    avatarName:g.name,
    onclick:()=>openGroupChat(id)
  })), "group");
}
function localPrivateMessages(id){
  privateChats[id]=privateChats[id]||{participants:[],messages:[]};
  return privateChats[id].messages||[];
}
function openPrivateChat(friendName){
  if(!areFriends(currentName,friendName)){toast("Add this person as a friend first.");return;}
  currentView="private";
  activeGroupId=null;
  activePrivateChatId=privateChatIdFor(currentName,friendName);
  activeChatLabel=friendName;
  privateChats[activePrivateChatId]=privateChats[activePrivateChatId]||{participants:[currentName,friendName],messages:[]};
  setViewLabel(friendName,"Private chat");
  showChatContext("");
  if(db){
    const q=query(collection(db,"privateChats",activePrivateChatId,"messages"),orderBy("createdAt","asc"),limit(500));
    onSnapshot(q,s=>{const msgs=[];s.forEach(d=>msgs.push({id:d.id,...d.data()}));render(msgs);});
  }else render(localPrivateMessages(activePrivateChatId));
  markSeen(); watchTyping();
}
function openGroupChat(id){
  const g=groups[id]; if(!g)return;
  currentView="group"; activePrivateChatId=null; activeGroupId=id; activeChatLabel=g.name;
  setViewLabel(g.name,`${g.members.length} members`);
  showChatContext("");
  if(db){
    const q=query(collection(db,"groups",id,"messages"),orderBy("createdAt","asc"),limit(500));
    onSnapshot(q,s=>{const msgs=[];s.forEach(d=>msgs.push({id:d.id,...d.data()}));render(msgs);});
  }else render(g.messages||[]);
  markSeen(); watchTyping();
}
async function sendCurrentMessage(payload){
  if(currentView==="private" && activePrivateChatId){
    if(db){
      await addDoc(collection(db,"privateChats",activePrivateChatId,"messages"),payload);
      const friendUser=normalizedKnownUsers().find(u=>u.displayName===activeChatLabel);
      await setDoc(doc(db,"privateChats",activePrivateChatId),{
        participants:privateChats[activePrivateChatId]?.participants||[currentName,activeChatLabel],
        participantNames:[currentName,activeChatLabel],
        participantUids:[currentUid||currentName,friendUser?.uid||activeChatLabel],
        updatedAt:serverTimestamp()
      },{merge:true});
    }else{
      const msg={...payload,createdAt:new Date().toISOString()};
      privateChats[activePrivateChatId]=privateChats[activePrivateChatId]||{participants:[currentName,activeChatLabel],messages:[]};
      privateChats[activePrivateChatId].messages.push(msg); savePeople(); render(privateChats[activePrivateChatId].messages);
    }
    return;
  }
  if(currentView==="group" && activeGroupId){
    if(db){
      await addDoc(collection(db,"groups",activeGroupId,"messages"),payload);
    }else{
      groups[activeGroupId].messages=groups[activeGroupId].messages||[];
      groups[activeGroupId].messages.push({...payload,createdAt:new Date().toISOString()}); savePeople(); render(groups[activeGroupId].messages);
    }
    await setTypingState(false); await markSeen(); watchTyping();
    return;
  }
  if(db) await addDoc(collection(db,"rooms",roomId,"messages"),payload);
  else{
    localMessages.push({...payload,createdAt:new Date().toISOString()}); saveLocal(); render(localMessages);
  }
}
function renderOwnerPrivateReview(){
  if(!isOwner()){toast("Owner only.");return;}
  currentView="owner-private-list";
  showChatContext("Owner review: private conversations are visible here.");
  if(db){
    onSnapshot(collection(db,"privateChats"),snap=>{
      const rows=[];snap.forEach(d=>{const v=d.data();const parts=v.participants||[];rows.push({
        name:parts.join(" ↔ ")||d.id, subtitle:"Open conversation", badge:"Owner", owner:true, avatarName:parts[0]||"P",
        onclick:()=>openOwnerPrivateConversation(d.id,parts)
      });});renderSidebarItems(rows,"review");
    });
  }else{
    const rows=Object.entries(privateChats).map(([id,c])=>({
      name:(c.participants||[]).join(" ↔ ")||id, subtitle:`${(c.messages||[]).length} messages`, badge:"Owner", owner:true,
      avatarName:c.participants?.[0]||"P", onclick:()=>openOwnerPrivateConversation(id,c.participants||[])
    }));
    renderSidebarItems(rows,"review");
  }
}
function openOwnerPrivateConversation(id,participants=[]){
  currentView="owner-private-read"; activePrivateChatId=id; activeGroupId=null;
  setViewLabel(participants.join(" ↔ ")||"Private Conversation","Owner review");
  showChatContext("Owner review mode — read only.");
  if(db){
    const q=query(collection(db,"privateChats",id,"messages"),orderBy("createdAt","asc"),limit(1000));
    onSnapshot(q,s=>{const msgs=[];s.forEach(d=>msgs.push({id:d.id,...d.data()}));renderOwnerMessages(msgs);});
  }else renderOwnerMessages(privateChats[id]?.messages||[]);
}
function renderOwnerGroupReview(){
  if(!isOwner()){toast("Owner only.");return;}
  currentView="owner-group-list";
  showChatContext("Owner review: group conversations are visible here.");
  if(db){
    onSnapshot(collection(db,"groups"),snap=>{
      const rows=[];snap.forEach(d=>{const g=d.data();rows.push({
        name:g.name||d.id, subtitle:`${(g.members||[]).length} members`, badge:"Owner", owner:true, avatarName:g.name||"G",
        onclick:()=>openOwnerGroupConversation(d.id,g)
      });});renderSidebarItems(rows,"review");
    });
  }else{
    const rows=Object.entries(groups).map(([id,g])=>({
      name:g.name, subtitle:`${g.members?.length||0} members`, badge:"Owner", owner:true, avatarName:g.name,
      onclick:()=>openOwnerGroupConversation(id,g)
    }));renderSidebarItems(rows,"review");
  }
}
function openOwnerGroupConversation(id,g){
  currentView="owner-group-read"; activeGroupId=id; activePrivateChatId=null;
  setViewLabel(g.name||"Group","Owner review");
  showChatContext(`Owner review mode — ${(g.members||[]).join(", ")}`);
  if(db){
    const q=query(collection(db,"groups",id,"messages"),orderBy("createdAt","asc"),limit(1000));
    onSnapshot(q,s=>{const msgs=[];s.forEach(d=>msgs.push({id:d.id,...d.data()}));renderOwnerMessages(msgs);});
  }else renderOwnerMessages(g.messages||[]);
}
function renderOwnerMessages(messages){
  renderedMessages=messages;
  els.list.querySelectorAll(".msg-row,.review-message").forEach(n=>n.remove());
  messages.forEach(m=>{
    const box=document.createElement("div");box.className="review-message";
    const who=document.createElement("strong");who.textContent=m.sender||"Unknown";
    const body=document.createElement("div");body.className="review-text";
    body.textContent=m.text || (m.image?"[Photo]":m.audio?"[Voice message]":m.location?"[Location]":"");
    const t=document.createElement("time");t.textContent=formatTime(m.createdAt);
    box.appendChild(who);box.appendChild(body);box.appendChild(t);els.list.appendChild(box);
  });
  requestAnimationFrame(()=>els.list.scrollTop=els.list.scrollHeight);
}

function safeText(v){ return String(v ?? ""); }

function render(messages){
  renderedMessages = messages;
  els.list.querySelectorAll(".msg-row").forEach(n=>n.remove());
  messages.forEach((m, idx)=>{
    rememberUser(m.sender);
    const mine=m.sender===currentName;
    const row=document.createElement("div");
    row.className=`msg-row ${mine?"mine":"other"}`;

    const av=document.createElement(profilePhotos[m.sender] ? "img" : "div");
    av.className="msg-avatar";
    if(profilePhotos[m.sender]){ av.src=profilePhotos[m.sender]; av.alt=m.sender; av.style.objectFit="cover"; }
    else av.textContent=initials(m.sender);
    av.style.cursor="pointer";
    av.onclick=()=>openProfile(m.sender);

    const stack=document.createElement("div");
    stack.className="msg-stack";

    if(!mine){
      const nm=document.createElement("div"); nm.className="msg-name"; nm.textContent=m.sender||"Unknown";
      stack.appendChild(nm);
    }

    const bubble=document.createElement("div"); bubble.className="msg-bubble";
    if(m.image){
      bubble.style.padding="3px";
      const img=document.createElement("img"); img.className="image-message"; img.src=m.image; img.alt="Shared image";
      bubble.appendChild(img);
    }else if(m.location){
      const card=document.createElement("div"); card.className="location-card";
      const map=document.createElement("div"); map.className="map-preview"; map.textContent="📍";
      const link=document.createElement("a"); link.target="_blank"; link.rel="noopener";
      const {lat,lng}=m.location;
      link.href=`https://www.google.com/maps?q=${lat},${lng}`;
      link.textContent="Open in Google Maps";
      const coords=document.createElement("span"); coords.textContent=`${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
      card.appendChild(map); card.appendChild(link); card.appendChild(coords); bubble.appendChild(card);
    }else if(m.audio){
      bubble.style.padding="8px";
      const wrap=document.createElement("div"); wrap.className="voice-message";
      const audio=document.createElement("audio"); audio.controls=true; audio.preload="metadata"; audio.src=m.audio;
      wrap.appendChild(audio); bubble.appendChild(wrap);
    }else{
      bubble.textContent=safeText(m.text);
      if(m.edited){
        const ed=document.createElement("span"); ed.className="edited-label"; ed.textContent="edited";
        bubble.appendChild(ed);
      }
    }

    const meta=document.createElement("div"); meta.className="msg-time"; meta.textContent=formatTime(m.createdAt);

    stack.appendChild(bubble);
    stack.appendChild(meta);

    if(mine){
      const actions=document.createElement("div"); actions.className="msg-actions";
      if(!m.image){
        const edit=document.createElement("button"); edit.className="msg-action"; edit.type="button"; edit.textContent="Edit";
        edit.onclick=()=>editMessage(m);
        actions.appendChild(edit);
      }
      const del=document.createElement("button"); del.className="msg-action"; del.type="button"; del.textContent="Delete";
      del.onclick=()=>deleteMessage(m);
      actions.appendChild(del);
      stack.appendChild(actions);

      if(idx===messages.length-1){
        const seen=document.createElement("div"); seen.className="seen-label"; seen.textContent="Seen";
        stack.appendChild(seen);
      }
    }

    row.appendChild(av); row.appendChild(stack); els.list.appendChild(row);
  });
  const last=messages[messages.length-1];
  if(last) els.preview.textContent=`${last.sender}: ${last.image?"Photo":last.audio?"Voice message":last.location?"Location":last.text}`;
  refreshIdentityUI();
  requestAnimationFrame(()=>els.list.scrollTop=els.list.scrollHeight);
}

async function editMessage(m){
  const next=prompt("Edit message", m.text||"");
  if(next===null || !next.trim()) return;
  if(db && m.id){
    try{ await updateDoc(doc(db,"rooms",roomId,"messages",m.id),{text:next.trim(),edited:true}); }
    catch{ toast("Edit failed"); }
  }else{
    const i=localMessages.indexOf(m);
    if(i>=0){ localMessages[i].text=next.trim(); localMessages[i].edited=true; saveLocal(); render(localMessages); }
  }
}
async function deleteMessage(m){
  if(!confirm("Delete this message?")) return;
  if(db && m.id){
    try{ await deleteDoc(doc(db,"rooms",roomId,"messages",m.id)); }
    catch{ toast("Delete failed"); }
  }else{
    localMessages=localMessages.filter(x=>x!==m); saveLocal(); render(localMessages);
  }
}

function listenRealtime(){
  if(!db){ render(localMessages); toast("Demo mode — connect Firebase for realtime chat"); return; }
  const q=query(collection(db,"rooms",roomId,"messages"),orderBy("createdAt","asc"),limit(300));
  onSnapshot(q,snap=>{
    const msgs=[]; snap.forEach(d=>msgs.push({id:d.id,...d.data()}));
    render(msgs); markSeen(); watchTyping();
  },()=>toast("Check Firestore rules"));
}

function setAuthMode(mode){
  authMode=mode;
  const remembered=rememberedUsername();
  els.loginTab.classList.toggle("active",mode==="login");
  els.registerTab.classList.toggle("active",mode==="register");
  els.registerNameWrap.classList.toggle("hidden",mode!=="register");
  els.rememberedAccountWrap.classList.toggle("hidden",!(mode==="login" && remembered));
  els.loginUsernameWrap.classList.toggle("hidden",!(mode==="login" && !remembered));
  if(remembered) els.rememberedAccountName.textContent=remembered;
  els.start.textContent=mode==="register"?"Create Account":"Login";
  els.password.autocomplete=mode==="register"?"new-password":"current-password";
  els.password.value="";
  requestAnimationFrame(()=>{
    if(mode==="login"){
      if(remembered) els.password.focus();
      else els.loginUsername.focus();
    }else{
      els.displayName.focus();
    }
  });
}
els.loginTab?.addEventListener("click",()=>setAuthMode("login"));
els.registerTab?.addEventListener("click",()=>setAuthMode("register"));

async function finishOwnerGoogleLogin(user){
  if(!user) return false;
  const email=(user.email||"").toLowerCase();
  const uidAllowed = OWNER_UID !== "SET_YOUR_OWNER_FIREBASE_UID" && user.uid===OWNER_UID;
  const gmailAllowed = OWNER_GMAIL !== "SET_YOUR_OWNER_GMAIL" && email===OWNER_GMAIL.toLowerCase();

  if(!uidAllowed && !gmailAllowed){
    await signOut(auth);
    toast("ဒီ Google account ကို Owner အဖြစ် ခွင့်မပြုထားပါ။");
    return false;
  }

  currentUid=user.uid;
  currentName=user.displayName || "Owner";
  localStorage.setItem("niceChartUid",currentUid);
  localStorage.setItem("niceChartName",currentName);

  await setDoc(doc(db,"owners",currentUid),{
    uid:currentUid,
    displayName:currentName,
    email:user.email||"",
    photoURL:user.photoURL||"",
    online:true,
    lastSeen:serverTimestamp()
  },{merge:true});

  els.modal.classList.remove("show");
  refreshIdentityUI();
  refreshOwnerMenu();
  startCloudSync();
  listenRealtime();
  toast("Owner login successful");
  return true;
}

els.ownerGoogleLogin?.addEventListener("click",async()=>{
  if(!auth || !db){
    toast("Firebase is not configured.");
    return;
  }
  try{
    sessionStorage.setItem("niceChartOwnerLoginPending","1");
    const provider=new GoogleAuthProvider();
    provider.setCustomParameters({prompt:"select_account"});
    await signInWithRedirect(auth,provider);
  }catch(err){
    console.error(err);
    sessionStorage.removeItem("niceChartOwnerLoginPending");
    const code=err?.code||"";
    if(code.includes("unauthorized-domain")){
      toast("ဒီ Website domain ကို Firebase Authorized Domains ထဲထည့်ရန်လိုပါတယ်။");
    }else if(code.includes("operation-not-allowed")){
      toast("Firebase မှာ Google Sign-In ကို Enable လုပ်ရန်လိုပါတယ်။");
    }else{
      toast("Owner Google login failed.");
    }
  }
});

async function handleOwnerRedirectResult(){
  if(!auth || !db) return;
  try{
    const result=await getRedirectResult(auth);
    if(result?.user){
      const pending=sessionStorage.getItem("niceChartOwnerLoginPending")==="1";
      sessionStorage.removeItem("niceChartOwnerLoginPending");
      if(pending) await finishOwnerGoogleLogin(result.user);
    }
  }catch(err){
    console.error(err);
    sessionStorage.removeItem("niceChartOwnerLoginPending");
    const code=err?.code||"";
    if(code.includes("unauthorized-domain")){
      toast("ဒီ Website domain ကို Firebase Authorized Domains ထဲထည့်ရန်လိုပါတယ်။");
    }else if(code.includes("operation-not-allowed")){
      toast("Firebase မှာ Google Sign-In ကို Enable လုပ်ရန်လိုပါတယ်။");
    }else{
      toast("Owner Google login failed.");
    }
  }
}

els.switchAccount?.addEventListener("click",()=>{
  localStorage.removeItem("niceChartRememberedUsername");
  els.rememberedAccountWrap.classList.add("hidden");
  els.loginUsernameWrap.classList.remove("hidden");
  els.loginUsername.value="";
  els.loginUsername.focus();
});

els.start.addEventListener("click",async()=>{
  if(!isConfigured || !auth){
    toast("Firebase is not configured.");
    return;
  }

  const password=els.password.value;
  if(!password){toast("Enter password.");return;}

  try{
    if(authMode==="register"){
      const rawName=els.displayName.value.trim();
      const username=normalizeUsername(rawName);

      if(!username){toast("Choose a valid username.");return;}
      if(password.length<4){toast("Password must be at least 4 characters.");return;}

      // Registration is created server-side so the same password cannot be reused
      // by a different account. The raw password is never written to Firestore.
      const reg=await registerWithUniquePassword(username,rawName,password);

      // Immediately sign in after successful server-side registration.
      const internalEmail=usernameToInternalEmail(username);
      const cred=await signInWithEmailAndPassword(auth,internalEmail,password);

      currentUid=cred.user.uid;
      currentName=cred.user.displayName||rawName;
      setRememberedUsername(username);
      localStorage.setItem("niceChartUid",currentUid);
      localStorage.setItem("niceChartName",currentName);
      publishPresence(true);
    }else{
      const username=rememberedUsername() || normalizeUsername(els.loginUsername.value);
      if(!username){toast("Enter username.");return;}

      const internalEmail=usernameToInternalEmail(username);
      const cred=await signInWithEmailAndPassword(auth,internalEmail,password);

      currentUid=cred.user.uid;
      currentName=cred.user.displayName||username;
      setRememberedUsername(username);
      localStorage.setItem("niceChartUid",currentUid);
      localStorage.setItem("niceChartName",currentName);

      publishPresence(true);
    }

    // Open immediately after Firebase verifies the password.
    els.modal.classList.remove("show");
    els.password.value="";
    refreshIdentityUI();
    refreshOwnerMenu();
    startCloudSync();
    listenRealtime();
  }catch(err){
    const code=err?.code||"";
    if(code.includes("already-exists") || String(err?.message||"").includes("PASSWORD_ALREADY_USED")){
      toast("ဒီ Password ကို အသုံးမပြုနိုင်ပါ။ တခြား Password ရွေးပါ။");
    }else if(code.includes("invalid-credential") || code.includes("wrong-password")){
      toast("Password is incorrect.");
    }else if(code.includes("email-already-in-use")){
      toast("This username is already registered.");
    }else if(code.includes("user-not-found")){
      toast("Account not found.");
    }else{
      toast(code.replace("auth/","").replaceAll("-"," ") || "Login failed");
    }
  }
});
els.password?.addEventListener("keydown",e=>{if(e.key==="Enter")els.start.click()});
els.loginUsername?.addEventListener("keydown",e=>{if(e.key==="Enter")els.password.focus()});
els.displayName?.addEventListener("keydown",e=>{if(e.key==="Enter" && authMode==="register")els.start.click()});

els.demoLogin?.addEventListener("click",()=>{
  let name=els.displayName.value.trim() || prompt("Enter your name for local demo") || "";
  name=name.trim();
  if(!name) return;
  currentUid=name; currentName=name;
  localStorage.setItem("niceChartUid",currentUid);
  localStorage.setItem("niceChartName",currentName);
  if(!isConfigured && name.toLowerCase()==="owner"){ownerMode=true;localStorage.setItem("niceChartOwnerMode","true");}
  rememberUser(name,currentUid); savePeople();
  els.modal.classList.remove("show"); refreshIdentityUI(); refreshOwnerMenu(); listenRealtime();
});

els.form.addEventListener("submit",async e=>{
  e.preventDefault();
  const text=els.input.value.trim();
  if(!text) return;
  if(!currentName){els.modal.classList.add("show");return;}
  if(currentView.startsWith("owner-")){toast("Owner review is read only.");return;}
  els.input.value=""; autoGrow(); els.typing.textContent="";
  const payload={sender:currentName,senderUid:currentUid||currentName,text,createdAt:serverTimestamp()};
  try{ await sendCurrentMessage(payload); }
  catch{ els.input.value=text; toast("Message not sent"); }
});

function autoGrow(){
  els.input.style.height="auto";
  els.input.style.height=Math.min(120,els.input.scrollHeight)+"px";
}
els.input.addEventListener("input",()=>{
  autoGrow();
  const now=Date.now();
  if(now-lastTypingWrite>250){setTypingState(!!els.input.value.trim());lastTypingWrite=now;}
  clearTimeout(typingTimer);
  typingTimer=setTimeout(()=>setTypingState(false),900);
});
els.input.addEventListener("keydown",e=>{
  if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();els.form.requestSubmit();}
});
els.emoji.addEventListener("click",()=>{els.input.value+="😊";els.input.focus();autoGrow();});
els.info.addEventListener("click",()=>toast(`Signed in as ${currentName||"Guest"}`));

els.attach.addEventListener("click",(e)=>{
  e.stopPropagation();
  els.attachMenu.classList.toggle("show");
});
document.addEventListener("click",()=>els.attachMenu.classList.remove("show"));
els.attachMenu.addEventListener("click",e=>e.stopPropagation());
els.photoOption.addEventListener("click",()=>{
  els.attachMenu.classList.remove("show");
  els.file.click();
});
els.locationOption.addEventListener("click",()=>{
  els.attachMenu.classList.remove("show");
  if(!navigator.geolocation){toast("Location is not supported on this device.");return;}
  toast("Getting your location…");
  navigator.geolocation.getCurrentPosition(async pos=>{
    const location={lat:pos.coords.latitude,lng:pos.coords.longitude};
    if(!db){
      await sendCurrentMessage({sender:currentName,senderUid:currentUid||currentName,location,createdAt:serverTimestamp()});
    }else{
      try{
        await sendCurrentMessage({sender:currentName,senderUid:currentUid||currentName,location,createdAt:serverTimestamp()});
      }catch{toast("Location not sent.");}
    }
  },()=>toast("Location permission is required."),{enableHighAccuracy:true,timeout:12000});
});
els.file.addEventListener("change", async ()=>{
  const f=els.file.files?.[0];
  if(!f) return;
  try{
    const image=await compressImageFile(f,1280,0.82);
    let imageUrl=image;
    if(db && storage && currentUid){
      const path=`messages/${currentUid}/${Date.now()}.jpg`;
      imageUrl=await uploadDataUrlToStorage(image,path);
    }
    await sendCurrentMessage({sender:currentName,senderUid:currentUid||currentName,image:imageUrl,createdAt:serverTimestamp()});
  }catch{
    toast("Photo cannot be used.");
  }finally{els.file.value="";}
});

document.querySelectorAll(".room-tab").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".room-tab").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    if(btn.dataset.tab==="people") toast("People list will use registered users after Auth is connected.");
  });
});


async function blobToDataURL(blob){
  return await new Promise(resolve=>{
    const r=new FileReader();
    r.onload=()=>resolve(r.result);
    r.readAsDataURL(blob);
  });
}

els.mic.addEventListener("click", async ()=>{
  if(mediaRecorder && mediaRecorder.state==="recording"){
    mediaRecorder.stop();
    return;
  }
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    recordedChunks=[];
    const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "";
    mediaRecorder = new MediaRecorder(stream, mime ? {mimeType:mime} : undefined);
    mediaRecorder.ondataavailable=e=>{ if(e.data.size) recordedChunks.push(e.data); };
    mediaRecorder.onstop=async()=>{
      stream.getTracks().forEach(t=>t.stop());
      els.mic.classList.remove("recording");
      els.mic.textContent="🎤";
      const blob=new Blob(recordedChunks,{type:mediaRecorder.mimeType||"audio/webm"});
      if(blob.size>2_500_000){ toast("Voice message is too long for demo storage."); return; }
      const audio=await blobToDataURL(blob);
      let audioUrl=audio;
      if(db && storage && currentUid){
        const ext=(blob.type||"audio/webm").includes("mp4")?"m4a":"webm";
        audioUrl=await uploadFileToStorage(blob,`voice/${currentUid}/${Date.now()}.${ext}`);
      }
      await sendCurrentMessage({sender:currentName,senderUid:currentUid||currentName,audio:audioUrl,createdAt:serverTimestamp()});
    };
    mediaRecorder.start();
    els.mic.classList.add("recording");
    els.mic.textContent="■";
    toast("Recording voice… tap again to stop");
  }catch{
    toast("Microphone permission is required.");
  }
});

async function prepareLocalMedia(type){
  if(localStream) localStream.getTracks().forEach(t=>t.stop());
  const constraints = type==="video"
    ? {audio:true, video:{facingMode}}
    : {audio:true, video:false};
  localStream=await navigator.mediaDevices.getUserMedia(constraints);
  els.localVideo.srcObject=localStream;
  els.localVideo.style.display=type==="video"?"block":"none";
  els.remoteVideo.style.display=type==="video"?"block":"none";
  els.audioCallAvatar.style.display=type==="audio"?"flex":"none";
  return localStream;
}

function createPeer(){
  peerConnection=new RTCPeerConnection(rtcConfig);
  const remoteStream=new MediaStream();
  els.remoteVideo.srcObject=remoteStream;
  peerConnection.ontrack=e=>e.streams[0].getTracks().forEach(t=>remoteStream.addTrack(t));
  if(localStream) localStream.getTracks().forEach(t=>peerConnection.addTrack(t,localStream));
  return peerConnection;
}


async function answerIncomingCall(){
  const info=pendingIncomingCall;
  if(!info || !db) return;
  const {id,data}=info;
  currentCallType=data.type||"audio";
  activeCallId=id;
  try{
    await prepareLocalMedia(currentCallType);
    els.incomingCallModal.classList.remove("show");
    els.callModal.classList.add("show");
    els.callStatus.textContent="Connecting…";
    createPeer();

    const callRef=doc(db,"calls",id);
    const offerCandidates=collection(callRef,"offerCandidates");
    const answerCandidates=collection(callRef,"answerCandidates");

    peerConnection.onicecandidate=e=>{
      if(e.candidate) addFirestoreDoc(answerCandidates,e.candidate.toJSON());
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer=await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    await updateDoc(callRef,{
      calleeUid:currentUid,
      calleeName:currentName,
      status:"connected",
      answer:{type:answer.type,sdp:answer.sdp}
    });

    onSnapshot(offerCandidates,snap=>{
      snap.docChanges().forEach(change=>{
        if(change.type==="added") peerConnection.addIceCandidate(new RTCIceCandidate(change.doc.data())).catch(()=>{});
      });
    });
    onSnapshot(callRef,snap=>{
      const v=snap.data();
      if(v?.status==="ended" || v?.status==="declined") cleanupCall(false);
    });
    els.callStatus.textContent="Connected";
    pendingIncomingCall=null;
  }catch(e){
    console.error(e);toast("Could not answer call.");cleanupCall(false);
  }
}
async function declineIncomingCall(){
  if(pendingIncomingCall && db){
    try{await updateDoc(doc(db,"calls",pendingIncomingCall.id),{status:"declined",declinedAt:serverTimestamp()});}catch{}
  }
  pendingIncomingCall=null;
  els.incomingCallModal.classList.remove("show");
}
els.answerCall?.addEventListener("click",answerIncomingCall);
els.declineCall?.addEventListener("click",declineIncomingCall);

function listenIncomingCalls(){
  if(!db || !currentUid) return;
  onSnapshot(collection(db,"calls"),snap=>{
    snap.docChanges().forEach(change=>{
      if(change.type!=="added" && change.type!=="modified") return;
      const data=change.doc.data();
      if(data.status!=="ringing") return;
      if(data.callerUid===currentUid) return;
      if(data.targetUid && data.targetUid!==currentUid) return;
      pendingIncomingCall={id:change.doc.id,data};
      els.incomingCallerName.textContent=data.caller||"Incoming call";
      els.incomingCallerAvatar.textContent=initials(data.caller||"C");
      els.incomingCallType.textContent=(data.type==="video"?"Video":"Audio")+" call";
      els.incomingCallModal.classList.add("show");
      if(Notification.permission==="granted"){
        try{new Notification("Nice Chart",{body:`${data.caller||"Someone"} is calling you`});}catch{}
      }
    });
  });
}

async function startCall(type){
  currentCallType=type;
  try{
    await prepareLocalMedia(type);
    els.callModal.classList.add("show");
    els.callStatus.textContent="Calling…";
    createPeer();

    if(!db){
      els.callStatus.textContent="Demo call preview";
      toast("Camera/mic are working. Firebase is needed to connect another device.");
      return;
    }

    activeCallId=`general-${Date.now()}`;
    const callRef=doc(db,"calls",activeCallId);
    const offerCandidates=collection(callRef,"offerCandidates");
    const answerCandidates=collection(callRef,"answerCandidates");

    peerConnection.onicecandidate=e=>{
      if(e.candidate) addFirestoreDoc(offerCandidates,e.candidate.toJSON());
    };

    const offer=await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    const targetUser=normalizedKnownUsers().find(u=>u.displayName===activeChatLabel);
    await setDoc(callRef,{
      roomId,
      caller:currentName,
      callerUid:currentUid||currentName,
      targetUid:(currentView==="private" ? (targetUser?.uid||"") : ""),
      targetName:(currentView==="private" ? activeChatLabel : ""),
      type,
      status:"ringing",
      createdAt:serverTimestamp(),
      offer:{type:offer.type,sdp:offer.sdp}
    });

    onSnapshot(callRef, async snap=>{
      const data=snap.data();
      if(!data) return;
      if(data.answer && !peerConnection.currentRemoteDescription){
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        els.callStatus.textContent="Connected";
      }
      if(data.status==="declined"){toast("Call declined.");cleanupCall(false);}
      if(data.status==="ended") cleanupCall(false);
    });

    onSnapshot(answerCandidates, snap=>{
      snap.docChanges().forEach(change=>{
        if(change.type==="added"){
          peerConnection.addIceCandidate(new RTCIceCandidate(change.doc.data()));
        }
      });
    });

    toast("Call started. Another device needs an incoming-call listener to answer.");
  }catch(err){
    console.error(err);
    cleanupCall(false);
    toast("Camera or microphone permission was denied.");
  }
}

function cleanupCall(update=true){
  if(update && db && activeCallId){
    updateDoc(doc(db,"calls",activeCallId),{status:"ended"}).catch(()=>{});
  }
  if(peerConnection){peerConnection.close();peerConnection=null;}
  if(localStream){localStream.getTracks().forEach(t=>t.stop());localStream=null;}
  els.localVideo.srcObject=null; els.remoteVideo.srcObject=null;
  els.callModal.classList.remove("show");
  activeCallId=null;
}

els.audioCall.addEventListener("click",()=>startCall("audio"));
els.videoCall.addEventListener("click",()=>startCall("video"));
els.endCall.addEventListener("click",()=>cleanupCall(true));

els.toggleMic.addEventListener("click",()=>{
  const track=localStream?.getAudioTracks()[0]; if(!track)return;
  track.enabled=!track.enabled;
  els.toggleMic.classList.toggle("off",!track.enabled);
  els.toggleMic.textContent=track.enabled?"🎤":"🔇";
});
els.toggleCamera.addEventListener("click",()=>{
  const track=localStream?.getVideoTracks()[0]; if(!track)return;
  track.enabled=!track.enabled;
  els.toggleCamera.classList.toggle("off",!track.enabled);
});
els.switchCamera.addEventListener("click",async()=>{
  if(currentCallType!=="video") return;
  facingMode=facingMode==="user"?"environment":"user";
  try{
    const oldTrack=localStream?.getVideoTracks()[0];
    const newStream=await navigator.mediaDevices.getUserMedia({video:{facingMode},audio:false});
    const newTrack=newStream.getVideoTracks()[0];
    const sender=peerConnection?.getSenders().find(s=>s.track?.kind==="video");
    if(sender) await sender.replaceTrack(newTrack);
    if(oldTrack) oldTrack.stop();
    localStream.removeTrack(oldTrack);
    localStream.addTrack(newTrack);
    els.localVideo.srcObject=localStream;
  }catch{toast("Cannot switch camera on this device.");}
});



function openProfile(name){
  selectedProfileName = name || currentName || "Your Account";
  els.profileName.textContent = selectedProfileName;
  els.profileStatus.textContent = selectedProfileName===currentName ? "This is you" : "Active now";
  const photo = profilePhotos[selectedProfileName];
  if(photo){
    els.profilePhoto.src=photo; els.profilePhoto.style.display="block"; els.profileFallback.style.display="none";
  }else{
    els.profilePhoto.style.display="none"; els.profileFallback.style.display="grid"; els.profileFallback.textContent=initials(selectedProfileName);
  }
  const own = selectedProfileName===currentName;
  els.changePhoto.style.display = own ? "block" : "none";
  els.friendAction.style.display = own ? "none" : "block";
  if(!own){
    const fr=friendshipRecord(currentName,selectedProfileName);
    els.friendAction.textContent = fr?.status==="accepted" ? "Chat" : fr?.status==="pending" ? "Requested" : "Add Friend";
  }
  els.profileModal.classList.add("show");
}
els.headerProfile.addEventListener("click",()=>openProfile(currentName || "Your Account"));
els.roomProfile.addEventListener("click",()=>openProfile(currentName || "Your Account"));
els.closeProfile.addEventListener("click",()=>els.profileModal.classList.remove("show"));
els.changePhoto.addEventListener("click",()=>els.profilePhotoInput.click());
els.profilePhotoInput.addEventListener("change", async ()=>{
  const f=els.profilePhotoInput.files?.[0];
  if(!f) return;
  try{
    const compressed = await compressImageFile(f,720,0.82);
    const approxKb=Math.round(dataUrlToBlob(compressed).size/1024);
    let photoUrl=compressed;
    if(db && storage && currentUid){
      photoUrl=await uploadDataUrlToStorage(compressed,`profiles/${currentUid}/avatar.jpg`);
      await setDoc(doc(db,"users",currentUid),{photoURL:photoUrl,displayName:currentName,updatedAt:serverTimestamp()},{merge:true});
    }
    profilePhotos[currentName]=photoUrl; savePeople();
    openProfile(currentName); refreshIdentityUI();
    render(renderedMessages.length?renderedMessages:(db?[]:localMessages));
    toast(`Profile photo updated (${approxKb} KB)`);
  }catch{
    toast("Profile photo could not be processed.");
  }finally{els.profilePhotoInput.value="";}
});
els.friendAction.addEventListener("click",async()=>{
  if(!selectedProfileName || selectedProfileName===currentName) return;
  if(areFriends(currentName,selectedProfileName)){
    els.profileModal.classList.remove("show");
    openPrivateChat(selectedProfileName);
  }else{
    await sendFriendRequest(selectedProfileName);
    els.friendAction.textContent="Requested";
  }
});

document.querySelectorAll(".room-tab").forEach(btn=>{
  btn.addEventListener("click",()=>{
    if(btn.dataset.tab!=="people") return;
    const list=document.getElementById("roomList");
    list.innerHTML="";
    const names=[...new Set(knownUsers.filter(Boolean))];
    if(!names.length){
      const empty=document.createElement("div"); empty.style.padding="20px"; empty.style.color="#6b7280"; empty.textContent="No people yet";
      list.appendChild(empty); return;
    }
    names.forEach(name=>{
      const row=document.createElement("div"); row.className="user-row"; row.onclick=()=>openProfile(name);
      const av=document.createElement(profilePhotos[name]?"img":"div"); av.className="avatar";
      if(profilePhotos[name]){av.src=profilePhotos[name];av.style.objectFit="cover";} else {av.classList.add("blue");av.textContent=initials(name);}
      const meta=document.createElement("div"); meta.className="user-meta";
      const strong=document.createElement("strong"); strong.textContent=name;
      const span=document.createElement("span"); span.textContent=name===currentName?"You":(friends[name]?"Friend":"Tap to view profile");
      meta.appendChild(strong); meta.appendChild(span); row.appendChild(av); row.appendChild(meta); list.appendChild(row);
    });
  });
});



let cloudSyncStarted=false;
function startCloudSync(){
  if(!db || !currentUid || cloudSyncStarted) return;
  cloudSyncStarted=true;

  listenIncomingCalls();
  onSnapshot(collection(db,"users"),snap=>{
    const users=[];
    snap.forEach(d=>{
      const u={...d.data(),uid:d.id};
      if(u.role==="owner") return;
      if(OWNER_UID!=="SET_YOUR_OWNER_FIREBASE_UID" && u.uid===OWNER_UID) return;
      if(OWNER_GMAIL!=="SET_YOUR_OWNER_GMAIL" && (u.email||"").toLowerCase()===OWNER_GMAIL.toLowerCase()) return;
      users.push(u);
      if(u.displayName && u.photoURL) profilePhotos[u.displayName]=u.photoURL;
    });
    knownUsers=users;
    savePeople();
    if(currentView==="people") renderPeopleView();
  });

  onSnapshot(collection(db,"friendships"),snap=>{
    friendships={};
    let requests=0;
    snap.forEach(d=>{
      const f={id:d.id,...d.data()};
      if(f.users?.includes(currentUid) || f.userNames?.includes(currentName)){
        friendships[d.id]=f;
        if(f.status==="pending" && f.toUid===currentUid) requests++;
      }
    });
    savePeople();
    if(els.requestCountBadge){
      els.requestCountBadge.textContent=String(requests);
      els.requestCountBadge.classList.toggle("hidden",requests===0);
    }
    if(currentView==="friends") renderFriendList();
  });

  onSnapshot(collection(db,"groups"),snap=>{
    groups={};
    snap.forEach(d=>{
      const g={id:d.id,...d.data()};
      if(g.memberUids?.includes(currentUid) || isOwner()) groups[d.id]={...g,messages:[]};
    });
    savePeople();
    if(currentView==="groups") renderGroupList();
  });
}


els.enableNotifications?.addEventListener("click",async()=>{
  if(!("Notification" in window)){toast("Notifications are not supported.");return;}
  const p=await Notification.requestPermission();
  toast(p==="granted"?"Notifications enabled":"Notifications not enabled");
});
if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}

function closeMenu(){els.menuDrawer?.classList.remove("show");}
els.menuBtn?.addEventListener("click",()=>els.menuDrawer.classList.add("show"));
els.closeMenu?.addEventListener("click",closeMenu);
els.menuChats?.addEventListener("click",()=>{closeMenu();currentView="general";activePrivateChatId=null;activeGroupId=null;showChatContext("");setViewLabel(currentName||"Nice Chart","General chat");listenRealtime();});
els.menuPeople?.addEventListener("click",()=>{closeMenu();renderPeopleView();});
els.menuFriendList?.addEventListener("click",()=>{closeMenu();renderFriendList();});
els.menuFriendRequests?.addEventListener("click",()=>{closeMenu();renderIncomingRequests();els.incomingRequestsModal.classList.add("show");});
els.menuGroupChat?.addEventListener("click",()=>{
  closeMenu(); renderGroupList();
  if(getFriendsOf(currentName).length) setTimeout(()=>els.groupCreateModal.classList.add("show"),150);
  renderGroupMemberPicker();
});
els.ownerPrivateReview?.addEventListener("click",()=>{closeMenu();renderOwnerPrivateReview();});
els.ownerGroupReview?.addEventListener("click",()=>{closeMenu();renderOwnerGroupReview();});
els.closeFriendRequest?.addEventListener("click",()=>els.friendRequestModal.classList.remove("show"));
els.closeIncomingRequests?.addEventListener("click",()=>els.incomingRequestsModal.classList.remove("show"));
els.logout?.addEventListener("click",async()=>{
  try{await publishPresence(false);}catch{}
  if(auth) try{await signOut(auth);}catch{}
  currentUid="";currentName="";ownerMode=false;cloudSyncStarted=false;
  localStorage.removeItem("niceChartUid");localStorage.removeItem("niceChartName");localStorage.removeItem("niceChartOwnerMode");
  closeMenu();els.modal.classList.add("show");setAuthMode("login");refreshIdentityUI();refreshOwnerMenu();
});
els.closeGroupCreate?.addEventListener("click",()=>els.groupCreateModal.classList.remove("show"));

function renderGroupMemberPicker(){
  const friendsList=getFriendsOf(currentName);
  els.groupMemberPicker.innerHTML="";
  friendsList.forEach(name=>{
    const row=document.createElement("label");row.className="picker-person";
    const check=document.createElement("input");check.type="checkbox";check.value=name;check.className="group-member-check";
    const meta=document.createElement("div");meta.className="picker-meta";
    const strong=document.createElement("strong");strong.textContent=name;
    const span=document.createElement("span");span.textContent="Friend";
    meta.appendChild(strong);meta.appendChild(span);row.appendChild(check);row.appendChild(meta);els.groupMemberPicker.appendChild(row);
  });
}
els.createGroup?.addEventListener("click",async()=>{
  const name=els.groupNameInput.value.trim();
  const members=[...document.querySelectorAll(".group-member-check:checked")].map(x=>x.value);
  if(!name){toast("Enter a group name.");return;}
  if(!members.length){toast("Choose at least one friend.");return;}
  const all=[currentName,...members];
  const memberUids=all.map(n=>normalizedKnownUsers().find(u=>u.displayName===n)?.uid || (n===currentName?currentUid:n));
  const id=`group-${Date.now()}`;
  groups[id]={name,members:all,memberUids,createdBy:currentName,createdByUid:currentUid,messages:[]};savePeople();
  if(db){
    await setDoc(doc(db,"groups",id),{name,members:all,memberUids,createdBy:currentName,createdByUid:currentUid,createdAt:serverTimestamp()});
  }
  els.groupNameInput.value="";els.groupCreateModal.classList.remove("show");renderGroupList();openGroupChat(id);
});

function refreshOwnerMenu(){
  els.ownerMenuSection?.classList.toggle("hidden",!isOwner());
}
refreshOwnerMenu();

setAuthMode("login");
refreshIdentityUI();
handleOwnerRedirectResult();
if(auth){
  onAuthStateChanged(auth,async user=>{
    if(user){
      const pendingOwner=sessionStorage.getItem("niceChartOwnerLoginPending")==="1";
      if(pendingOwner) return;
      currentUid=user.uid;
      currentName=user.displayName||user.email?.split("@")[0]||"User";
      localStorage.setItem("niceChartUid",currentUid);
      localStorage.setItem("niceChartName",currentName);
      els.modal.classList.remove("show");
      refreshIdentityUI();refreshOwnerMenu();
      await publishPresence(true);
      startCloudSync();
      listenRealtime();
    }else if(!currentName){
      els.modal.classList.add("show");
    }
  });
}else{
  if(currentName) listenRealtime(); else render(localMessages);
}
