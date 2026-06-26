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

const shotcutsContainer = document.querySelector(".shortcuts-container");

const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");
const particleColorSelector = document.querySelector(".particleColorSelector");

const particles = [];
let particleColor = "rgba(255,255,255,.5)";

let musicTabId = null;
const playBtn = document.querySelector(".play-btn");
const controlBtnLeft = document.querySelectorAll(".control-btn")[0];
const controlBtnRight = document.querySelectorAll(".control-btn")[1];
const title = document.querySelector(".song-title");

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

  ctx.fillStyle = particleColor;
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

function removePanel(e) {
  if (e.key === "Escape") {
    panel.classList.remove("active");
  }
}

function handleBackgroundUpload(event) {
  const file = event.target.files[0];

  if (!file) return;

  const maxSize = 2 * 1024 * 1024;

  if (file.size > maxSize) {
    alert("Please select an image smaller than 2 MB.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = handleBackgroundRead;
  reader.readAsDataURL(file);
}

function handleBackgroundRead(event) {
  setBackground(event.target.result);
}

function getFavicon(url) {
  const domain = new URL(url).hostname;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

function addShortcutToUI(bookmark) {
  const shortcut = document.createElement("a");

  shortcut.href = bookmark.url;
  shortcut.className = "shortcut";
  shortcut.id = bookmark.id;
  shortcut.title = bookmark.title;

  const favicon = document.createElement("img");

  favicon.src = `/_favicon/?pageUrl=${encodeURIComponent(
    bookmark.url,
  )}&size=64`;

  favicon.onerror = () => {
    favicon.src = getFavicon(bookmark.url);
  };

  favicon.width = 16;
  favicon.height = 16;
  favicon.alt = bookmark.title;

  shortcut.appendChild(favicon);

  shotcutsContainer.appendChild(shortcut);
}

function handleAddShortcut() {
  const name = shortcutName.value.trim();
  const url = shortcutLink.value.trim();

  if (!name || !url) return;

  chrome.bookmarks.getTree((tree) => {
    const bookmarksBarId = tree[0].children.find(
      (node) => node.title === "Bookmarks bar",
    )?.id;

    if (!bookmarksBarId) {
      console.error("Bookmarks Bar not found");
      return;
    }

    chrome.bookmarks.create(
      {
        parentId: bookmarksBarId,
        title: name,
        url: url,
      },
      (bookmark) => {
        shortcutName.value = "";
        shortcutLink.value = "";
      },
    );

    shotcutsContainer.classList.remove("hidden");
  });
}

function loadBookmarks() {
  chrome.bookmarks.getTree((tree) => {
    const bookmarksBar = tree[0].children.find(
      (node) => node.title === "Bookmarks bar",
    );

    if (bookmarksBar.children.length === 0) {
      shotcutsContainer.classList.add("hidden");
      return;
    }

    shotcutsContainer.innerHTML = "";

    bookmarksBar.children.forEach((bookmark) => {
      if (bookmark.url) {
        addShortcutToUI(bookmark);
      }
    });
  });
}

function handleBookmarkCreated(id, bookmark) {
  shotcutsContainer.classList.remove("hidden");

  addShortcutToUI({
    ...bookmark,
    id,
  });
}

function handleBookmarRemove(id, removeInfo) {
  const shortcut = document.getElementById(id);

  if (shortcut) {
    shortcut.remove();
  }

  if (shotcutsContainer.children.length === 0) {
    shotcutsContainer.classList.add("hidden");
  }
}

function startClock() {
  updateTime();
  setInterval(updateTime, 1000);
}

function initializeParticleColor() {
  chrome.storage.local.get("particleColor", (result) => {
    if (result.particleColor) {
      particleColor = result.particleColor;
      particleColorSelector.value = result.particleColor;
    }
  });
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
  initializeParticleColor();
}

function initializeApp() {
  startClock();
  initializeWallpaper();
  initializeTheme();
  initializeParticles();
}

function particleColorChange(e) {
  particleColor = e.target.value;

  chrome.storage.local.set({
    particleColor: particleColor,
  });
}

function updateSongTitle() {
  chrome.scripting.executeScript(
    {
      target: { tabId: musicTabId },
      func: () => {
        return document
          .querySelector("yt-formatted-string.style-scope.ytd-watch-metadata")
          ?.textContent?.trim();
      },
    },
    ([result]) => {
      if (!result?.result) return;

      title.textContent = result.result;
    },
  );
}

async function openPlaylist(
  url = "https://www.youtube.com/watch?v=zVvdjlgHAag&list=PLu761XO9d923AJCyGvwEnAaYcRboL8CSk",
) {
  const tabs = await chrome.tabs.query({});

  const existingTab = tabs.find((tab) => {
    return tab.url === url;
  });

  if (existingTab) {
    musicTabId = existingTab.id;

    if (!existingTab.pinned) {
      chrome.tabs.update(existingTab.id, {
        pinned: true,
      });
    }

    return;
  }

  const tab = await chrome.tabs.create({
    url,
    active: false,
    pinned: true,
  });

  musicTabId = tab.id;
}

function playPause() {
  chrome.scripting.executeScript(
    {
      target: { tabId: musicTabId },
      func: () => {
        const video = document.querySelector("video");

        if (!video) return null;

        if (video.paused) {
          video.play();
          return true;
        } else {
          video.pause();
          return false;
        }
      },
    },
    (results) => {
      if (!results?.length) return;

      const isPlaying = results[0].result;

      playBtn.textContent = isPlaying ? "⏸" : "▶";

      setTimeout(updateSongTitle, 2000);
    },
  );
}

function nextSong() {
  chrome.scripting.executeScript({
    target: { tabId: musicTabId },
    func: () => {
      document.querySelector(".ytp-next-button")?.click();
    },
  });

  playBtn.textContent = "⏸";

  setTimeout(updateSongTitle, 2000);
}

function previousSong() {
  chrome.scripting.executeScript({
    target: { tabId: musicTabId },
    func: () => {
      const current = document.querySelector(
        "ytd-playlist-panel-video-renderer[selected]",
      );

      const previous = current?.previousElementSibling;

      previous?.querySelector("a")?.click();
    },
  });

  playBtn.textContent = "⏸";

  setTimeout(updateSongTitle, 2000);
}

playBtn.addEventListener("click", playPause);

controlBtnLeft.addEventListener("click", previousSong);

controlBtnRight.addEventListener("click", nextSong);

openPlaylist();

particleColorSelector.addEventListener("change", particleColorChange);

window.addEventListener("resize", resizeCanvas);

editBtn.addEventListener("click", togglePanel);
document.addEventListener("keydown", removePanel);

backgroundUploadBtn.addEventListener("change", handleBackgroundUpload);

addShortcut.addEventListener("click", handleAddShortcut);

document.addEventListener("DOMContentLoaded", loadBookmarks);

chrome.bookmarks.onRemoved.addListener(handleBookmarRemove);
chrome.bookmarks.onCreated.addListener(handleBookmarkCreated);

initializeApp();
