# Socket Connection Fix - "Not Register" Error

## 🔴 Problem Identified

**Error**: Call, Message, Video Call not working
**Root Cause**: Hardcoded `userId = "user123"` in all activities
**Impact**: Socket.io can't map user → activities fail

---

## 🔧 Fix Required

### **Issue in These Files:**
1. HomeActivity.java - Line ~37
2. ChatActivity.java - Line ~37
3. CallActivity.java - Line ~45
4. AstrologerActivity.java - Needs userId from Intent

### **Current Wrong Code:**
```java
private String myUserId = "user123"; // ❌ HARDCODED!
```

### **Correct Solution:**
```java
// Get from SharedPreferences (saved during OTP login)
private String myUserId;

@Override
protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Retrieve userId
    SharedPreferences prefs = getSharedPreferences("APP_PREFS", MODE_PRIVATE);
    myUserId = prefs.getString("USER_ID", "");

    if (myUserId.isEmpty()) {
        Toast.makeText(this, "Please login again", Toast.LENGTH_SHORT).show();
        finish();
        return;
    }

    // Continue with initialization...
}
```

---

## ✅ Complete Fix Implementation

### **Step 1: Save userId in OtpActivity** (After successful login)

**File**: `OtpActivity.java`

```java
if (response.isSuccessful() && response.body() != null) {
    if (response.body().isOk()) {
        LoginResponse user = response.body();

        // ✅ SAVE TO SHAREDPREFERENCES
        SharedPreferences prefs = getSharedPreferences("APP_PREFS", MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putString("USER_ID", user.getUserId());
        editor.putString("USER_NAME", user.getName());
        editor.putString("USER_ROLE", user.getRole());
        editor.putInt("WALLET_BALANCE", user.getWalletBalance());
        editor.apply();

        // Route based on role
        Intent intent;
        if ("astrologer".equals(user.getRole())) {
            intent = new Intent(this, AstrologerActivity.class);
            intent.putExtra("USER_ID", user.getUserId());
            intent.putExtra("USER_NAME", user.getName());
            intent.putExtra("TOTAL_EARNINGS", user.getTotalEarnings());
        } else {
            intent = new Intent(this, HomeActivity.class);
        }

        startActivity(intent);
        finish();
    }
}
```

---

### **Step 2: Fix HomeActivity**

**File**: `HomeActivity.java`

```java
public class HomeActivity extends AppCompatActivity {

    private String myUserId; // ❌ Remove = "user123"

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_home);

        // ✅ GET REAL USER ID
        SharedPreferences prefs = getSharedPreferences("APP_PREFS", MODE_PRIVATE);
        myUserId = prefs.getString("USER_ID", "");

        if (myUserId.isEmpty()) {
            Toast.makeText(this, "Please login again", Toast.LENGTH_SHORT).show();
            Intent intent = new Intent(this, LoginActivity.class);
            startActivity(intent);
            finish();
            return;
        }

        // Continue initialization...
        initSocket();
        fetchAstrologers();
    }
}
```

---

### **Step 3: Fix ChatActivity**

**File**: `ChatActivity.java`

```java
public class ChatActivity extends AppCompatActivity {

    private String myUserId; // ❌ Remove = "user123"

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_chat);

        // ✅ GET REAL USER ID
        SharedPreferences prefs = getSharedPreferences("APP_PREFS", MODE_PRIVATE);
        myUserId = prefs.getString("USER_ID", "");

        if (myUserId.isEmpty()) {
            Toast.makeText(this, "Session expired. Please login again", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        // Get partner from intent
        partnerId = getIntent().getStringExtra("PARTNER_ID");

        // Continue...
        initSocket();
    }
}
```

---

### **Step 4: Fix CallActivity**

**File**: `CallActivity.java`

```java
public class CallActivity extends AppCompatActivity {

    private String myUserId; // ❌ Remove = "user123"

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_call);

        // ✅ GET REAL USER ID
        SharedPreferences prefs = getSharedPreferences("APP_PREFS", MODE_PRIVATE);
        myUserId = prefs.getString("USER_ID", "");

        if (myUserId.isEmpty()) {
            Toast.makeText(this, "Session expired. Please login again", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        // Get call data from intent
        partnerId = getIntent().getStringExtra("PARTNER_ID");
        callType = getIntent().getStringExtra("CALL_TYPE");

        // Continue...
        initSocket();
        initWebRTC();
    }
}
```

---

### **Step 5: Fix AstrologerActivity**

**File**: `AstrologerActivity.java`

Already getting userId from Intent in `onCreate()`:
```java
userId = getIntent().getStringExtra("USER_ID"); // ✅ This is correct
```

This activity is OK!

---

## 🔍 Debug Checklist

### **Server Side (server.js)**
Check if register event is working:

```javascript
socket.on('register', async (data) => {
    const userId = data.userId;

    console.log(`✅ User registered: ${userId}`); // Add this log

    socketToUser.set(socket.id, userId);
    userSockets.set(userId, socket.id);

    // ... rest of code
});
```

### **Android Side - Test Steps**

1. **Login with real phone** → OTP verify
2. **Check Logcat**:
   ```
   D/HomeActivity: Socket connected
   D/HomeActivity: Registering userId: 62add4... ✅
   ```

3. **If "not register" still appears**:
   - Check server logs for register event
   - Verify userId is not empty
   - Confirm Socket.io connection

---

## 🚨 Quick Fix (Immediate Test)

**Temporary hardcoded fix for ONE device testing:**

In `HomeActivity.java`, `ChatActivity.java`, `CallActivity.java`:

```java
// TEMPORARY - Use actual userId from OTP response
private String myUserId = "62add4a1b2c3d4e5f6789012"; // ❌ Use real ID from Postman/server

// OR use phone number
private String myUserId = "9000000001"; // Your test phone
```

Then rebuild:
```bash
./gradlew assembleDebug
```

---

## ✅ Permanent Fix (Production)

Implement SharedPreferences as shown above in all 4 files.

---

## 📊 Files to Modify

| File | Change | Priority |
|------|--------|----------|
| OtpActivity.java | Add SharedPreferences save | HIGH |
| HomeActivity.java | Read userId from SharedPrefs | HIGH |
| ChatActivity.java | Read userId from SharedPrefs | HIGH |
| CallActivity.java | Read userId from SharedPrefs | HIGH |
| AstrologerActivity.java | Already correct ✅ | N/A |

---

## 🎯 Expected Result After Fix

```
✅ Login → userId saved
✅ Open chat → Socket register with real userId
✅ Send message → Server finds user socket
✅ Make call → WebRTC signaling works
✅ Video call → Remote video appears
```

---

**Shall I implement the fix now?** 🔧
