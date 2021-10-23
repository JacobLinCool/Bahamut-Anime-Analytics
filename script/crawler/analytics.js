const fetch = require("node-fetch");
const { JSDOM } = require("jsdom");
const extractor = require("./extractor");

async function monthly_analytics() {
    let result = {},
        list = [];

    // 13 categories
    for (let category = 1; category <= 13; category++) {
        let name = "",
            collection = [];

        let page = 0;
        while (++page) {
            console.log(`[Monthly Analytics] category = ${category}, page = ${page}`);

            const raw = await fetch(`https://ani.gamer.com.tw/animeList.php?c=${category}&page=${page}&sort=2`).then((r) => r.text());
            const dom = new JSDOM(raw);

            name = dom.window.document.querySelector(".theme-title").innerHTML.trim();
            const data = extractor(dom.window.document);
            if (data.length == 0) break;
            collection = collection.concat(data);
        }

        collection.sort((a, b) => b.view_avg - a.view_avg);
        result[name] = collection;
        list = list.concat(collection.map((x) => ({ name: x.name, sn: x.sn })));
    }

    console.log("\033[92m" + `[Monthly Analytics] Completed. Listed ${list.length} Items.` + "\033[0m");
    return { result, list };
}

async function full_analytics() {
    let result = {},
        list = [];

    // 13 categories
    for (let category = 1; category <= 13; category++) {
        let name = "",
            collection = [];

        let page = 0;
        while (++page) {
            console.log(`[Full Analytics] category = ${category}, page = ${page}`);

            const raw = await fetch(`https://ani.gamer.com.tw/animeList.php?c=${category}&page=${page}&sort=1`).then((r) => r.text());
            const dom = new JSDOM(raw);

            name = dom.window.document.querySelector(".theme-title").innerHTML.trim();
            const data = extractor(dom.window.document);
            if (data.length == 0) break;
            collection = collection.concat(data);
        }

        collection.sort((a, b) => b.view_avg - a.view_avg);
        result[name] = collection;
        list = list.concat(collection.map((x) => ({ name: x.name, sn: x.sn })));
    }

    console.log("\033[92m" + `[Full Analytics] Completed. Listed ${list.length} Items.` + "\033[0m");
    return { result, list };
}

module.exports = { monthly_analytics, full_analytics };
