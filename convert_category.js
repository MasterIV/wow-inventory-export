const fs = require('fs');

fs.readdirSync("input").forEach(f => {
    const d = JSON.parse(fs.readFileSync("input/" + f).toString())
    const r = Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v.name_enus]));
    fs.writeFileSync("categories/" + f, JSON.stringify(r, null, 2));
})