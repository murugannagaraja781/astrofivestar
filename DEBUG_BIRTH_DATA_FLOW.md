# Debug Birth Data Flow

## Issue
Astrologer sees "Birth data available: undefined" when clicking Birth Chart button, indicating birthData is not being received.

## Debug Steps

### Step 1: Check Client Side (Browser Console)
When client sends birth details:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Client clicks Chat button → Birth Chart form opens
4. Client fills in birth details
5. Client clicks "Start Chat with Birth Details"
6. Look for console logs:
   - Should see: `request-session` event being emitted with birthData
   - Check if birthData object is properly formatted

### Step 2: Check Server Side (Terminal)
1. Look at server logs for `request-session` event
2. Should see: `Session request: [sessionId] (chat)`
3. Check if server is receiving birthData in the request

### Step 3: Check Astrologer Side (Browser Console)
When astrologer receives chat request:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Astrologer should see incoming chat request
4. Look for console logs:
   - `Incoming session received: {data}`
   - `Incoming session birthData: {birthData}`
   - Should show the birthData object, NOT undefined

5. Astrologer clicks Accept
6. Look for console logs:
   - `initSession called with birthData: {birthData}`
   - `Birth data stored in initSession: {birthData}`

7. Astrologer clicks Birth Chart button (🔮)
8. Look for console logs:
   - `Birth data available: {birthData}`
   - Should show the birthData object, NOT undefined

## Expected Console Output

### Client Side (when sending):
```
request-session event with:
{
  toUserId: "astro-id",
  type: "chat",
  birthData: {
    year: 1990,
    month: 5,
    day: 15,
    hour: 14,
    minute: 30,
    latitude: 13.0827,
    longitude: 80.2707,
    timezone: 5.5,
    city: "Chennai"
  }
}
```

### Astrologer Side (when receiving):
```
Incoming session received: {
  sessionId: "...",
  fromUserId: "...",
  type: "chat",
  birthData: {
    year: 1990,
    month: 5,
    day: 15,
    hour: 14,
    minute: 30,
    latitude: 13.0827,
    longitude: 80.2707,
    timezone: 5.5,
    city: "Chennai"
  }
}

Incoming session birthData: {
  year: 1990,
  month: 5,
  day: 15,
  hour: 14,
  minute: 30,
  latitude: 13.0827,
  longitude: 80.2707,
  timezone: 5.5,
  city: "Chennai"
}

initSession called with birthData: {
  year: 1990,
  month: 5,
  day: 15,
  hour: 14,
  minute: 30,
  latitude: 13.0827,
  longitude: 80.2707,
  timezone: 5.5,
  city: "Chennai"
}

Birth data stored in initSession: {
  year: 1990,
  month: 5,
  day: 15,
  hour: 14,
  minute: 30,
  latitude: 13.0827,
  longitude: 80.2707,
  timezone: 5.5,
  city: "Chennai"
}
```

## Possible Issues

### Issue 1: Client not sending birthData
- Check if client is filling the birth chart form
- Check if form fields have values before clicking "Start Chat"
- Look for validation errors in console

### Issue 2: Server not forwarding birthData
- Check server.js line 473-510 (request-session handler)
- Verify server is receiving birthData parameter
- Verify server is including birthData in incoming-session emit

### Issue 3: Astrologer not receiving birthData
- Check if incoming-session event is being received
- Check if birthData is null/undefined in the event
- Verify Socket.IO connection is working

### Issue 4: Astrologer clicking button before accepting chat
- Birth Chart button should only work AFTER accepting chat
- Check if button is visible before accepting
- Check if window.receivedBirthData is set after accepting

## Next Steps
1. Run through the complete flow
2. Check browser console for all debug logs
3. Identify where the data flow breaks
4. Report findings with console output
