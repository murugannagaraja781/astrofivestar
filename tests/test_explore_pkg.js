try {
    const pkg = require('vedic-astrology-api');
    console.log("Main Export Keys:", Object.keys(pkg));
} catch (e) {
    console.log("Main require failed:", e.message);
}
