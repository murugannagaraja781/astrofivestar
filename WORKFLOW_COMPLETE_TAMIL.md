# Astro 5 Star - முழுமையான Workflow (அனைத்து படிகள்)

## மொத்த படிகள்: 70+ Steps

---

## **பகுதி 1: LOGIN செயல்முறை (படி 1-10)**

**படி 1:** பயனர் Browser-ல் https://astro5star.com திறக்கிறார்

**படி 2:** `index.html` file load ஆகிறது (7141 lines)

**படி 3:** `screen-login` காண்பிக்கப்படுகிறது (Phone Input + Send OTP Button)

**படி 4:** பயனர் Mobile Number உள்ளிடுகிறார் (9000000001)

**படி 5:** "Send OTP" Button Click → Frontend validation

**படி 6:** AJAX Call: `POST /api/send-otp` → server.js

**படி 7:** Server OTP Generate (1234) + Database save

**படி 8:** OTP User-க்கு அனுப்பப்படுகிறது (SMS/Console)

**படி 9:** பயனர் OTP உள்ளிடுகிறார் (1234)

**படி 10:** "Verify OTP" Button Click → Ready for verification

---

## **பகுதி 2: OTP VERIFICATION (படி 11-15)**

**படி 11:** AJAX Call: `POST /api/verify-otp`
```javascript
Body: { phone: "9000000001", otp: "1234" }
```

**படி 12:** Server Database-ல் OTP check
```javascript
otpStore[phone].otp === inputOtp
```

**படி 13:** User Details Return
```javascript
{
  userId: "62add4",
  name: "Thiru",
  role: "client",
  walletBalance: 967648
}
```

**படி 14:** Frontend localStorage save
```javascript
localStorage.setItem("userId", userId)
```

**படி 15:** Role-based Navigation
```javascript
if (role === "client") → screen-client
else if (role === "astrologer") → screen-astro
```

---

## **பகுதி 3: SOCKET CONNECTION (படி 16-20)**

**படி 16:** Socket.io library load

**படி 17:** Connection establish
```javascript
socket = io.connect("https://astro5star.com")
```

**படி 18:** User register event
```javascript
socket.emit("register", { userId })
```

**படி 19:** Server socket mapping
```javascript
socketToUser.set(socket.id, userId)
```

**படி 20:** Connection success → Console: "Connected"

---

## **பகுதி 4: CLIENT DASHBOARD (படி 21-30)**

**படி 21:** `screen-client` visible

**படி 22:** Header display (Name + Wallet balance)

**படி 23:** Filter tabs render (All, Love, Career...)

**படி 24:** `GET /api/astrologers` call

**படி 25:** Server MongoDB query
```javascript
User.find({ role: "astrologer" })
```

**படி 26:** Astrologers array response
```javascript
[
  {
    name: "Astro Maveeran",
    isOnline: true,
    isChatOnline: true,
    price: 700
  },
  ...
]
```

**படி 27:** Frontend loop - card creation

**படி 28:** Card elements render
```html
<div class="card">
  <h3>Astro Maveeran 🟢</h3>
  <p>₹700/min</p>
  <button>Chat</button>
</div>
```

**படி 29:** Cards append to list

**படி 30:** Loading complete → List visible

---

## **பகுதி 5: REAL-TIME UPDATES (படி 31-35)**

**படி 31:** Socket listener setup
```javascript
socket.on("astrologer-update", updateList)
```

**படி 32:** Astrologer toggles Chat status
```javascript
socket.emit("toggle-status", { type: "chat", online: true })
```

**படி 33:** Server database update
```javascript
user.isChatOnline = true
user.save()
```

**படி 34:** Broadcast to all clients
```javascript
socket.broadcast.emit("astrologer-update", astrologers)
```

**படி 35:** Client receives update → Green dot appears 🟢

---

## **பகுதி 6: CHAT SESSION START (படி 36-45)**

