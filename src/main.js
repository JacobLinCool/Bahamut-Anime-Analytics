import "./tailwind.css";
import "./style.css";

// import { fetchData } from "./data";
// import Servant from "./servant";

// main();

// async function main() {
//     window.data = await fetchData();
//     console.log(`最新資料：${data.meta.latest.slice(0, 3).join("/")} (${data.meta.latest.slice(3).join(":")})`);
//     document.querySelector("#extra-info > #update-time").innerHTML += `${data.meta.latest.slice(0, 3).join("/")} (${data.meta.latest.slice(3).join(":")})`;
//     window.servant = new Servant(data);
//     await servant.init();
// }

import Overview from "./overview";
window.show = Overview.create();
