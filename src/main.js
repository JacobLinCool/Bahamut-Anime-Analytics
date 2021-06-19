import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import fs from "fs";
import { gen_data, number_normalize } from "./data.js";

const DIR = "./dist/";
const DATE = time_info();

async function main() {
    check_dir();

    let { result: monthly_result, list: monthly_list } = await monthly_analytics();
    fs.writeFileSync(
        `${DIR}${DATE[0]}/${DATE[1]}/${DATE[2]}/Monthly/all.json`,
        JSON.stringify(
            Object.values(monthly_result)
                .reduce((a, b) => a.concat(b), [])
                .sort((a, b) => b.view_avg - a.view_avg),
            null,
            2
        )
    );
    Object.entries(monthly_result).forEach(([type, data]) => {
        fs.writeFileSync(`${DIR}${DATE[0]}/${DATE[1]}/${DATE[2]}/Monthly/${type}.json`, JSON.stringify(data, null, 2));
    });

    let { result: full_result, list: full_list } = await full_time_analytics();
    let details = await full_time_details(full_list);
    let result = {};
    Object.values(full_result)
        .reduce((a, b) => a.concat(b), [])
        .forEach((anime) => {
            result[anime.name] = Object.assign({}, anime, {
                details: details[anime.name],
                view: Object.values(details[anime.name]).reduce((a, b) => a + b, 0),
            });
            result[anime.name].view_avg = +(result[anime.name].view / result[anime.name].ep).toFixed(2);
        });

    fs.writeFileSync(`${DIR}${DATE[0]}/${DATE[1]}/${DATE[2]}/Anime/all.json`, JSON.stringify(result, null, 2));

    fs.writeFileSync(
        `${DIR}${DATE[0]}/${DATE[1]}/${DATE[2]}/Full/all.json`,
        JSON.stringify(
            Object.values(full_result)
                .reduce((a, b) => a.concat(b), [])
                .sort((a, b) => b.view_avg - a.view_avg),
            null,
            2
        )
    );
    Object.entries(full_result).forEach(([type, data]) => {
        fs.writeFileSync(`${DIR}${DATE[0]}/${DATE[1]}/${DATE[2]}/Full/${type}.json`, JSON.stringify(data, null, 2));
    });
}

function check_dir() {
    // Dist Root
    if (!fs.existsSync(DIR)) fs.mkdirSync(DIR);
    // Year Folder
    if (!fs.existsSync(`${DIR}${DATE[0]}/`)) fs.mkdirSync(`${DIR}${DATE[0]}/`);
    // Month Folder
    if (!fs.existsSync(`${DIR}${DATE[0]}/${DATE[1]}/`)) fs.mkdirSync(`${DIR}${DATE[0]}/${DATE[1]}/`);
    // Date Folder
    if (!fs.existsSync(`${DIR}${DATE[0]}/${DATE[1]}/${DATE[2]}/`)) fs.mkdirSync(`${DIR}${DATE[0]}/${DATE[1]}/${DATE[2]}/`);
    // Anime Folder
    if (!fs.existsSync(`${DIR}${DATE[0]}/${DATE[1]}/${DATE[2]}/Anime/`)) fs.mkdirSync(`${DIR}${DATE[0]}/${DATE[1]}/${DATE[2]}/Anime/`);
    // Full-Time Folder
    if (!fs.existsSync(`${DIR}${DATE[0]}/${DATE[1]}/${DATE[2]}/Full/`)) fs.mkdirSync(`${DIR}${DATE[0]}/${DATE[1]}/${DATE[2]}/Full/`);
    // Monthly Folder
    if (!fs.existsSync(`${DIR}${DATE[0]}/${DATE[1]}/${DATE[2]}/Monthly/`)) fs.mkdirSync(`${DIR}${DATE[0]}/${DATE[1]}/${DATE[2]}/Monthly/`);
}

async function full_time_details(list) {
    let result = {};
    for (let i = 0; i < list.length; i++) {
        let name = list[i].name,
            sn = list[i].sn,
            episode = {};
        console.log(`[Full-Time Details] name = ${name}, sn = ${sn}`);
        let has_next_episode = true;
        while (has_next_episode) {
            let raw = await fetch(`https://ani.gamer.com.tw/${sn == list[i].sn ? "animeRef" : "animeVideo"}.php?sn=${sn}`).then((r) => r.text());
            let dom = new JSDOM(raw);
            let view = number_normalize(dom.window.document.querySelector(".newanime-count > span").innerHTML);
            let current_ep = dom.window.document.querySelector("li.playing");
            if (!current_ep) {
                has_next_episode = false;
                episode["電影"] = view;
            } else {
                if (!current_ep.nextSibling) has_next_episode = false;
                else sn = number_normalize(current_ep.nextSibling.querySelector("a").href);
                episode[current_ep.querySelector("a").innerHTML.trim()] = view;
            }
        }
        result[name] = episode;
    }
    return result;
}

async function full_time_analytics() {
    let result = {},
        list = [];
    for (let c = 1; c <= 13; c++) {
        let type = "",
            collection = [];
        let p = 0;
        while (++p) {
            console.log(`[Full-Time Analytics] c = ${c}, p = ${p}`);
            let raw = await fetch(`https://ani.gamer.com.tw/animeList.php?page=${p}&c=${c}&sort=1`).then((r) => r.text());
            let dom = new JSDOM(raw);
            type = dom.window.document.querySelector(".theme-title").innerHTML.trim();
            let data = gen_data(dom.window.document);
            if (!data.length) break;
            collection = collection.concat(data);
        }
        collection.sort((a, b) => b.view_avg - a.view_avg);
        result[type] = collection;
        list = list.concat(
            collection.map((x) => {
                return { name: x.name, sn: x.sn };
            })
        );
    }

    return {
        result: result,
        list: list,
    };
}

async function monthly_analytics() {
    let result = {},
        list = [];
    for (let c = 1; c <= 13; c++) {
        let type = "",
            collection = [];
        let p = 0;
        while (++p) {
            console.log(`[Monthly Analytics] c = ${c}, p = ${p}`);
            let raw = await fetch(`https://ani.gamer.com.tw/animeList.php?page=${p}&c=${c}&sort=2`).then((r) => r.text());
            let dom = new JSDOM(raw);
            type = dom.window.document.querySelector(".theme-title").innerHTML.trim();
            let data = gen_data(dom.window.document);
            if (!data.length) break;
            collection = collection.concat(data);
        }
        collection.sort((a, b) => b.view_avg - a.view_avg);
        result[type] = collection;
        list = list.concat(
            collection.map((x) => {
                return { name: x.name, sn: x.sn };
            })
        );
    }

    return {
        result: result,
        list: list,
    };
}

function time_info() {
    const [date, time] = new Date()
        .toLocaleString("en-GB", { timeZone: "Asia/Taipei" })
        .split(",")
        .map((x) => x.trim());
    const [dt, mt, yr] = date.split("/");
    const [hr, mn, sc] = time.split(":");
    return [yr, mt, dt, hr, mn, sc];
}

export { main };
