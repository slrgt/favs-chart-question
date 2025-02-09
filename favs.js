const margin = 5;
const boxWidth = 185;
const boxHeight = 225;
const textHeight = 45;
const textY = boxHeight + margin * 2;
const totalWidth = boxWidth + margin * 2;
const totalHeight = boxHeight + textHeight + margin * 3;
const headerHeight = 100;
const aspectRatio = boxHeight / boxWidth;
const defaultColumns = 7;
const defaultRows = 4;
const defaultFields = [
  ["vidya", "movie", "music artist", "album", "tv", "instrument", "visual artist"],
  ["pokémon", "book", "weapon", "pony", "drink", "sport", "boy/girl type"],
  ["superhero", "cartoon", "vehicle", "celebrity", "food", "activity", "universe"],
  ["drug", "youtube", "comedian", "anime", "place", "animal", "retro vidya"],
];
const entry = [];
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
let templateDefaults = {};
let width;
let height;
let modalSlot;
let modalRow;
let modalColumn;

const renderCanvas = document.createElement("canvas");
const renderContext = renderCanvas.getContext("2d");
const renderImage = new Image();

const dialog = document.querySelector("dialog");

function setSlot(val) {
  modalSlot = val.split("-")[1];
  modalRow = Number(modalSlot.split("_")[0]);
  modalColumn = Number(modalSlot.split("_")[1]);
}

function scaleText(e, currentEm) {
  const isBox = e.closest("#container");
  if (isBox) {
    setSlot(e.id);
    entry[modalRow][modalColumn].value = e.innerText;
  }

  const targetWidth = isBox ? boxWidth : e.clientWidth;
  const targetHeight = isBox ? boxHeight : e.clientHeight;
  if (e.scrollWidth <= targetWidth && e.scrollHeight <= targetHeight && !e.style.fontSize) {
    return;
  }

  e.style.fontSize = `${currentEm}rem`;

  while ((e.scrollWidth > targetWidth || e.scrollHeight > targetHeight) && currentEm > 0.1) {
    currentEm -= 0.1;
    e.style.fontSize = `${currentEm}rem`;
  }
}

function setText() {
  const element = document.querySelector(`#content-${modalSlot}`);
  const text = document.querySelector("dialog #textField").value;
  element.textContent = text;
  scaleText(element, 4);
  dialog.close();
}

function updateImage(data, e = document.querySelector(`#box-${modalSlot}`)) {
  if (!data?.files[0].type?.startsWith("image/")) {
    return false;
  }

  const parent = e.closest(".box");
  const file = data.files[0];
  const image = new Image();

  image.onload = () => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const text = parent.querySelector(".content");
      text.style.backgroundImage = `url(${reader.result})`;
      dialog.close();
    };
    reader.readAsDataURL(file);
  };

  image.src = URL.createObjectURL(file);
  return true;
}

function scalingChanged(e) {
  e.parentElement.querySelectorAll("button").forEach((b) => b.classList.remove("selected"));
  e.classList.add("selected");

  const target = e.closest("dialog") ? `#content-${modalSlot}` : "svg";

  document.querySelector(target).style.setProperty("--scale", e.getAttribute("val"));
}

function resetBox(i) {
  const element = document.querySelector(`#content-${i}`);
  element.removeAttribute("style");
  entry.scaling = null;
  element.textContent = "";
  dialog.close();
}

function render() {
  renderContext.clearRect(0, 0, renderCanvas.width, renderCanvas.height);
  renderCanvas.width = width;
  renderCanvas.height = height;
  renderContext.drawImage(renderImage, 0, 0, width, height);
  const dataUrl = renderCanvas.toDataURL("image/png");
  if (isSafari) {
    const safariModal = document.querySelector("dialog#safariModal");
    safariModal.showModal();
    safariModal.querySelector("img").src = dataUrl;
    return;
  }

  const link = document.createElement("a");
  link.setAttribute("download", "favchart.png");
  link.setAttribute("href", renderCanvas.toDataURL("image/png").replace("image/png", "image/octet-stream"));
  link.click();
}

