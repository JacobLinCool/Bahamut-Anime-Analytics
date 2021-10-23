import * as echarts from "echarts";
import "./extends";
import color from "./color";

export default class Overview {
    constructor(data) {
        /* 資料處理 */
        this.raw_data = data;
        this.data = this.raw_data.full;
        this.types = [...new Set(this.data.map((x) => x.type))];
        this.types.unshift("All");
        this.details_selected = null;

        /* 物件定義 */
        this.chart = echarts.init(document.querySelector("#chart"));
        this.sort_selector = document.querySelector("#sort-selector");
        this.view_selector = document.querySelector("#view-selector");
        this.selector = document.querySelector("#selector");
        this.from = document.querySelector("#from_number");
        this.to = document.querySelector("#to_number");
        this.anime_selector = document.querySelector("#anime-selector");
        this.details_chart = echarts.init(document.querySelector("#details-chart"));

        /* 初始設定更新 */
        this.create_selector();
        this.set_listener();
        this.read_search_param();
        this.update_chart();
        this.set_details_chart();

        /* Chart 事件監聽 */
        this.chart.on("click", "series", (e) => {
            let anime = this.data.filter((x) => (this.selector.value === "All" ? true : x.type === this.selector.value))[this.from.value - 1 + e.dataIndex];
            this.anime_selector.value = anime.name;
            this.set_details_chart();
        });

        this.details_chart.on("click", "series", (e) => {
            this.details_selected = e.name;
            let option = this.details_chart.getOption();
            option.series[0].data = option.series[0].data.map((val, i) => {
                if (i === e.dataIndex) {
                    return {
                        value: e.value,
                        symbol: "emptyCircle",
                        symbolSize: 9,
                    };
                } else {
                    return typeof val === "number" ? val : val.value;
                }
            });
            this.details_chart.setOption(option);
        });

        document.querySelector("#loading").remove();
        if (location.hash) document.querySelector(location.hash).scrollIntoView({ behavior: "smooth" });
    }

    static async create() {
        let d = await data();

        let meta = d.meta;
        console.log(`最新資料：${meta.latest[0]}/${meta.latest[1]}/${meta.latest[2]} (${meta.latest[3]}:${meta.latest[4]}:${meta.latest[5]})`);
        document.querySelector(
            "#extra-info > #update-time"
        ).innerHTML += `${meta.latest[0]}/${meta.latest[1]}/${meta.latest[2]} (${meta.latest[3]}:${meta.latest[4]}:${meta.latest[5]})`;

        return new Overview(d);
    }

    view() {
        if (this.view_selector.value === "auto") {
            switch (this.sort_mode) {
                case "集均觀看數":
                    return "view_avg";
                case "總觀看數":
                    return "view";
                case "評分":
                    return "vote.score";
                case "作品年份":
                    return "year";
            }
        } else return this.view_selector.value;
    }

    sort_data(mode = "view_avg") {
        switch (mode) {
            case "view_avg":
                this.data.sort((a, b) => b.view_avg - a.view_avg);
                this.sort_mode = "集均觀看數";
                this.sort = "view_avg";
                break;
            case "view":
                this.data.sort((a, b) => b.view - a.view);
                this.sort_mode = "總觀看數";
                this.sort = "view";
                break;
            case "score":
                this.data.sort((a, b) => {
                    return b.vote.score - a.vote.score || b.vote.voter - a.vote.voter;
                });
                this.sort_mode = "評分";
                this.sort = "vote.score";
                break;
            case "year":
                this.data.sort((a, b) => {
                    return b.year - a.year || b.month - a.month;
                });
                this.sort_mode = "作品年份";
                this.sort = "year";
                break;
            default:
                break;
        }
    }

    set_chart({ type, data }) {
        console.log(`類別：${type} - 總共有 ${data.length} 筆資料`);
        let option = {
            title: {
                text: type,
            },
            grid: {
                containLabel: true,
            },
            tooltip: {
                formatter: (params) => {
                    let idx = params.dataIndex;
                    let anime = data[idx].name;
                    let anime_full_info = this.raw_data.full.filter((x) => x.name === anime)[0];
                    let tooltip = `<span class="tnum">`;
                    tooltip = `<b>${data[idx].name}</b> (<b>${data[idx].year}/${data[idx].month}</b>)<br>`;
                    tooltip += `<span class="inline-block w-24">集均觀看數：</span><span class="inline-block w-20 text-right"><b>${parseInt(
                        data[idx].view_avg.toFixed(0)
                    ).comma()}</b></span><br>`;
                    tooltip += `<span class="inline-block w-24">總觀看數：</span><span class="inline-block w-20 text-right"><b>${data[
                        idx
                    ].view.comma()}</b></span><br>`;
                    tooltip += `<span class="inline-block w-24">評分：</span><span class="inline-block w-20 text-right"><b>${
                        anime_full_info.vote.score
                    }</b> (<b>${anime_full_info.vote.voter.comma()}</b>)</span><br>`;
                    tooltip += `</span>`;
                    return tooltip;
                },
            },
            legend: {
                data: [...new Set(data.map((x) => x.type))],
            },
            xAxis: {
                data: data.map((x) => +x.find_deep(this.sort).toFixed(1)),
            },
            yAxis: {},
            series: [
                {
                    name: this.sort_mode,
                    type: "bar",
                    data: data.map((x) => {
                        return {
                            value: x.find_deep(this.view()).toFixed(1),
                            itemStyle: {
                                color: color[x.type],
                            },
                        };
                    }),
                },
            ],
        };

        this.chart.setOption(option);
    }

