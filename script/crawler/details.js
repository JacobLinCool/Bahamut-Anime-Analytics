const fetch = require("node-fetch");
const { JSDOM } = require("jsdom");
const { retry, number_normalize } = require("./utils");

async function get_details(list) {
    const list_result = {};

    for (let i = 0; i < list.length; i++) {
        const name = list[i].name,
            result = { view: {}, vote: {}, info: {} };

        console.log(`[Details] name = ${name}, i = ${i}`);
        await retry(async () => {
            const first_raw = await fetch(`https://ani.gamer.com.tw/animeRef.php?sn=${list[i].sn}`).then((r) => r.text());
            const first_doc = new JSDOM(first_raw).window.document;
            const first_view = number_normalize(first_doc.querySelector(".newanime-count > span").innerHTML);
            const first_current_ep = first_doc.querySelector("li.playing");

            try {
                result.vote.voter = number_normalize(first_doc.querySelector(".score-overall-people > span").innerHTML);
                result.vote.score = number_normalize(first_doc.querySelector(".score-overall-number").innerHTML);
                result.vote.percentage = +((result.vote.score / 5) * 100).toFixed(1);
            } catch (err) {
                result.vote.voter = null;
                result.vote.score = null;
                result.vote.percentage = null;
            }
            result.info = [...first_doc.querySelectorAll(".data_type li")]
                .map((x) => x.innerHTML.match(/<span>([^<]+?)<\/span>([^]+)/))
                .reduce((acc, cur) => {
                    if (cur && cur.length === 3) acc[cur[1]] = cur[2];
                    return acc;
                }, {});
            // result.vote.reason = [...first_doc.querySelectorAll(".ACG-data > ul:not(.ACG-persent) > li")].map((x) => x.innerHTML.trim());

            if (!first_current_ep) {
                result.view["電影"] = first_view;
            } else {
                result.view[first_doc.querySelector("li.playing > a").innerHTML.trim()] = first_view;

                let request = [];
                let next_ep = first_current_ep.nextSibling;
                while (next_ep) {
                    request.push(fetch(`https://ani.gamer.com.tw/animeVideo.php${next_ep.querySelector("a").href}`).then((r) => r.text()));
                    next_ep = next_ep.nextSibling;
                }
                let html = await Promise.all(request);
                html.forEach((raw) => {
                    let doc = new JSDOM(raw).window.document;
                    let view = number_normalize(doc.querySelector(".newanime-count > span").innerHTML);
                    result.view[doc.querySelector("li.playing > a").innerHTML.trim()] = view;
                });
            }

            list_result[name] = result;
        }, 2);
    }

    console.log("\033[92m" + `[Details] Completed. Crawled ${Object.keys(list_result).length} Items.` + "\033[0m");
    return list_result;
}

module.exports = get_details;
