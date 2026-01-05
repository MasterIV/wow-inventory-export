const fs = require('fs');
const parser = require('luaparse');
const handlebars = require('handlebars');

// replace with path or copz file here
// example: E:\Battle.net\World of Warcraft\_classic_era_\WTF\Account\accountname\SavedVariables\ArkInventory.lua
const raw = fs.readFileSync("ArkInventory.lua").toString();

function extreact(val) {
    switch (val.type) {
        case "TableConstructorExpression":
            if(val.fields.length < 1)
                return [];
            if(val.fields[0].type === "TableKey")
                return Object.fromEntries(val.fields.map(extreact));

            return val.fields.map(extreact);
        case "TableKey":
            return [extreact(val.key), extreact(val.value)];
        case "TableValue":
            return extreact(val.value);
        case "StringLiteral":
            return JSON.parse(val.raw);
        default:
            return val.value;
    }
}

const data = extreact(parser.parse(raw).body[0].init[0]);
const charItems = {};

fs.writeFileSync("extracted.json", JSON.stringify(data, null, 2))

for(let p in data.global.player.data) {
    console.log(p);

    const char = data.global.player.data[p];
    charItems[p] = {
        items: {},
        auction: {},
        mail: {},
    }

    for(let l in char.location) {
        let location = char.location[l]

        if(Array.isArray(location))
            location = location[1];

        location.bag.forEach(bag => {
            let slot = "unknown";

            if ([1, 6, 7, 8, 9, 10, 13].includes(bag.type)) {
                slot = "items";
            } else if (bag.type === 15) {
                slot = "mail";
            } else if (bag.type === 20) {
                slot = "auction";
            }

            if (slot === "unknown" || !bag.slot)
                return;

            bag.slot.filter(item => item.h).forEach(item => {
                const id = item.h.match(/Hitem:(\d+):/)[1];
                const name = item.h.match(/\|h\[([^\]]+)\]\|/)[1];
                const amount = item.count + (charItems[p][slot][id]?.amount ?? 0);
                charItems[p][slot][id] = {id, name, amount}
            });
        })
    }
}

const chars = Object.entries(charItems)
    .map(e => ({
        name: e[0],
        items: Object.values(e[1].items),
        mail: Object.values(e[1].mail),
        auction: Object.values(e[1].auction),
    })).filter(e => e.items.length > 0);

const tplDE = handlebars.compile(fs.readFileSync("template.de.html").toString());
fs.writeFileSync("output.de.html", tplDE({ chars }));

const tplEN = handlebars.compile(fs.readFileSync("template.en.html").toString());
fs.writeFileSync("output.en.html", tplEN({ chars }));


