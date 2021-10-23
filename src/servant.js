import "./extends";

class List {
    constructor(list) {
        this.list = list;
    }

    sort(mode = "view_avg") {
        switch (mode) {
            case "view_avg":
                this.list.sort((a, b) => b.view_avg - a.view_avg);
                break;
            case "view":
                this.list.sort((a, b) => b.view - a.view);
                break;
            case "score":
                this.list.sort((a, b) => {
                    return b.vote.score - a.vote.score || b.vote.voter - a.vote.voter;
                });
                break;
            case "year":
                this.list.sort((a, b) => {
                    return b.year - a.year || b.month - a.month;
                });
                break;
            default:
                break;
        }
    }
}

export default class Servant {
    constructor(data) {
        this.raw = data;
        this.list = new List(Object.values(data.merged));
    }

    async init() {
        this.overview = {};
        this.detail = null;

        let sp = new URLSearchParams(location.search);

        if (sp.has("ppc")) {
            this.overview.ppc = sp.get("ppc");
            await this.preProcess(sp.get("ppc"));
        }

        if (sp.has("sort")) this.overview.sort = sp.get("sort");
        if (sp.has("view")) this.overview.view = sp.get("view");
        if (sp.has("type")) this.overview.type = sp.get("type");
        if (sp.has("from")) this.overview.from = sp.get("from");
        if (sp.has("to")) this.overview.to = sp.get("to");

        if (sp.has("anime")) this.detail = this.raw.merged[sp.get("anime")] || this.raw.merged[this.raw.full[0].name];
        else this.detail = this.raw.merged[this.raw.full[0].name];
    }

    async preProcess(code) {
        code = code
            .replace(/\n/g, ";")
            .split(";")
            .map((x) => x.trim())
            .filter((x) => x !== "");

        // run code
        for (let i = 0; i < code.length; i++) {
            const x = code[i];
            try {
                await new Promise((r) => setTimeout(r, 20));
                const [command, payload] = x.split(" ");
                if (command === "sort") this.overview.sort = payload;
                else if (command === "view") this.overview.view = payload;
                else if (command === "type") this.overview.type = payload;
                else if (command === "from") this.overview.from = payload;
                else if (command === "to") this.overview.to = payload;
            } catch (err) {
                console.error("無法解析預處理指令", err);
            }
        }
    }

    updateSearchParam() {
        const pm = { ...this.overview };
        const sp = new URLSearchParams();
        Object.entries(pm).forEach((pair) => {
            sp.append(...pair);
        });
        history.pushState(pm, "", "?" + sp.toString());
    }
}
