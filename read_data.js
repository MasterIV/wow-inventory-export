const fs = require('fs');
const parser = require('luaparse');
const handlebars = require('handlebars');

// replace with path or copz file here
// example: E:\Battle.net\World of Warcraft\_classic_era_\WTF\Account\accountname\SavedVariables\ArkInventory.lua
const raw = fs.readFileSync("ArkInventory.lua").toString();

const categories = [];
fs.readdirSync("./src/data/categories").forEach(f => {
    categories.push({
        name: f.slice(0, -5),
        ids: require("./src/data/categories/" + f),
    });
})

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
    const char = data.global.player.data[p];
    charItems[p] = {}

    for(let l in char.location) {
        let location = char.location[l]

        if(location == null)
            continue;
        if(Array.isArray(location))
            location = location[1];

        location.bag.forEach(bag => {
            let slot = "unknown";

            if ([1, 6, 7, 8, 9, 10, 13, 15].includes(bag.type)) {
                slot = "items";
            }

            if (slot === "unknown" || !bag.slot)
                return;

            bag.slot.filter(item => item.h && item.h.includes("Hitem")).forEach(item => {
                const id = item.h.match(/Hitem:(\d+):/)[1];
                const name = item.h.match(/\|h\[([^\]]+)\]\|/)[1];

                let s = slot;
                categories.forEach(c => {
                    if(id in c.ids) s = c.name;
                });

                if(!charItems[p][s]) charItems[p][s] = {};
                const amount = item.count + (charItems[p][s][id]?.amount ?? 0);
                charItems[p][s][id] = {id, name, amount};
            });
        })
    }
}

const chars = Object.entries(charItems)
    .map(e => ({
        name: e[0],
        data: Object.entries(e[1])
            .map(i => ({category: i[0], items: Object.values(i[1])}))
            .filter(i => i.items.length > 0),
    })).filter(e => e.data.length > 0);


const category_alias_de = require("./src/data/de/categories.json");
const stringsDE = require("./src/data/de/strings.json");
const charsDE = chars.map(c => ({
    name: c.name,
    data: c.data.map(d => ({
        id: d.category,
        category: category_alias_de[d.category] ?? d.category,
        items: d.items,
    })).sort((a, b) => a.category.localeCompare(b.category))
}))

const category_alias_en = require("./src/data/en/categories.json");
const stringsEN = require("./src/data/en/strings.json");
const charsEN = chars.map(c => ({
    name: c.name,
    data: c.data.map(d => ({
        id: d.category,
        category: category_alias_en[d.category] ?? d.category,
        items: d.items,
    })).sort((a, b) => a.category.localeCompare(b.category))
}))

const tpl = handlebars.compile(fs.readFileSync("template.html").toString());
fs.writeFileSync("public/output.de.html", tpl({ chars: charsDE, strings: stringsDE }));
fs.writeFileSync("public/output.en.html", tpl({ chars: charsEN, strings: stringsEN }));
