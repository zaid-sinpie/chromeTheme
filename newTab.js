const clock = document.querySelector(".clock");
const dateEl = document.querySelector(".date");
const weekDay = document.querySelector(".weekDay");
const leftContainer = document.querySelector(".left-container");

const addShortcut = document.querySelector("#saveShortcut");
const shortcutName = document.querySelector("#name");
const shortcutLink = document.querySelector("#url");

const editBtn = document.querySelector(".edit-btn");
const backgroundUploadBtn = document.getElementById("bgUpload");
const panel = document.querySelector(".panel");

const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");

const particles = [];

function formatDate(dateString) {
  return dateString.split(" ");
}

function updateTime() {
  const now = new Date();

  clock.textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const dateArray = formatDate(now.toDateString());

  weekDay.textContent = now.toLocaleDateString("en-US", {
    weekday: "long",
  });

  dateEl.textContent = dateArray[2];
}

function setBackground(src) {
  document.body.style.backgroundImage = `url(${src})`;

  chrome.storage.local.set({
    wallpaper: src,
  });

  extractTheme(src);
}

function loadStoredWallpaper(data) {
  if (!data.wallpaper) return;

  document.body.style.backgroundImage = `url(${data.wallpaper})`;

  extractTheme(data.wallpaper);
}

function extractTheme(src) {
  const img = new Image();

  img.crossOrigin = "anonymous";
  img.onload = handleImageLoad.bind(null, img);

  img.src = src;
}

function handleImageLoad(img) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = 50;
  canvas.height = 50;

  ctx.drawImage(img, 0, 0, 50, 50);

  const pixels = ctx.getImageData(0, 0, 50, 50).data;

  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    r += pixels[i];
    g += pixels[i + 1];
    b += pixels[i + 2];
    count++;
  }

  r = Math.floor(r / count);
  g = Math.floor(g / count);
  b = Math.floor(b / count);

  const color = `rgb(${r}, ${g}, ${b})`;

  document.documentElement.style.setProperty("--accent", color);
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function createParticles() {
  particles.length = 0;

  for (let i = 0; i < 100; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 1,
      dx: (Math.random() - 0.5) * 0.5,
      dy: (Math.random() - 0.5) * 0.5,
    });
  }
}

function drawParticle(particle) {
  ctx.beginPath();

  ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);

  ctx.fillStyle = "rgba(255,255,255,.5)";
  ctx.fill();
}

function updateParticle(particle) {
  particle.x += particle.dx;
  particle.y += particle.dy;

  if (particle.x < 0 || particle.x > canvas.width) {
    particle.dx *= -1;
  }

  if (particle.y < 0 || particle.y > canvas.height) {
    particle.dy *= -1;
  }
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach(updateParticle);
  particles.forEach(drawParticle);

  requestAnimationFrame(animateParticles);
}

function togglePanel() {
  panel.classList.toggle("active");
}

function handleBackgroundUpload(event) {
  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = handleBackgroundRead;
  reader.readAsDataURL(file);
}

function handleBackgroundRead(event) {
  setBackground(event.target.result);
}

function handleAddShortcut() {
  const name = shortcutName.value.trim();
  const url = shortcutLink.value.trim();

  if (!name || !url) return;

  chrome.bookmarks.getTree((tree) => {
    const bookmarksBarId = tree[0].children.find(
      (node) => node.title === "Bookmarks bar",
    )?.id;

    if (!bookmarksBarId) return;

    chrome.bookmarks.create({
      parentId: bookmarksBarId,
      title: name,
      url: url,
    });
  });
  shortcutName.value = "";
  shortcutLink.value = "";
}

function startClock() {
  updateTime();
  setInterval(updateTime, 1000);
}

function initializeWallpaper() {
  chrome.storage.local.get(["wallpaper"], loadStoredWallpaper);
}

function initializeTheme() {
  extractTheme("default.jpg");
}

function initializeParticles() {
  resizeCanvas();
  createParticles();
  animateParticles();
}

function initializeApp() {
  startClock();
  initializeWallpaper();
  initializeTheme();
  initializeParticles();
}

window.addEventListener("resize", resizeCanvas);

editBtn.addEventListener("click", togglePanel);

backgroundUploadBtn.addEventListener("change", handleBackgroundUpload);

addShortcut.addEventListener("click", handleAddShortcut);

initializeApp();