async function save() {
  const svg = document.querySelector("#svg").cloneNode(true);

  const font = await fetch("./resources/Impact.ttf");
  const fontBlob = await font.blob();

  const reader = new FileReader();

  reader.onload = () => {
    const fontFace = `
        @font-face {
            font-family: "Impact";
            src: url("${reader.result}") format("truetype");
        }
    `;
    svg.querySelector("style").textContent += fontFace;
    const svgURL = new XMLSerializer().serializeToString(svg);
    renderImage.onload = () => {
      render();
    };
    renderImage.src = "data:image/svg+xml; charset=utf8, " + encodeURIComponent(svgURL);
  };
  reader.readAsDataURL(fontBlob);
}

function showModal(e) {
  setSlot(e.id);

  dialog.querySelector("h2").textContent = document.querySelector(`#label-${modalSlot}`).textContent;
  dialog.querySelector("#textField").value = document.querySelector(`#content-${modalSlot}`).textContent;

  const isFill = document
    .querySelector(`#content-${modalSlot}`)
    .closest("[style*='scale']")
    .getAttribute("style")
    .includes("cover");

  dialog.querySelectorAll("button").forEach((b) => b.classList.remove("selected"));

  dialog.querySelector(`button[val=${isFill ? "cover" : "contain"}]`).classList.add("selected");

  dialog.showModal();
}

function genBoxes(columns, rows) {
  width = totalWidth * columns + margin * (columns + 1);
  height = totalHeight * rows + margin * (rows + 1) + headerHeight;

  let container = `<g id="container" transform="translate(0, ${headerHeight})">`;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const x = margin + c * margin + c * totalWidth;
      const y = margin + r * margin + r * totalHeight;

      if (!entry[r]) {
        entry[r] = new Array(columns);
      }

      if (!entry[r][c]) {
        let value;
        try {
          if (templateDefaults?.entries) {
            value = templateDefaults.entries[`${r}_${c}`] || defaultFields[r][c];
          } else {
            value = defaultFields[r][c];
          }
        } catch {
          value = "";
        }

        entry[r][c] = {
          value: value,
          file: null,
          scaling: null,
          text: "",
        };
      }

      let content =
        document.querySelector(`#content-${r}_${c}`)?.outerHTML || `<div class="content" id="content-${r}_${c}"></div>`;
      container += `<g transform="translate(${x}, ${y})" class="box" id="box-${r}_${c}">
        <rect width="${totalWidth}" height="${totalHeight}" /> 
        <foreignObject x="${margin}" y="${margin}" width="${boxWidth}" height="${boxHeight}">
          <div xmlns="http://www.w3.org/1999/xhtml" class="text-container">
            ${content}
          </div>
        </foreignObject>
        <foreignObject x="${margin}" y="${textY}" width="${boxWidth}" height="${textHeight}">
          <div xmlns="http://www.w3.org/1999/xhtml" class="text-container">
            <span class="label" id="label-${r}_${c}" contenteditable>${entry[r][c].value}</span>
          </div>
        </foreignObject>
      </g>`;
    }
  }
  container += "</g>";

  const svg = document.querySelector("svg");
  const headerText = document.querySelector(".header-container span")?.innerText || "Anon's Favourite...";
  svg.replaceChildren(...svg.querySelectorAll("style"));
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

  svg.insertAdjacentHTML(
    "beforeend",
    `
    <foreignObject width="${width}" height="${headerHeight}">
      <div xmlns="http://www.w3.org/1999/xhtml" class="text-container header-container">
        <div></div>
          <span style="height: ${headerHeight}px;" contenteditable>${headerText}</span>
        <div></div>
      </div>
    </foreignObject>
  `
  );

  svg.insertAdjacentHTML("beforeend", container);
  document.querySelectorAll("svg input, svg span").forEach((i) => {
    scaleText(i, i.closest("#container") ? 2 : 4);
  });
}

