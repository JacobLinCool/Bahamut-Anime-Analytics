async function retry(func, times = 3) {
    if (typeof func !== "function") throw new Error("func must be a function");
    if (typeof times !== "number") throw new Error("times must be a number");
    for (let i = 0; i < times; i++) {
        try {
            return await func();
        } catch (err) {
            console.log("\033[93m" + `Tried: ${i + 1} / ${times}` + "\033[0m", err);
        }
    }
    return null;
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

function number_normalize(n) {
    try {
        const number = parseFloat([...n.matchAll(/[+-]?([0-9]*[.])?[0-9]+/g)][0][0]);
        if (n.includes("萬")) return number * 10000;
        else return number;
    } catch (err) {
        if (n !== "統計中") console.error("[Number Normalize] Failed.", n, err.message);
        return 0;
    }
}

module.exports = { retry, time_info, number_normalize };
