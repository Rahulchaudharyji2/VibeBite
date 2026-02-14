
const https = require('https');

const API_KEY = "179e923d3bmsh9620621cc735babp120becjsn34ebb6e9bb98";
const API_HOST = "spotify81.p.rapidapi.com";
const TRACK_ID = "2QP041AcWg8PwPIWP95RKN";

const options = {
    method: 'GET',
    hostname: API_HOST,
    port: null,
    path: `/audio_features?ids=${TRACK_ID}`,
    headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': API_HOST
    }
};

console.log(`Requesting https://${API_HOST}${options.path}`);

const req = https.request(options, function (res) {
    const chunks = [];

    res.on('data', function (chunk) {
        chunks.push(chunk);
    });

    res.on('end', function () {
        const body = Buffer.concat(chunks);
        console.log("Response Status:", res.statusCode);
        console.log("Response Body:");
        console.log(body.toString());
    });
});

req.on('error', (e) => {
    console.error("Request Error:", e);
});

req.end();
