Object.prototype.find_deep = function (path) {
    let dist = this;
    path.split(".").forEach((key) => {
        dist = dist ? dist[key] : undefined;
    });
    return dist;
};

Number.prototype.comma = function () {
    return this.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
