const https = require('https');

const url = 'https://spotify.link/ulRZo7Xu8Zb';

https.get(url, (res) => {
    console.log('Status:', res.statusCode);
    console.log('Location:', res.headers.location);

    if (res.headers.location) {
        // Si es otro redirect, seguirlo
        if (res.headers.location.includes('spotify.link')) {
            https.get(res.headers.location, (res2) => {
                console.log('Location 2:', res2.headers.location);
            });
        }
    }
}).on('error', (e) => {
    console.error(e);
});
