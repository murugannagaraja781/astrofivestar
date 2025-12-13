const fetch = require('node-fetch'); // Ensure node-fetch is available, or use global fetch if Node 18+

const checkSize = async () => {
    console.log("=== Checking Response Size & Compression ===");
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

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept-Encoding': 'gzip' // Explicitly ask for compression
            },
            body: JSON.stringify(payload)
        });

        console.log(`Status: ${res.status}`);
        console.log(`Content-Encoding: ${res.headers.get('content-encoding')}`);

        // Note: fetch automatically decompresses gzip.
        // We can estimate size by cloning or checking raw buffer.
        const buffer = await res.arrayBuffer();
        console.log(`Uncompressed Size: ${(buffer.byteLength / 1024).toFixed(2)} KB`);

        // To check network transfer size we'd need a lower level request or proxy,
        // but 'content-encoding: gzip' header presence is sufficient proof of activation.

    } catch (e) {
        console.error("Test Failed:", e.message);
    }
};

checkSize();
