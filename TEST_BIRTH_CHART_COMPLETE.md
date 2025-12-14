# Complete Birth Chart Flow Test Guide

## Setup
- Open two browser windows/tabs
- One for Client, one for Astrologer
- Both logged in to the application

## Test Scenario

### Step 1: Client Initiates Chat with Birth Details

1. **Client side:**
   - Navigate to astrologer list
   - Find an astrologer
   - Click the Chat button (💬)
   - Birth Chart form popup should open
   - Fill in the form:
     - Date: 1990-05-15
     - Time: 14:30
     - City: Chennai, Tamil Nadu
     - Latitude: 13.0827
     - Longitude: 80.2707
     - Timezone: 5.5
   - Click "Start Chat with Birth Details"

2. **Check Client Console (F12 → Console):**
   - Should see: `request-session` event with birthData
   - Should see birthData object with all fields

### Step 2: Astrologer Receives Chat Request

1. **Astrologer side:**
   - Should see incoming chat request notification
   - Should see "Chat Request" popup with client info

2. **Check Astrologer Console (F12 → Console):**
   - Should see: `Incoming session received: {data}`
   - Should see: `Incoming session birthData: {birthData}`
   - Should see the complete birthData object (NOT undefined)

### Step 3: Astrologer Accepts Chat

1. **Astrologer side:**
   - Click "Accept" button
   - Chat window should open
   - Should see client details header at top:
     - 📅 DOB: 15/5/1990
     - ⏰ Time: 14:30
     - 📍 Location: Chennai, Tamil Nadu
     - 🌍 Coordinates: 13.0827°N, 80.2707°E
   - Should see Birth Chart button (🔮) in chat input area

2. **Check Astrologer Console (F12 → Console):**
   - Should see: `initSession called with birthData: {birthData}`
   - Should see: `Birth data stored in initSession: {birthData}`
   - Should see: `Displaying client details with birth data: {birthData}`

### Step 4: Astrologer Clicks Birth Chart Button

1. **Astrologer side:**
   - Click the Birth Chart button (🔮) in chat input area
   - Birth Chart form should open
   - Form should be auto-filled with client's birth details:
     - Date: 1990-05-15
     - Time: 14:30
     - Latitude: 13.0827
     - Longitude: 80.2707
     - City: Chennai, Tamil Nadu
   - NO alert should appear

2. **Check Astrologer Console (F12 → Console):**
   - Should see: `Birth data available: {birthData}`
   - Should see: `Opening chart with birth data: {birthData}`
   - Should NOT see: "No birth details received from client yet" alert

### Step 5: Astrologer Fetches Birth Chart

1. **Astrologer side:**
   - Click "Get Chart" button
   - Should see loading spinner
   - Birth chart should display with:
     - Rasi Chart (D1)
     - Navamsa Chart (D9)
     - Planets
     - Dasha
     - Panchangam

## Expected Results

✅ Client details header displays correctly
✅ Birth Chart button is visible
✅ Birth Chart button opens form with auto-filled data
✅ No "No birth details received" alert appears
✅ Birth chart displays correctly

## Troubleshooting

### If Birth Chart button doesn't appear:
- Check console for: `Displaying client details with birth data`
- If not present, birthData is not being received
- Check if `Incoming session birthData: undefined` in console

### If Birth Chart button appears but shows alert:
- Check console for: `Birth data available: undefined`
- This means data was lost between accepting chat and clicking button
- Check if `Birth data stored in initSession` was logged

### If form doesn't auto-fill:
- Check console for: `Opening chart with birth data`
- If present, check if form field IDs match:
  - chartDate, chartTime, chartLat, chartLon, citySearch

## Console Debug Checklist

- [ ] Client sends birthData in request-session
- [ ] Server receives request-session with birthData
- [ ] Astrologer receives incoming-session with birthData
- [ ] Astrologer's incoming-session handler logs birthData
- [ ] Astrologer accepts chat
- [ ] initSession is called with birthData parameter
- [ ] window.receivedBirthData is set
- [ ] Client details header displays
- [ ] Birth Chart button is visible
- [ ] Astrologer clicks Birth Chart button
- [ ] showChartHelperWithData logs birthData (not undefined)
- [ ] Form auto-fills with birth details
- [ ] Birth chart displays correctly
