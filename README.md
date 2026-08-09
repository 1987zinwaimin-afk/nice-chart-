# Nice Chart — Messenger-style Website Chat

This project is designed for **GitHub + Vercel Auto Deploy**, so you do not need to upload a ZIP every time.

## What is included
- Messenger-style responsive UI
- iPhone/mobile friendly
- Realtime chat ready with Firebase Firestore
- Username entry
- Local demo mode before Firebase is connected
- GitHub/Vercel-ready static project

## One-time setup

### 1. Firebase
Create a Firebase project:
- Firebase Console → Create project
- Build → Firestore Database → Create database
- Project Settings → Your apps → Web app
- Copy the Firebase config

Open `app.js` and replace:

```js
const firebaseConfig = {
  apiKey: "PASTE_FIREBASE_API_KEY",
  authDomain: "PASTE_PROJECT.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_PROJECT.firebasestorage.app",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID"
};
```

### 2. Firestore rules for initial testing

Use this only for early testing:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId}/messages/{messageId} {
      allow read, create: if true;
    }
  }
}
```

For a public production app, add Authentication and stricter rules.

### 3. GitHub
- Create a new GitHub repository
- Upload `index.html`, `style.css`, `app.js`
- Commit changes

### 4. Vercel
- New Project
- Import your GitHub repository
- Framework Preset: Other
- Build command: leave empty
- Output directory: leave empty
- Deploy

After that:
**Edit / commit code in GitHub → Vercel automatically redeploys the website.**
No repeated ZIP deployment is needed.

## Recommended next upgrades
- Google/phone login
- Profile photos
- Private 1-to-1 chat
- Multiple chat rooms
- Online/offline indicator
- Seen/read receipts
- Typing indicator
- Image/file messages
- Voice messages
- Message edit/delete
- Push notifications
- Admin panel


## Added in this version
- Nice Chart branding
- Messenger-like online indicator
- Seen label
- Typing indicator UI
- Edit/delete own messages
- Image preview in demo/local mode
- Chats / People tabs
- Improved mobile layout

## Nice Chart v3
- Audio call button with WebRTC microphone access
- Video call button with camera + microphone access
- In-call mute, camera on/off, switch camera, end call controls
- Voice message recorder using MediaRecorder
- Local demo playback for voice messages
- Firebase Firestore signaling scaffold for WebRTC calls

### Important
For real calls between two different devices, the next production step is:
1. Firebase Authentication or a user identity system
2. Incoming-call listener + Answer/Decline screen
3. Firebase Storage for voice messages/photos
4. TURN server for reliable calls on mobile networks and restrictive Wi-Fi
5. HTTPS hosting (Vercel provides HTTPS)

## Nice Chart v4
- Plus menu now opens Photo / Location options
- Location messages use browser geolocation and open directly in Google Maps
- User profile modal
- Users can upload/change their own profile photo
- Message avatars open the sender profile
- Add Friend button changes to Chat after adding
- People tab lists discovered users in local/demo mode

### Production note
For real multi-device friend relationships and profile photos, connect:
- Firebase Authentication
- Firestore users/friends collections
- Firebase Storage for profile photos and message photos/voice files


## Nice Chart v4.1 fixes
- Header/profile area now shows the signed-in account name instead of the Nice Chart label.
- Profile photo upload now auto-compresses large images before saving.
- Message photo upload also compresses images for easier demo/local storage.


## Nice Chart v5 — Friends, Private Chat, Groups, Owner Review

Added:
- Realtime user discovery scaffold using Firestore `users`
- Add Friend / Chat behavior
- One-to-one private chat per friend pair
- Group creation from the Friend List
- Group chat per group
- Menu → Friendship → Friend List / Group Chat
- Owner Review → Private Chats / Group Chats
- Each private conversation appears as its own page/item labeled with both participant names
- Each group appears as its own page/item labeled with the group name
- Owner review is read-only in the UI
- Users can continue using their private/group chats normally

### Production security requirement

The current demo still supports display-name login. That is not secure enough for an owner-only review panel.

For production:
1. Enable Firebase Authentication.
2. Give every user a stable Firebase UID.
3. Replace the demo `ownerMode` logic with:
   `firebaseAuth.currentUser.uid === OWNER_UID`
4. Set `OWNER_UID` in `app.js`.
5. Add Firestore Security Rules so only:
   - private chat participants can read/write their conversation
   - group members can read/write their group
   - the Owner UID can additionally read all private/group conversations
6. Keep the owner-review disclosure visible so users know the app owner can review messages.

Suggested Firestore structure:
- `users/{uid}`
- `friendships/{friendshipId}`
- `privateChats/{chatId}`
- `privateChats/{chatId}/messages/{messageId}`
- `groups/{groupId}`
- `groups/{groupId}/messages/{messageId}`

### Demo owner mode
For local/demo testing only, signing in with the display name `Owner` shows Owner Review.
Do not rely on that for a real deployment.


## Nice Chart v6 — Firebase Accounts + Friend Requests + Secure Chat Structure

New in v6:
- Firebase Email/Password Register + Login UI
- Stable Firebase UID per user
- Cross-device user list from `users`
- Online presence flag
- Friend Request → Accept / Decline
- Friend Requests menu with unread count
- Private chats only after friendship is accepted
- Group member UIDs saved for security
- Logout
- Owner detection by Firebase UID
- `firestore.rules` included

### Required Firebase setup

1. Firebase Console → Authentication → Sign-in method → enable **Email/Password**.
2. Firestore Database → create database.
3. Put your Firebase Web config inside `app.js`.
4. Create the Owner account once.
5. Firebase Console → Authentication → Users → copy the Owner UID.
6. In `app.js`, replace:
   `SET_YOUR_OWNER_FIREBASE_UID`
   with that UID.
7. In `firestore.rules`, replace:
   `REPLACE_WITH_OWNER_UID`
   with the same UID.
8. Publish the Firestore rules.

### Important privacy behavior

With the supplied security design:
- normal users can read their own private chats
- group members can read their own groups
- the configured Owner UID can additionally review all private/group conversations
- the login screen tells users that owner review may be enabled

### Still recommended next
- Firebase Storage for profile photos, image messages, and voice files
- FCM / Web Push notifications
- incoming audio/video call screen and call answering
- typing/seen status stored in Firestore instead of local-only demo behavior


## Nice Chart v7 — Storage Sync, Incoming Calls, Typing & Seen

Added:
- Firebase Storage integration
  - profile photos sync between devices
  - photo messages sync between devices
  - voice messages sync between devices
- Incoming Audio / Video call screen
- Answer / Decline
- WebRTC answer-side signaling
- Call notifications when the website is open
- Firestore realtime typing state
- Firestore seen/presence records
- `sw.js` service worker scaffold
- `storage.rules`

### Firebase steps for v7

In addition to v6 setup:

1. Firebase Console → Storage → Get started.
2. Publish `storage.rules`.
3. Keep Firestore rules updated with the included `firestore.rules`.
4. Host on HTTPS (Vercel is fine).
5. On iPhone/Android, allow Camera, Microphone, Location, and Notifications when requested.

### Push notifications when the app is fully closed

The included service worker is notification-ready, but true remote push while the site is fully closed still needs:
- Firebase Cloud Messaging (FCM)
- a VAPID key
- a trusted server / Cloud Function to send push notifications

### Reliable calls on all networks

WebRTC currently uses public STUN servers. For reliable production calling across carrier networks/restricted Wi-Fi, add a TURN server.

## Firebase connected build
This build already includes the Firebase Web App config for:
- projectId: bubble-chat-b6aed
- authDomain: bubble-chat-b6aed.firebaseapp.com

You still need to enable these Firebase products in the Firebase Console:
1. Authentication → Sign-in method → Email/Password
2. Firestore Database
3. Storage
4. Publish included firestore.rules
5. Publish included storage.rules

For secure Owner Review, replace SET_YOUR_OWNER_FIREBASE_UID in app.js and
REPLACE_WITH_OWNER_UID in firestore.rules with the actual Firebase Authentication UID of the owner account.


## Nice Chart v7.2 — Username + Password Only

Changes:
- Register UI no longer asks users for an email address.
- Users register with Username + Password.
- Internally, Firebase Email/Password Auth still uses a generated private login identifier:
  `username@nicechart.local`
  so the user never has to enter or manage an email.
- After registration/login, the device remembers the username.
- Future login screen asks for Password only.
- "Switch" lets a different account enter its username on the device.
- No artificial login animation or delay is added.
- Firebase still securely verifies the password before the app opens.

Important:
- Exact 0.08-second login cannot be guaranteed because Firebase authentication requires a network round trip.
- Do not bypass Firebase verification for speed; doing so would let incorrect passwords enter the app.

## Nice Chart v7.3 — Login UI hard fix
- Email input removed from index.html.
- Register displays Username + Password only.
- After successful registration/login, username is remembered on that device.
- Returning login displays the remembered account and asks for Password only.
- Switch allows a different username to be entered.
- Firebase still uses an internal generated identifier behind the scenes.


## Nice Chart v7.4 — No duplicate passwords

Registration now checks password reuse through a Firebase Cloud Function.

Behavior:
- If another account already registered with the same password, registration is rejected.
- Example: if one account used `0000`, another account cannot register with `0000`.
- The UI shows:
  `ဒီ Password ကို အသုံးပြုပြီးသားဖြစ်ပါတယ်။ တခြား Password ရွေးပါ။`
- Raw passwords are NOT stored in Firestore.
- The server stores only an HMAC-SHA256 fingerprint keyed with a secret `PASSWORD_PEPPER`.
- Client users cannot read the password fingerprint collection.

### One-time Cloud Functions setup

From the Firebase project folder:

1. Install Firebase CLI and log in.
2. Set a secret:
   `firebase functions:secrets:set PASSWORD_PEPPER`
   Enter a long random secret when prompted.
3. Inside `functions/`, run:
   `npm install`
4. Deploy:
   `firebase deploy --only functions,firestore:rules`

The web app already calls the callable function `registerUsername`.

Important:
This requires Firebase Cloud Functions. A purely static browser-only implementation would expose the password-reuse check and would be much less secure.


## Nice Chart v7.5 — Owner Google Login + Hidden Owner Data

Changes:
- Owner signs in with Google/Gmail using a separate **Owner Login with Google** button.
- Normal users continue to use Username + Password.
- Owner profile/presence is stored under `owners/{ownerUid}`, not `users/{uid}`.
- Normal users only load the `users` collection, so the Owner does not appear in:
  - People
  - Friend search
  - Friend List
  - Add Friend
- Owner still receives Owner Review access for private/group conversations.
- Duplicate-password rejection now uses generic wording:
  `ဒီ Password ကို အသုံးမပြုနိုင်ပါ။ တခြား Password ရွေးပါ။`
  It no longer reveals that another account is already using that password.

### Required one-time Owner setup

1. Firebase Console → Authentication → Sign-in method → enable **Google**.
2. Sign in once with the Gmail account you want to use as Owner.
3. Firebase Console → Authentication → Users → copy that Google account's UID.
4. In `app.js` replace:
   - `SET_YOUR_OWNER_FIREBASE_UID`
   - `SET_YOUR_OWNER_GMAIL`
5. In `firestore.rules` replace:
   - `REPLACE_WITH_OWNER_UID`
6. Publish `firestore.rules`.

The UID check in Firestore rules is the real security boundary. The Gmail check in the UI is only a convenience check.


## Nice Chart v7.6 — iPhone Owner Google Login Fix

- Owner Google login changed from popup to Firebase redirect flow for better iPhone/Safari compatibility.
- Redirect result is handled automatically when the user returns to the site.
- Clear messages are shown for:
  - unauthorized domain
  - Google provider not enabled
- Removed the registration password-note line under the Password field.

### Required Firebase console checks

1. Authentication → Sign-in method → Google → Enable.
2. Authentication → Settings → Authorized domains.
3. Add the exact Vercel hostname used by Nice Chart, for example:
   `your-site.vercel.app`
4. Set Owner UID and Owner Gmail in app.js.
5. Put the same Owner UID in firestore.rules.
