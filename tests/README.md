# Test Suite

## Unit Tests
File: `tests/test_astro.js`
Purpose: Verifies the core astrological calculation functions in `utils/astroCalculations.js`.

**Coverage:**
- `calculateNakshatra`: Checks degree to Nakshatra name mapping.
- `calculateRasiChart`: Checks Planet -> Sign mapping.
- `calculateNavamsaChart`: Checks basic Navamsa logic.

**Run:**
```bash
node tests/test_astro.js
```

## Speed Tests
File: `tests/speed_test.js`
Purpose: Measures the latency of the `/api/astrology/complete` endpoint.

**Methodology:**
- Sends 5 sequential POST requests.
- Payload: Date 2000-01-01, Chennai Coordinates.
- Logs individual request duration and average time.

**Run:**
```bash
node tests/speed_test.js
```
