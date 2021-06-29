const fs = require('fs');

const items = JSON.parse(fs.readFileSync('output.json', 'utf8'));
for (const [title, dict] of Object.entries(items)) {
    const {stars, count} = dict;
    console.log([title, stars,count].join("\t"));
}


