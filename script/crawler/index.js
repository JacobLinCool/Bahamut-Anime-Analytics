const fs = require("fs");
const path = require("path");
const { retry, time_info } = require("./utils");
const { monthly_analytics, full_analytics } = require("./analytics");
const get_details = require("./details");

const date = time_info();
main();

async function main() {
    const monthly = await retry(monthly_analytics);
    saveMonthly(Object.values(monthly.result));

    const full = await retry(full_analytics);
    const details = await retry(() => get_details(full.list));
    saveFull(full.result, details);

    fs.writeFileSync(path.join(__dirname, "..", "..", "dist", "meta.json"), JSON.stringify({ latest: date }));
}

function saveMonthly(result) {
    const pos = path.join(__dirname, "..", "..", "dist", date[0], date[1], date[2], "Monthly", "all.json");
    if (!fs.existsSync(path.dirname(pos))) fs.mkdirSync(path.dirname(pos), { recursive: true });

    data = JSON.stringify(
        Object.values(result)
            .reduce((a, b) => a.concat(b), [])
            .sort((a, b) => b.view_avg - a.view_avg),
        null,
        2
    );

    fs.writeFileSync(pos, data);
}

function saveFull(result, details) {
    const pos = path.join(__dirname, "..", "..", "dist", date[0], date[1], date[2], "Full", "all.json");
    if (!fs.existsSync(path.dirname(pos))) fs.mkdirSync(path.dirname(pos), { recursive: true });

    const data = JSON.stringify(
        Object.values(result)
            .reduce((a, b) => a.concat(b), [])
            .map((anime) => Object.assign(anime, changeName(details[anime.name])))
            .reduce((a, b) => a.concat(b), [])
            .sort((a, b) => b.view_avg - a.view_avg),
        null,
        2
    );

    fs.writeFileSync(pos, data);
}

function changeName(target) {
    target.details = target.view;
    delete target.view;
    return target;
}