**படி 36:** Client "Chat" button click

**படி 37:** Birth chart screen check (first time only)

**படி 38:** Birth details form (DOB, TOB, POB)

**படி 39:** Form submit → `POST /api/user/birth-details`

**படி 40:** Birth details database save

**படி 41:** Payment screen redirect

**படி 42:** PhonePe gateway open → User pays ₹700

**படி 43:** Payment callback → `POST /phonepe-webhook`

**படி 44:** Wallet deduct + transaction save

**படி 45:** Navigate to `screen-session` (chat mode)

---

## **பகுதி 7: CHAT REQUEST FLOW (படி 46-50)**

**படி 46:** Client socket emit
```javascript
socket.emit("request-session", {
  partnerId: "maveeran123",
  type: "chat"
})
```

**படி 47:** Server forward to astrologer
```javascript
io.to(astrologerSocket).emit("incoming-session", data)
```

**படி 48:** Astrologer `screen-incoming` popup

**படி 49:** Astrologer "Accept" click
```javascript
socket.emit("answer-session", { partnerId })
```

**படி 50:** Both sides session start
```javascript
socket.on("session-answered") → startTimer()
```

---

## **பகுதி 8: MESSAGE EXCHANGE (படி 51-55)**

**படி 51:** Client types "Hello" + Send click

**படி 52:** Socket emit
```javascript
socket.emit("chat-message", {
  to: "maveeran123",
  message: "Hello"
})
```

**படி 53:** Server forward
```javascript
io.to(astrologerSocket).emit("chat-message", data)
```

**படி 54:** Database save
```javascript
ChatDetails.create({
  from: clientId,
  to: astroId,
  message: "Hello"
})
```

**படி 55:** Astrologer side message display

---

## **பகுதி 9: AUDIO CALL (படி 56-60)**

**படி 56:** Client clicks "Call" button

**படி 57:** `CallActivity` opens (Android)
```java
Intent intent = new Intent(this, CallActivity.class);
intent.putExtra("PARTNER_ID", astrologerId);
intent.putExtra("CALL_TYPE", "audio");
```

**படி 58:** WebRTC initialize
```java
webRTCClient = new WebRTCClient(this, this);
webRTCClient.createPeerConnection();
webRTCClient.createAudioTrack();
```

**படி 59:** Create SDP Offer
```java
webRTCClient.createOffer();
// Callback → onLocalDescription()
```

**படி 60:** Send offer via Socket
```javascript
socket.emit("webrtc-offer", {
  partnerId: astroId,
  sdp: offer.description
})
```

---

## **பகுதி 10: WEBRTC SIGNALING (படி 61-65)**

**படி 61:** Server relays offer
```javascript
io.to(astrologerSocket).emit("webrtc-offer", data)
```

**படி 62:** Astrologer receives offer
```java
socket.on("webrtc-offer") → {
  webRTCClient.setRemoteDescription(sdp);
  webRTCClient.createAnswer();
}
```

**படி 63:** Answer sent back
```javascript
socket.emit("webrtc-answer", { sdp })
```

**படி 64:** ICE candidates exchange
```javascript
socket.emit("webrtc-ice-candidate", {
  candidate: iceCandidate.sdp,
  sdpMid: iceCandidate.sdpMid
})
```

**படி 65:** P2P connection established
```
Client ↔ Direct Audio Stream ↔ Astrologer
```

---

## **பகுதி 11: VIDEO CALL (படி 66-70)**

**படி 66:** Client clicks "Video" button
```java
intent.putExtra("CALL_TYPE", "video");
```

**படி 67:** Camera permission request
```java
ActivityCompat.requestPermissions(this,
  new String[]{Manifest.permission.CAMERA})
```

**படி 68:** Video track creation
```java
webRTCClient.createVideoTrack(localVideoView);
```

