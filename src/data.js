export async function fetchData() {
    const base = "https://cdn.jsdelivr.net/gh/JacobLinCool/Bahamut-Anime-Analytics@data";
    const meta = await fetch("https://raw.githubusercontent.com/JacobLinCool/Bahamut-Anime-Analytics/data/meta.json").then((res) => res.json());

    const full = await fetch(`${base}/${meta.latest.slice(0, 3).join("/")}/Full/all.json`).then((res) => res.json());
    const monthly = await fetch(`${base}/${meta.latest.slice(0, 3).join("/")}/Monthly/all.json`).then((res) => res.json());

    const merged = full.reduce((acc, cur) => {
        acc[cur.name] = { ...cur, full: cur };
        return acc;
    }, {});

    monthly.forEach((x) => {
        merged[x.name] = Object.assign(merged[x.name] || { name: x.name, ep: x.ep, image: x.image, year: x.year, month: x.month, sn: x.sn, type: x.type }, {
            monthly: x,
        });
    });

    return { meta, full, monthly, merged };
}
