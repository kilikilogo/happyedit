/* ================================
   ColorTools — Main JS Script
   Compatible with your HTML structure
================================ */

// -------------------------------
// Utilities
// -------------------------------

// HEX → RGB
function hexToRgb(hex) {
    hex = hex.replace("#", "");
    if (hex.length === 3) {
        hex = hex.split("").map(x => x + x).join("");
    }
    const num = parseInt(hex, 16);
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
    };
}

// RGB → HEX
function rgbToHex(r, g, b) {
    return (
        "#" +
        [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("")
    ).toUpperCase();
}

// RGB → HSL
function rgbToHsl(r, g, b) {
    (r /= 255), (g /= 255), (b /= 255);
    const max = Math.max(r, g, b),
        min = Math.min(r, g, b);

    let h, s;
    let l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0));
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100),
    };
}

// HSL → RGB
function hslToRgb(h, s, l) {
    let sat = s / 100;
    let light = l / 100;

    let c = (1 - Math.abs(2 * light - 1)) * sat;
    let x = c * (1 - Math.abs((h / 60) % 2 - 1));
    let m = light - c / 2;

    let r, g, b;

    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }

    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255),
    };
}

// -------------------------------
// DOM elements
// -------------------------------
const inputColor = document.getElementById("color-code");
const previewText = document.getElementById("preview-text");
const colorDisplay = document.getElementById("color-display");

const hexValue = document.getElementById("hex-value");
const rgbValue = document.getElementById("rgb-value");
const hslValue = document.getElementById("hsl-value");

const detailSwatches = document.querySelectorAll(".color-swatch");

// -------------------------------
// Main color update function
// -------------------------------
function updateColor(code) {
    let hex, rgb, hsl;

    // HEX
    if (/^#?[0-9A-F]{3,6}$/i.test(code)) {
        if (!code.startsWith("#")) code = "#" + code;
        hex = code;
        rgb = hexToRgb(code);
        hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    }
    // RGB
    else if (/rgb\((\s*\d+\s*,){2}\s*\d+\s*\)/i.test(code)) {
        const v = code.match(/\d+/g).map(Number);
        rgb = { r: v[0], g: v[1], b: v[2] };
        hex = rgbToHex(v[0], v[1], v[2]);
        hsl = rgbToHsl(v[0], v[1], v[2]);
    }
    // HSL
    else if (/hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)/i.test(code)) {
        const v = code.match(/\d+/g).map(Number);
        rgb = hslToRgb(v[0], v[1], v[2]);
        hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        hsl = { h: v[0], s: v[1], l: v[2] };
    } else {
        return; // invalid input
    }

    // Update UI
    previewText.textContent = hex;
    colorDisplay.style.background = hex;

    hexValue.textContent = hex;
    rgbValue.textContent = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    hslValue.textContent = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

    detailSwatches.forEach(sw => (sw.style.background = hex));
}

inputColor.addEventListener("input", () => updateColor(inputColor.value));

updateColor(inputColor.value);

// -------------------------------
// Copy to clipboard
// -------------------------------
document.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-clipboard-target");
        const text = document.querySelector(target).textContent;

        navigator.clipboard.writeText(text).then(() => {
            btn.innerHTML = `<i class="fas fa-check"></i> Copied`;
            setTimeout(() => {
                btn.innerHTML = `<i class="fas fa-copy"></i> Copy`;
            }, 1200);
        });
    });
});


// -------------------------------
// Tabs Switch
// -------------------------------
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;

        btn.parentElement.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const container = btn.closest(".tool-body");
        container.querySelectorAll(".tab-content").forEach(c => {
            c.classList.remove("active");
            c.hidden = true;
        });

        const page = container.querySelector(`#${tab}`);
        page.classList.add("active");
        page.hidden = false;
    });
});


// ==========================================
// Image Upload + Eyedropper (Canvas)
// ==========================================
const dropArea = document.getElementById("drop-area");
let canvas, ctx;

dropArea.addEventListener("dragover", e => {
    e.preventDefault();
    dropArea.classList.add("dragging");
});

dropArea.addEventListener("dragleave", () => dropArea.classList.remove("dragging"));

dropArea.addEventListener("drop", e => {
    e.preventDefault();
    dropArea.classList.remove("dragging");

    const file = e.dataTransfer.files[0];
    loadImage(file);
});

dropArea.addEventListener("click", () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = () => loadImage(fileInput.files[0]);
    fileInput.click();
});


function loadImage(file) {
    const img = new Image();
    img.onload = () => renderImage(img);
    img.src = URL.createObjectURL(file);
}

// Canvas render
function renderImage(img) {
    dropArea.innerHTML = ""; // clear existing

    canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    dropArea.appendChild(canvas);

    // click to pick color
    canvas.addEventListener("mousemove", moveEyedropper);
    canvas.addEventListener("click", selectColor);
}

// Hover shows preview
function moveEyedropper(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);
    const pixel = ctx.getImageData(x, y, 1, 1).data;

    const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
    previewText.textContent = hex;
    colorDisplay.style.background = hex;
}

// Click selects color
function selectColor(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);
    const p = ctx.getImageData(x, y, 1, 1).data;
    const hex = rgbToHex(p[0], p[1], p[2]);

    inputColor.value = hex;
    updateColor(hex);
}