function updateBoxes() {
  const columns = document.querySelector("#columnsInput").value;
  const rows = document.querySelector("#rowsInput").value;
  genBoxes(Number(columns), Number(rows));
}

function getDefaults() {
  const urlParams = new URLSearchParams(window.location.search);
  const template = urlParams.get("template");
  if (!template) {
    return;
  }

  try {
    templateDefaults = JSON.parse(atob(template));
  } catch (e) {
    console.error(e);
    return;
  }

  if (templateDefaults.c) {
    document.querySelector("#columnsInput").value = templateDefaults.c;
  }
  if (templateDefaults.r) {
    document.querySelector("#rowsInput").value = templateDefaults.r;
  }
}

async function exportTemplate() {
  const template = {};
  const columns = Number(document.querySelector("#columnsInput").value);
  if (defaultColumns !== columns) {
    template["c"] = columns;
  }
  const rows = Number(document.querySelector("#rowsInput").value);
  if (defaultRows !== rows) {
    template["r"] = rows;
  }

  const entries = {};
  document.querySelectorAll("[id^='label-'").forEach((e) => {
    const id = e.id.split("-")[1];
    const row = Number(id.split("_")[0]);
    const column = Number(id.split("_")[1]);
    const value = e.innerText.trim().toLowerCase();
    try {
      if (defaultFields[row][column].trim().toLowerCase() === e.innerText.trim().toLowerCase()) {
        return;
      }
    } catch {}
    entries[id] = value;
  });

  if (Object.keys(entries).length > 0) {
    template["entries"] = entries;
  }

  const string = btoa(JSON.stringify(template));
  const url = `${window.location.origin}${window.location.pathname}?template=${string}`;
  window.history.replaceState({}, "", url);
  await navigator.clipboard.writeText(url);
}

addEventListener("load", () => {
  getDefaults();
  genBoxes(templateDefaults.c || defaultColumns, templateDefaults.r || defaultRows);
});

window.addEventListener("beforeunload", (e) => {
  if (document.querySelector(".content[style*='background-image']")) {
    e.preventDefault();
    return;
  }
});

document.addEventListener("click", (e) => {
  const t = e.target;

  if (t.closest("dialog") && !t.closest("#modalBounds")) {
    document.querySelectorAll("dialog").forEach((d) => d.close());
  }

  if (t.id === "saveButton") {
    save();
  } else if (t.id === "dimensionsButton") {
    updateBoxes();
  } else if (t.id === "templateButton") {
    exportTemplate();
  } else if (t.closest(".content")) {
    showModal(t.closest(".box"));
  } else if (t.matches("#closeModal")) {
    t.closest("dialog").close();
  } else if (t.matches("#resetButton")) {
    resetBox(modalSlot);
  } else if (t.closest(".scaling-choice")) {
    scalingChanged(t);
  } else if (t.matches("#setText")) {
    setText(t);
  } else if (t.matches("#reRender")) {
    render();
  }
});

document.addEventListener("dragover", (e) => {
  e.preventDefault();
});

document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.matches("#select-file")) {
    updateImage(t);
  }
});

document.addEventListener("drop", (e) => {
  const t = e.target;
  e.preventDefault();
  if (t.closest("svg .box")) {
    updateImage(e.dataTransfer, t);
  }
});

document.addEventListener("paste", (e) => {
  if (document.querySelector("#slotModal[open]") && e.clipboardData.files.length) {
    e.preventDefault();
    updateImage(e.clipboardData);
  }
});

document.addEventListener("keyup", (e) => {
  const t = e.target;
  e.preventDefault();
  if (t.closest(".text-container")) {
    if (t.closest(".header-container")) {
      scaleText(t, 4);
    } else {
      scaleText(t, 2);
    }
  }
});
