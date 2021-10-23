const { number_normalize } = require("./utils");

function extractor(document) {
    const list = [...document.querySelectorAll("a.theme-list-main")];

    const data = list.map((x) => {
        return {
            name: x.querySelector(".theme-name").innerHTML.replace(/&amp;/g, "&"),
            type: document.querySelector(".theme-title").innerHTML.trim(),
            ep: number_normalize(x.querySelector(".theme-number").innerHTML),
            view: number_normalize(x.querySelector(".show-view-number > p").innerHTML),
            image: x.querySelector(".theme-img").src,
            time: [...x.querySelector(".theme-time").innerHTML.matchAll(/\d{4}\/\d{2}/g)][0][0],
            sn: [...x.href.matchAll(/\d{1,6}/g)][0][0],
        };
    });

    for (let i = 0; i < data.length; i++) {
        data[i].view_avg = +(data[i].view / data[i].ep).toFixed(2);
        data[i].year = parseInt(data[i].time.split("/")[0]);
        data[i].month = parseInt(data[i].time.split("/")[1]);
        delete data[i].time;
    }

    return data;
}

module.exports = extractor;
