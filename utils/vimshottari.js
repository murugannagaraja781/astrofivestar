function computeMahadashaSequence(date, moonLongitude, years = 120) {
    // Vimshottari Dasha Order and Years
    // Sequence: Ketu (7), Venus (20), Sun (6), Moon (10), Mars (7), Rahu (18), Jupiter (16), Saturn (19), Mercury (17)
    const DASHA_LORDS = [
        { lord: 'Ketu', years: 7 },
        { lord: 'Venus', years: 20 },
        { lord: 'Sun', years: 6 },
        { lord: 'Moon', years: 10 },
        { lord: 'Mars', years: 7 },
        { lord: 'Rahu', years: 18 },
        { lord: 'Jupiter', years: 16 },
        { lord: 'Saturn', years: 19 },
        { lord: 'Mercury', years: 17 }
    ];

    // Identify Birth Nakshatra
    const nakshatraLength = 13.3333333;
    const nakIndex = Math.floor(moonLongitude / nakshatraLength);
    const degreesInNak = moonLongitude % nakshatraLength;
    const fractionTraversed = degreesInNak / nakshatraLength;
    const fractionRemaining = 1 - fractionTraversed;

    // Determine starting Mahadasha
    // Nakshatra Lords cycle matches Dasha Lords cycle (repeated 3 times: 9x3 = 27)
    const lordIndex = nakIndex % 9;
    const startLord = DASHA_LORDS[lordIndex];

    // Balance of Dasha at birth
    const balanceYears = startLord.years * fractionRemaining;

    const sequence = [];
    let currentDate = new Date(date);

    // 1. First Dasha (Balance)
    let endDate = new Date(currentDate);
    endDate.setFullYear(endDate.getFullYear() + Math.floor(balanceYears));
    // Improve accuracy for days if needed, but year add is safe for MVP

    sequence.push({
        lord: startLord.lord,
        start: new Date(date), // Start at birth
        end: new Date(endDate),
        years: balanceYears
    });

    currentDate = new Date(endDate);

    // 2. Subsequent Dashas
    let idx = (lordIndex + 1) % 9;
    while (true) {
        const dasha = DASHA_LORDS[idx];
        const nextEnd = new Date(currentDate);
        nextEnd.setFullYear(nextEnd.getFullYear() + dasha.years);

        sequence.push({
            lord: dasha.lord,
            start: new Date(currentDate),
            end: new Date(nextEnd),
            years: dasha.years
        });

        currentDate = nextEnd;
        idx = (idx + 1) % 9;

        // Stop if we exceed reasonable timeframe (e.g. 100 years from birth)
        if (currentDate.getFullYear() - date.getFullYear() > years) break;
    }

    return sequence;
}

// Fixed implementation for Bhuktis
function computeBhuktisForMahadasha(mahadasha) {
    const DASHA_LORDS = [
        { lord: 'Ketu', years: 7 },
        { lord: 'Venus', years: 20 },
        { lord: 'Sun', years: 6 },
        { lord: 'Moon', years: 10 },
        { lord: 'Mars', years: 7 },
        { lord: 'Rahu', years: 18 },
        { lord: 'Jupiter', years: 16 },
        { lord: 'Saturn', years: 19 },
        { lord: 'Mercury', years: 17 }
    ];

    const mahaLordName = mahadasha.lord;
    const mahaStandardYears = DASHA_LORDS.find(l => l.lord === mahaLordName).years;

    // Find index of Mahadasha lord to start Bhukti cycle
    const startIdx = DASHA_LORDS.findIndex(l => l.lord === mahaLordName);

    const bhuktis = [];

    // We need the THEORETICAL start date of the full Mahadasha
    // If this is a constrained dasha (balance years < standard years), back-calculate start.
    let theoreticalStart = new Date(mahadasha.start);
    if (mahadasha.years < mahaStandardYears - 0.01) { // It's a balance dasha or clipped
        const consumedYears = mahaStandardYears - mahadasha.years;
        const msToSubtract = consumedYears * 365.25 * 24 * 60 * 60 * 1000;
        theoreticalStart = new Date(theoreticalStart.getTime() - msToSubtract);
    }

    let currentDate = new Date(theoreticalStart);

    for (let i = 0; i < 9; i++) {
        const idx = (startIdx + i) % 9;
        const subLord = DASHA_LORDS[idx];

        // Bhukti Duration = (MahaYears * SubLordYears) / 120
        const durationYears = (mahaStandardYears * subLord.years) / 120;

        const endDate = new Date(currentDate.getTime() + (durationYears * 365.25 * 24 * 60 * 60 * 1000));

        bhuktis.push({
            mahaLord: mahaLordName,
            subLord: subLord.lord,
            start: new Date(currentDate),
            end: new Date(endDate),
            years: durationYears
        });

        currentDate = endDate;
    }

    // Filter to show only relevant ones (optional, or return all)
    // Routes use .map, so returning all is fine.
    return bhuktis;
}

