const startTest = async () => {
    console.log("=== Starting Speed Test ===");
    const url = "http://localhost:3000/api/astrology/complete";
    const payload = {
        year: 2000,
        month: 1,
        day: 1,
        hour: 12,
        minute: 0,
        lat: 13.0827,
        lon: 80.2707,
        tz: 5.5
    };

    const iterations = 5;
    let totalTime = 0;

    for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const json = await res.json();
            const duration = Date.now() - start;
            console.log(`Request ${i + 1}: ${duration}ms | Status: ${res.status}`);
            totalTime += duration;
        } catch (e) {
            console.error(`Request ${i + 1} FAILED:`, e.message);
        }
    }

    console.log(`\nAverage Response Time: ${(totalTime / iterations).toFixed(2)}ms`);
    console.log("=== Speed Test Completed ===");
};

startTest();