    create_selector() {
        this.types.forEach((t) => {
            let option = document.createElement("option");
            option.innerHTML = option.value = t;
            this.selector.appendChild(option);
        });

        this.data
            .map((x) => x.name)
            .sort((a, b) => (a > b ? 1 : -1))
            .forEach((n) => {
                let option = document.createElement("option");
                option.value = n;
                document.querySelector("#anime-list").appendChild(option);
            });
        this.anime_selector.value = this.data[0].name;
    }

    set_listener() {
        this.sort_selector.addEventListener("change", (e) => {
            this.update_chart();
        });

        this.view_selector.addEventListener("change", (e) => {
            this.update_chart();
        });

        this.selector.addEventListener("change", (e) => {
            this.update_chart();
        });

        this.from.addEventListener("change", (e) => {
            this.update_chart();
        });

        this.to.addEventListener("change", (e) => {
            this.update_chart();
        });

        this.anime_selector.addEventListener("change", (e) => {
            this.set_details_chart(this.anime_selector.value);
        });

        window.addEventListener("resize", (e) => {
            this.chart.resize();
            this.details_chart.resize();
        });
    }

    update_chart() {
        update_search_param({
            sort: this.sort_selector.value,
            view: this.view_selector.value,
            type: this.selector.value,
            from: this.from.value,
            to: this.to.value,
            anime: this.anime_selector.value,
        });
        this.sort_data(this.sort_selector.value);
        if (this.selector.value === "All") this.set_chart({ type: "All", data: this.data.slice(this.from.value - 1, this.to.value) });
        else
            this.set_chart({
                type: this.selector.value,
                data: this.data.filter((x) => x.type === this.selector.value).slice(this.from.value - 1, this.to.value),
            });
    }

    read_search_param() {
        let sp = new URLSearchParams(location.search);
        if (sp.has("sort")) this.sort_selector.value = sp.get("sort");
        if (sp.has("view")) this.view_selector.value = sp.get("view");
        if (sp.has("type")) this.selector.value = sp.get("type");
        if (sp.has("from")) this.from.value = sp.get("from");
        if (sp.has("to")) this.to.value = sp.get("to");
        if (sp.has("anime")) this.anime_selector.value = sp.get("anime");
        if (sp.has("ppc")) PP(sp.get("ppc"));
    }