function computePratyantarsForBhukti(bhukti) {
    // Similar to Bhukti, but level down.
    // Pratyantar Duration = (BhuktiDuration in Years * PratyantarLordYears) / 120 ??
    // Formula: (MahaYears * BhuktiYears * PratyantarYears) / (120*120) ??
    // Standard rule: Duration proportional to Lord's years in the 120y cycle.

    // Easier: Pratyantar Duration = (BhuktiDuration * LordYears) / 120

    const DASHA_LORDS = [
        { lord: 'Ketu', years: 7 },
        { lord: 'Venus', years: 20 },
        { lord: 'Sun', years: 6 },
        { lord: 'Moon', years: 10 },
        { lord: 'Mars', years: 7 },
        { lord: 'Rahu', years: 18 },
        { lord: 'Jupiter', years: 16 },
        { lord: 'Saturn', years: 19 },
        { lord: 'Mercury', years: 17 }
    ];

    const subLordName = bhukti.subLord;
    const startIdx = DASHA_LORDS.findIndex(l => l.lord === subLordName);

    const pratyantars = [];
    let currentDate = new Date(bhukti.start);

    // Bhukti duration in years
    const bhuktiYears = bhukti.years;

    for (let i = 0; i < 9; i++) {
        const idx = (startIdx + i) % 9;
        const pLord = DASHA_LORDS[idx];

        const durationYears = (bhuktiYears * pLord.years) / 120;

        const endDate = new Date(currentDate.getTime() + (durationYears * 365.25 * 24 * 60 * 60 * 1000));

        pratyantars.push({
            pratyantarLord: pLord.lord,
            start: new Date(currentDate),
            end: new Date(endDate),
            years: durationYears
        });
        currentDate = endDate;
    }
    return pratyantars;
}

function getCurrentDasha(birthDate, moonLongitude, targetDate = new Date()) {
    const mahadashas = computeMahadashaSequence(birthDate, moonLongitude);

    const currentMaha = mahadashas.find(m => targetDate >= m.start && targetDate < m.end);

    if (!currentMaha) return { error: "Date out of range" };

    const bhuktis = computeBhuktisForMahadasha(currentMaha);
    const currentBhukti = bhuktis.find(b => targetDate >= b.start && targetDate < b.end);

    let currentPratyantar = null;
    if (currentBhukti) {
        const pratyantars = computePratyantarsForBhukti(currentBhukti);
        currentPratyantar = pratyantars.find(p => targetDate >= p.start && targetDate < p.end);
    }

    return {
        mahadasha: currentMaha,
        bhukti: currentBhukti,
        pratyantar: currentPratyantar
    };
}

module.exports = {
    computeMahadashaSequence,
    computeBhuktisForMahadasha,
    computePratyantarsForBhukti,
    getCurrentDasha
};
