# 🧪 Test Client Birth Chart Workflow

## Quick Test Guide

### Prerequisites
- Server running: `npm run dev`
- Two browser windows/tabs (or incognito)
- Test credentials ready

---

## Test Scenario

### Browser 1: Client
```
Phone: 8000000001
OTP: 1234
Role: Client
```

### Browser 2: Astrologer
```
Phone: 9000000001
OTP: 1234
Role: Astrologer
```

---

## Step-by-Step Test

### Step 1: Login as Client (Browser 1)
1. Open http://localhost:3000
2. Enter phone: `8000000001`
3. Click "Get OTP"
4. Enter OTP: `1234`
5. Click "Verify"
6. ✅ You're logged in as Client

### Step 2: Login as Astrologer (Browser 2)
1. Open http://localhost:3000 (new tab/window)
2. Enter phone: `9000000001`
3. Click "Get OTP"
4. Enter OTP: `1234`
5. Click "Verify"
6. ✅ You're logged in as Astrologer

### Step 3: Client Sends Birth Chart (Browser 1)
1. You see astrologer list
2. Find "Astro Maveeran" card
3. Look for buttons at bottom:
   - 💬 Chat
   - ☎️ Call
   - 📹 Video
   - **🔮 Birth Chart** ← Click this

4. Modal opens: "📊 Send Your Birth Details"

### Step 4: Fill Birth Details (Browser 1)
Fill the form with:
```
Date of Birth: 15/5/1990
Time of Birth: 14:30
City/Place: Chennai, Tamil Nadu
Latitude: 13.0827
Longitude: 80.2707
Timezone: 5.5
```

### Step 5: Send to Astrologer (Browser 1)
1. Click "📧 Send to Astrologer" button
2. ✅ Alert: "Birth details sent to astrologer!"
3. Modal closes

### Step 6: Astrologer Receives (Browser 2)
1. ✅ Alert appears: "📊 Birth chart received from client!"
2. Shows:
   ```
   Date: 15/5/1990
   Time: 14:30
   Location: Chennai, Tamil Nadu
   ```

### Step 7: Astrologer Opens Chart (Browser 2)
1. Click "🔮 Birth Chart" button in astrologer dashboard
2. Modal opens
3. ✅ Form is AUTO-FILLED with:
   - Date: 15/5/1990
   - Time: 14:30
   - Latitude: 13.0827
   - Longitude: 80.2707
   - City: Chennai, Tamil Nadu

### Step 8: Generate Chart (Browser 2)
1. Click "Get Horoscope" button
2. Loading spinner appears: "Analyzing Planets..."
3. Wait 1-2 seconds
4. ✅ Chart displays with tabs:
   - Rasi Chart (D1)
   - Planets
   - Dasha

### Step 9: View Chart Details (Browser 2)
1. Click "Rasi Chart" tab
   - See South Indian chart format
   - Planets in houses
   - Ascendant marked

2. Click "Planets" tab
   - See planetary positions
   - Signs and degrees
   - Nakshatras

3. Click "Dasha" tab
   - See current periods
   - Vimshottari sequence

### Step 10: Share Chart (Browser 2)
1. Click green "Share" button
2. ✅ Message sent to chat
3. Alert: "Chart details shared in chat!"

---

## Expected Results

### ✅ Success Indicators

1. **Client Form Opens**
   - Modal appears with all fields
   - Default timezone: 5.5
   - Current date/time set

2. **Data Sends Successfully**
   - Confirmation alert appears
   - Modal closes
   - No errors in console

3. **Astrologer Receives**
   - Alert notification appears
   - Shows correct birth details
   - Data stored in memory

4. **Auto-fill Works**
   - All fields pre-populated
   - Correct values displayed
   - No manual entry needed

5. **Chart Generates**
   - Loading animation shows
   - API responds in 1-2 seconds
   - Chart displays correctly

6. **Share Works**
   - Message appears in chat
   - Contains birth details
   - Formatted with emojis

---

## Troubleshooting

### Issue: Birth Chart button not visible
**Solution:**
- Ensure you're logged in as Client
- Refresh the page
- Check browser console (F12)

### Issue: Modal doesn't open
**Solution:**
- Check browser console for errors
- Verify JavaScript is enabled
- Try refreshing page

### Issue: Data not sending
**Solution:**
- Fill all required fields
- Check internet connection
- Check server is running
- Look at Network tab (F12)

### Issue: Astrologer doesn't receive
**Solution:**
- Ensure astrologer is logged in
- Check both browsers are connected
- Look at server logs
- Check Socket.IO connection

### Issue: Form not auto-filling
**Solution:**
- Ensure data was received
- Check browser console
- Try clicking button again
- Refresh astrologer page

### Issue: Chart not generating
**Solution:**
- Check all fields are filled
- Verify coordinates are valid
- Check external API is accessible
- Look at Network tab (F12)

---

## Console Checks

### Browser Console (F12)
Look for:
- ✅ No red errors
- ✅ Socket connected message
- ✅ "Birth chart sent" message (server)
- ✅ "Received birth chart" message (astrologer)

### Server Console
Look for:
- ✅ "Birth chart sent from [client] to [astrologer]"
- ✅ No error messages
- ✅ Socket events logged

---

## Performance Metrics

| Step | Expected Time |
|------|---|
| Form open | <100ms |
| Data send | <100ms |
| Notification | <100ms |
| Auto-fill | <100ms |
| Chart generate | 1-2s |
| Total flow | 2-3s |

---

## Test Checklist

- [ ] Client can see Birth Chart button
- [ ] Modal opens with form
- [ ] Form has all fields
- [ ] Default values set correctly
- [ ] Can fill all fields
- [ ] Send button works
- [ ] Confirmation alert appears
- [ ] Astrologer receives notification
- [ ] Alert shows correct details
- [ ] Birth Chart button opens modal
- [ ] Form is auto-filled
- [ ] All values are correct
- [ ] Can generate chart
- [ ] Chart displays correctly
- [ ] Can view all tabs
- [ ] Share button works
- [ ] Message appears in chat

---

## Success Criteria

✅ All 17 checklist items pass
✅ No console errors
✅ No network errors
✅ Smooth user experience
✅ Data flows correctly
✅ Auto-fill works perfectly

---

**Ready to test! Follow the steps above to verify the complete workflow.** 🧪