**படி 69:** Local video preview
```java
localVideoView.setVisibility(View.VISIBLE);
// Small preview top-right corner
```

**படி 70:** Remote video stream
```java
onAddRemoteStream(stream) → {
  stream.videoTracks.get(0).addSink(remoteVideoView);
  remoteVideoView.setVisibility(View.VISIBLE);
}
```

---

## **கூடுதல் செயல்பாடுகள்**

### **Wallet Recharge (படி 71-75)**

**படி 71:** Client clicks "Add Money"

**படி 72:** Amount input (₹500)

**படி 73:** `POST /create-payment-order`

**படி 74:** PhonePe redirect → Payment

**படி 75:** Webhook → Wallet update
```javascript
user.walletBalance += amount
Transaction.create({ type: "credit", amount })
```

---

### **Astrologer Dashboard (படி 76-80)**

**படி 76:** Astrologer login → `screen-astro`

**படி 77:** Dashboard display (Earnings, Toggles)

**படி 78:** Toggle Chat ON
```javascript
socket.emit("toggle-status", { type: "chat", online: true })
```

**படி 79:** Server update + broadcast
```javascript
user.isChatOnline = true
broadcastAstroUpdate()
```

**படி 80:** All clients see green dot 🟢

---

## **முக்கிய Events சுருக்கம்**

### **Socket Events:**

| Event | திசை | விவரம் |
|-------|------|--------|
| `register` | Client → Server | User connection |
| `toggle-status` | Astrologer → Server | Status மாற்றம் |
| `astrologer-update` | Server → Clients | List refresh |
| `request-session` | Client → Server | Session start |
| `answer-session` | Astrologer → Server | Accept/Reject |
| `chat-message` | Both ↔ Server | Text messaging |
| `webrtc-offer` | Client → Astrologer | SDP Offer |
| `webrtc-answer` | Astrologer → Client | SDP Answer |
| `webrtc-ice-candidate` | Both ↔ Both | ICE exchange |
| `end-session` | Both → Server | Call end |

---

## **Database Operations:**

### **Collections:**

1. **Users**
   - Login/OTP verification
   - Profile updates
   - Wallet transactions
   - Online status

2. **ChatDetails**
   - Message storage
   - Timestamp
   - Read status

3. **Transactions**
   - Payment history
   - Wallet credits/debits
   - Session charges

---

## **Technology Stack:**

### **Frontend:**
- HTML + CSS + JavaScript
- jQuery (AJAX, DOM)
- Socket.io Client
- WebRTC API

### **Backend:**
- Node.js + Express
- Socket.io Server
- MongoDB + Mongoose
- PhonePe Payment Gateway

### **Android:**
- Java
- WebRTC (io.github.webrtc-sdk)
- Socket.io Client Android
- Retrofit (REST API)
- RecyclerView (Lists)

---

## **முழுமையான Flow Diagram:**

```
User Login
    ↓
OTP Verify
    ↓
Socket Connect
    ↓
Dashboard Load
    ↓
[Client Path]              [Astrologer Path]
    ↓                           ↓
Select Astrologer         Toggle Online Status
    ↓                           ↓
Request Session    ←→    Accept Session
    ↓                           ↓
[Chat/Call/Video]  ←→    [Chat/Call/Video]
    ↓                           ↓
Payment Deduct             Earnings Credit
    ↓                           ↓
End Session       ←→     End Session
    ↓                           ↓
Return Dashboard         Return Dashboard
```

---

## **மொத்த செயல்பாடுகள்: 80+ படிகள்**

இந்த workflow-ல் உள்ளவை:
- ✅ Login + OTP (10 படிகள்)
- ✅ Socket Connection (10 படிகள்)
- ✅ Dashboard (20 படிகள்)
- ✅ Chat Session (20 படிகள்)
- ✅ WebRTC Calls (20 படிகள்)
- ✅ Payment (10 படிகள்)

**Final Status: Complete! 🚀**
