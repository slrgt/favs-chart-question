const margin = 5;
const boxWidth = 185;
const boxHeight = 225;
const textHeight = 45;
const textY = boxHeight + margin * 2;
const totalWidth = boxWidth + margin * 2;
const totalHeight = boxHeight + textHeight + margin * 3;
const headerHeight = 100;
const aspectRatio = boxHeight / boxWidth;
const defaultFields = [
  "vidya",
  "movie",
  "music artist",
  "album",
  "tv",
  "instrument",
  "visual artist",
  "pokémon",
  "book",
  "weapon",
  "pony",
  "drink",
  "sport",
  "boy/girl type",
  "superhero",
  "cartoon",
  "vehicle",
  "celebrity",
  "food",
  "activity",
  "universe",
  "drug",
  "youtube",
  "comedian",
  "anime",
  "place",
  "animal",
  "retro vidya",
];
const entry = [];
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
let width;
let height;
let modalSlot;

const renderCanvas = document.createElement("canvas");
const renderContext = renderCanvas.getContext("2d");
const renderImage = new Image();

const dialog = document.querySelector("dialog");

function scaleText(e, currentEm, useBoxDimensions = true) {
  const targetWidth = useBoxDimensions ? boxWidth : e.clientWidth;
  const targetHeight = useBoxDimensions ? boxHeight : e.clientHeight;
  if (
    e.scrollWidth <= targetWidth &&
    e.scrollHeight <= targetHeight &&
    !e.style.fontSize
  ) {
    return;
  }

  e.style.fontSize = `${currentEm}rem`;

  while (
    (e.scrollWidth > targetWidth || e.scrollHeight > targetHeight) &&
    currentEm > 0.1
  ) {
    currentEm -= 0.1;
    e.style.fontSize = `${currentEm}rem`;
  }
}

function setText() {
  const element = document.querySelector(`#content-${modalSlot}`);
  const text = document.querySelector("dialog #textField").value;
  entry[modalSlot].text = text;
  element.textContent = text;
  scaleText(element, 4, true);
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
  e.parentElement
    .querySelectorAll("button")
    .forEach((b) => b.classList.remove("selected"));
  e.classList.add("selected");

  const target = e.closest("dialog") ? `#content-${modalSlot}` : "svg";

  document
    .querySelector(target)
    .style.setProperty("--scale", e.getAttribute("val"));
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
  link.setAttribute(
    "href",
    renderCanvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream")
  );
  link.click();
}

async function save() {
  const svg = document.querySelector("#svg");
  const svgURL = new XMLSerializer().serializeToString(svg);
  renderImage.onload = () => {
    render();
  };
  renderImage.src =
    "data:image/svg+xml; charset=utf8, " + encodeURIComponent(svgURL);
}

function showModal(e) {
  modalSlot = Number(e.id.split("-")[1]);

  dialog.querySelector("h2").textContent = document.querySelector(
    `#label-${modalSlot}`
  ).textContent;
  dialog.querySelector("#textField").value = document.querySelector(
    `#content-${modalSlot}`
  ).textContent;

  const isFill = document
    .querySelector(`#content-${modalSlot}`)
    .closest("[style*='scale']")
    .getAttribute("style")
    .includes("cover");

  dialog
    .querySelectorAll("button")
    .forEach((b) => b.classList.remove("selected"));

  dialog
    .querySelector(`button[val=${isFill ? "cover" : "contain"}]`)
    .classList.add("selected");

  dialog.showModal();
}

document.addEventListener("click", (e) => {
  const t = e.target;

  if (t.closest("dialog") && !t.closest("#modalBounds")) {
    document.querySelectorAll("dialog").forEach((d) => d.close());
  }

  if (t.id === "saveButton") {
    save();
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
  if (
    document.querySelector("#slotModal[open]") &&
    e.clipboardData.files.length
  ) {
    e.preventDefault();
    updateImage(e.clipboardData);
  }
});

document.addEventListener("keyup", (e) => {
  const t = e.target;
  e.preventDefault();
  if (t.closest(".text-container")) {
    if (t.closest(".header-container")) {
      scaleText(t, 4, false);
    } else {
      scaleText(t, 2);
    }
  }
});

function genBoxes(columns, rows) {
  width = totalWidth * columns + margin * (columns + 1);
  height = totalHeight * rows + margin * (rows + 1) + headerHeight;

  const svg = document.querySelector("svg");
  svg.replaceChildren(...svg.querySelectorAll("style"));
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

  svg.insertAdjacentHTML(
    "beforeend",
    `
    <foreignObject width="${width}" height="${headerHeight}">
      <div xmlns="http://www.w3.org/1999/xhtml" class="text-container header-container">
        <div></div>
          <span style="height: ${headerHeight}px;" contenteditable>Anon's Favourite...</span>
        <div></div>
      </div>
    </foreignObject>
  `
  );

  let container = `<g id="container" transform="translate(0, ${headerHeight})">`;
  let box = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const x = margin + c * margin + c * totalWidth;
      const y = margin + r * margin + r * totalHeight;

      if (!entry[box]) {
        entry[box] = {
          value: defaultFields[box] || "",
          file: null,
          scaling: null,
          text: "",
        };
      }

      container += `<g transform="translate(${x}, ${y})" class="box" id="box-${box}">
        <rect width="${totalWidth}" height="${totalHeight}" /> 
        <foreignObject x="${margin}" y="${margin}" width="${boxWidth}" height="${boxHeight}">
          <div xmlns="http://www.w3.org/1999/xhtml" class="text-container">
            <div class="content" id="content-${box}"></div>
          </div>
        </foreignObject>
        <foreignObject x="${margin}" y="${textY}" width="${boxWidth}" height="${textHeight}">
          <div xmlns="http://www.w3.org/1999/xhtml" class="text-container">
            <span class="label" id="label-${box}" contenteditable>${entry[box].value}</span>
          </div>
        </foreignObject>
      </g>`;

      box++;
    }
  }
  container += "</g>";

  svg.insertAdjacentHTML("beforeend", container);
  document.querySelectorAll("svg input").forEach((i) => {
    scaleText(i, i.closest("#container") ? 2 : 4);
  });
}

addEventListener("load", () => {
  genBoxes(7, 4);
});

window.addEventListener("beforeunload", (e) => {
  if (document.querySelector(".content[style*='background-image']")) {
    e.preventDefault();
    return;
  }
});
