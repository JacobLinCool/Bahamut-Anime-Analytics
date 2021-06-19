import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import fs from "fs";
import { gen_data } from "./data.js";

const DIR = "./dist/";

async function main() {
    check_dir();

    await full_time_analytics();
    await monthly_analytics();
}

function check_dir() {
    // Dist Root
    if (!fs.existsSync(DIR)) fs.mkdirSync(DIR);
    if (!fs.existsSync(`${DIR}`)) fs.mkdirSync(`${DIR}`);
}

async function full_time_analytics() {
    const dist = "./dist/full/";
    if (!fs.existsSync(dist)) {
        fs.mkdirSync(dist);
    }
    for (let c = 1; c <= 13; c++) {
        let type = "",
            collection = [];
        let p = 0;
        while (++p) {
            console.log(`c = ${c}, p = ${p}`);
            let raw = await fetch(`https://ani.gamer.com.tw/animeList.php?page=${p}&c=${c}&sort=1`).then((r) => r.text());
            let dom = new JSDOM(raw);
            type = dom.window.document.querySelector(".theme-title").innerHTML.trim();
            let data = gen_data(dom.window.document);
            collection = collection.concat(data);
            if (!data.length) break;
        }
        collection.sort((a, b) => b.view_avg - a.view_avg);
        console.log(collection);
        fs.writeFileSync(`${dist}${type}.json`, JSON.stringify(collection, null, 2));
    }
}
async function monthly_analytics() {
    const dist = "./dist/monthly/";
    if (!fs.existsSync(dist)) {
        fs.mkdirSync(dist);
    }
    for (let c = 1; c <= 13; c++) {
        let type = "",
            collection = [];
        let p = 0;
        while (++p) {
            console.log(`c = ${c}, p = ${p}`);
            let raw = await fetch(`https://ani.gamer.com.tw/animeList.php?page=${p}&c=${c}&sort=2`).then((r) => r.text());
            let dom = new JSDOM(raw);
            type = dom.window.document.querySelector(".theme-title").innerHTML.trim();
            let data = gen_data(dom.window.document);
            collection = collection.concat(data);
            if (!data.length) break;
        }
        collection.sort((a, b) => b.view_avg - a.view_avg);
        console.log(collection);
        fs.writeFileSync(`${dist}${type}.json`, JSON.stringify(collection, null, 2));
    }
}

export { main };
