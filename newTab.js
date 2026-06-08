const clock = document.querySelector(".clock");
const dateEl = document.querySelector(".date");
const weekDay = document.querySelector(".weekDay");
// const month = document.querySelector(".month");

function formatDate(dateString) {
  const dateArray = dateString.split(" ");
  return dateArray;
}

function updateTime() {
  const now = new Date();

  clock.textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const dateArray = formatDate(now.toDateString());

  const weekday = formatDate(
    now.toLocaleDateString("en-US", {
      weekday: "long",
    }),
  );
  dateEl.textContent = dateArray[2];
  // month.textContent = dateArray[1];
  weekDay.textContent = weekday;
}

setInterval(updateTime, 1000);
updateTime();

const panel = document.querySelector(".panel");

document.querySelector(".edit-btn").addEventListener("click", () => {
  panel.classList.toggle("active");
});

function setBackground(src) {
  document.body.style.backgroundImage = `url(${src})`;

  chrome.storage.local.set({
    wallpaper: src,
  });

  extractTheme(src);
}

chrome.storage.local.get(["wallpaper"], (data) => {
  if (data.wallpaper) {
    document.body.style.backgroundImage = `url(${data.wallpaper})`;

    extractTheme(data.wallpaper);
  }
});

document.getElementById("bgUpload").addEventListener("change", (e) => {
  const file = e.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    setBackground(reader.result);
  };

  reader.readAsDataURL(file);
});

function extractTheme(src) {
  const img = new Image();

  img.crossOrigin = "anonymous";

  img.onload = () => {
    const canvas = document.createElement("canvas");

    const ctx = canvas.getContext("2d");

    canvas.width = 50;
    canvas.height = 50;

    ctx.drawImage(img, 0, 0, 50, 50);

    const pixels = ctx.getImageData(0, 0, 50, 50).data;

    let r = 0,
      g = 0,
      b = 0,
      count = 0;

    for (let i = 0; i < pixels.length; i += 4) {
      r += pixels[i];
      g += pixels[i + 1];
      b += pixels[i + 2];

      count++;
    }

    r = Math.floor(r / count);
    g = Math.floor(g / count);
    b = Math.floor(b / count);

    const color = `rgb(${r},${g},${b})`;

    document.documentElement.style.setProperty("--accent", color);
  };

  img.src = src;
}

extractTheme("default.jpg");

const canvas = document.getElementById("particles");

const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;

  canvas.height = window.innerHeight;
}

resize();

window.addEventListener("resize", resize);

const particles = [];

for (let i = 0; i < 100; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,

    r: Math.random() * 2 + 1,

    dx: (Math.random() - 0.5) * 0.5,
    dy: (Math.random() - 0.5) * 0.5,
  });
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach((p) => {
    p.x += p.dx;
    p.y += p.dy;

    if (p.x < 0 || p.x > canvas.width) p.dx *= -1;

    if (p.y < 0 || p.y > canvas.height) p.dy *= -1;

    ctx.beginPath();

    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);

    ctx.fillStyle = "rgba(255,255,255,.5)";

    ctx.fill();
  });

  requestAnimationFrame(animate);
}

animate();