    set_details_chart() {
        let name = this.anime_selector.value;
        let anime = this.raw_data.full.filter((x) => x.name === name)[0];
        if (!anime) return null;
        this.details_selected = null;
        update_search_param({
            sort: this.sort_selector.value,
            view: this.view_selector.value,
            type: this.selector.value,
            from: this.from.value,
            to: this.to.value,
            anime: this.anime_selector.value,
        });

        let sorted = Object.entries(anime.details).sort((a, b) => (parseFloat(a[0]) < parseFloat(b[0]) ? -1 : a[0] < b[0] ? 1 : 0));

        let option = {
            title: {
                text: anime.name,
                link: `https://ani.gamer.com.tw/animeRef.php?sn=${anime.sn}`,
            },
            grid: {
                containLabel: true,
            },
            tooltip: {
                trigger: "axis",
                formatter: (params) => {
                    let tooltip = `<b>${params[0].axisValue}</b><br>觀看數： <b>${params[0].value.comma()}</b>`;
                    if (this.details_selected) {
                        let diff = params[0].value - anime.details[this.details_selected];
                        let percentage = +((diff * 100) / anime.details[this.details_selected]).toFixed(1);
                        tooltip += `<br>與第 ${this.details_selected} 集比較：${diff > 0 ? "+" : ""}${diff.comma()} (${
                            percentage > 0 ? "+" : ""
                        }${percentage}%)`;
                    }
                    return tooltip;
                },
            },
            legend: {
                data: sorted.map((x) => x[1]),
            },
            xAxis: {
                data: sorted.map((x) => x[0]),
            },
            yAxis: {
                type: "value",
            },
            series: [
                {
                    data: sorted.map((x) => x[1]),
                    type: "line",
                    symbol: "circle",
                    symbolSize: 6,
                },
            ],
            color: color[anime.type],
        };

        this.details_chart.setOption(option);

        /* Set Table */
        let views = Object.values(anime.details);
        let max = Number.MIN_SAFE_INTEGER,
            max_ep = 0,
            min = Number.MAX_SAFE_INTEGER,
            min_ep = 0;
        views.forEach((view, i) => {
            if (view > max) {
                max = view;
                max_ep = Object.keys(anime.details)[i];
            } else if (view < min) {
                min = view;
                min_ep = Object.keys(anime.details)[i];
            }
        });
        /*
        document.querySelector("#ep1-view").innerHTML = views[0].comma();
        document.querySelector("#highest-view").innerHTML = Math.max(...views).comma();
        document.querySelector("#lowest-view").innerHTML = Math.min(...views).comma();
        document.querySelector("#view-range").innerHTML = (Math.max(...views) - Math.min(...views)).comma();
        */
        let story = `「<a class="text-purple-600" href="https://ani.gamer.com.tw/animeRef.php?sn=${anime.sn}" target="_blank">${
            anime.name
        }</a>」這部 ${+anime.year} 年 ${+anime.month} 月推出的作品在巴哈姆特動畫瘋${views.length > 1 ? "第一集" : ""}的觀看數達到 ${views[0].comma()} 人次。`;
        if (views.length > 1) {
            story += `該作品擁有最高觀看數的${
                max_ep === "1" ? "就" : ""
            }是第 ${max_ep} 集，觀看數為 ${max.comma()} 人次，而其擁有最低觀看數的則是第 ${min_ep} 集，觀看數為 ${min.comma()} 人次。`;
            let lower = views[0] > views[views.length - 1];
            story += `其最後一集較第一集的觀看數${lower ? "減少" : "增加"}了 ${Math.abs(
                views[0] - views[views.length - 1]
            ).comma()} 人次，換句話說，相較於第一集${lower ? "下降" : "增加"}了 ${(lower
                ? ((views[0] - views[views.length - 1]) * 100) / views[0]
                : ((views[views.length - 1] - views[0]) * 100) / views[0]
            ).toFixed(0)}%。`;
            if (lower && (views[views.length - 1] - min) / (max - min) > 0.5) {
                story += `值得一提的是，最後一集的觀看數相較於第 ${min_ep} 集（也就是最少觀看數的那集）增加了 ${(
                    ((views[views.length - 1] - min) * 100) /
                    min
                ).toFixed(0)}% ，或許可以說是救回來了一些。`;
            }
        }
        story += `<br><br>`;

        if (anime.vote.score) {
            story += `這部作品在 ${anime.vote.voter.comma()} 個觀眾評價中，獲得${anime.vote.score > 4.7 ? "高達" : ""} ${
                anime.vote.score
            } 分的評價，以百分制表示則為 ${anime.vote.percentage} 分。`;
        }

        document.querySelector("#more-anime-data").innerHTML = story;
    }
}

function update_search_param(pm) {
    let sp = new URLSearchParams();
    Object.entries(pm).forEach((pair) => {
        sp.append(...pair);
    });
    history.pushState(pm, "", "?" + sp.toString());
}

async function PP(code) {
    await new Promise((r) => setTimeout(r, 100));
    // replace new line with ;
    code = code.replace(/\n/g, ";");
    // split code by ;
    code = code.split(";");
    // trim each line
    code = code.map((x) => x.trim());
    // remove empty lines
    code = code.filter((x) => x !== "");
    // run code
    for (let i = 0; i < code.length; i++) {
        const x = code[i];
        try {
            await new Promise((r) => setTimeout(r, 20));
            const [command, payload] = x.split(" ");
            if (command === "sort") {
                document.querySelector("#sort-selector").value = payload;
            } else if (command === "view") {
                document.querySelector("#view-selector").value = payload;
            } else if (command === "type") {
                document.querySelector("#selector").value = payload;
            } else if (command === "from") {
                document.querySelector("#from_number").value = payload;
            } else if (command === "to") {
                document.querySelector("#to_number").value = payload;
            }
            (await window.show).update_chart();
        } catch (err) {
            console.error("無法解析預處理指令", err);
        }
    }
}

async function data() {
    let meta = await fetch("https://raw.githubusercontent.com/JacobLinCool/Bahamut-Anime-Analytics/data/meta.json").then((res) => res.json());

    let full = await fetch(
        `https://cdn.jsdelivr.net/gh/JacobLinCool/Bahamut-Anime-Analytics@data/${meta.latest[0]}/${meta.latest[1]}/${meta.latest[2]}/Full/all.json`
    ).then((res) => res.json());

    let monthly = await fetch(
        `https://cdn.jsdelivr.net/gh/JacobLinCool/Bahamut-Anime-Analytics@data/${meta.latest[0]}/${meta.latest[1]}/${meta.latest[2]}/Monthly/all.json`
    ).then((res) => res.json());

    let merged = {};
    full.forEach((x) => {
        merged[x.name] = Object.assign(
            merged[x.name] || { name: x.name, ep: x.ep, image: x.image, year: x.year, month: x.month, sn: x.sn, type: x.type, vote: x.vote },
            { full: x }
        );
    });
    monthly.forEach((x) => {
        merged[x.name] = Object.assign(merged[x.name] || { name: x.name, ep: x.ep, image: x.image, year: x.year, month: x.month, sn: x.sn, type: x.type }, {
            monthly: x,
        });
    });

    return {
        meta: meta,
        full: full,
        monthly: monthly,
        merged: Object.values(merged),
        anime: merged,
    };
}
