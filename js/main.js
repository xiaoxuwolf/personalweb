const canvas = document.querySelector(".motion-field");
let width = 0;
let height = 0;
let dots = [];
const nav = document.querySelector(".nav");
const revealSelector = [
  ".reveal",
  ".profile-grid",
  ".profile-copy > *",
  ".contact-strip span",
  ".stats div",
  ".section-head > *",
  ".project-card",
  ".strength-grid article",
  ".closing-inner > *",
  ".closing-actions a",
].join(",");
const revealItems = document.querySelectorAll(revealSelector);
const tiltCards = document.querySelectorAll(".project-card, .strength-grid article");

function resize() {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const ctx = canvas.getContext("2d");
  width = canvas.clientWidth;
  height = canvas.clientHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  dots = Array.from({ length: 72 }, (_, i) => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: 0.8 + Math.random() * 2.4,
    speed: 0.18 + Math.random() * 0.42,
    phase: i * 0.8,
  }));
}

function draw(time) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#0b0d10");
  gradient.addColorStop(0.52, "#17212a");
  gradient.addColorStop(1, "#090a0c");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(185, 217, 210, 0.13)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 9; i += 1) {
    const y = ((time * 0.014 + i * 120) % (height + 160)) - 80;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(width * 0.28, y - 120, width * 0.58, y + 140, width, y - 30);
    ctx.stroke();
  }

  dots.forEach((dot) => {
    dot.y -= dot.speed;
    dot.x += Math.sin(time * 0.001 + dot.phase) * 0.12;
    if (dot.y < -10) dot.y = height + 10;
    ctx.beginPath();
    ctx.fillStyle = "rgba(232, 238, 234, 0.34)";
    ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
    ctx.fill();
  });

  requestAnimationFrame(draw);
}

if (canvas) {
  resize();
  requestAnimationFrame(draw);
  window.addEventListener("resize", resize);
}

function updateNav() {
  nav.classList.toggle("is-scrolled", window.scrollY > 24);
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

revealItems.forEach((item, index) => {
  item.classList.add("reveal");
  item.style.setProperty("--reveal-delay", `${Math.min(index % 8, 7) * 70}ms`);
  revealObserver.observe(item);
});

function revealVisibleItems() {
  revealItems.forEach((item) => {
    if (item.classList.contains("is-visible")) return;
    const rect = item.getBoundingClientRect();
    const entersViewport = rect.top < window.innerHeight * 0.88 && rect.bottom > window.innerHeight * 0.08;
    if (entersViewport) {
      item.classList.add("is-visible");
      revealObserver.unobserve(item);
    }
  });
}

tiltCards.forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `translateY(-8px) rotateX(${(-y * 3).toFixed(2)}deg) rotateY(${(x * 3).toFixed(2)}deg)`;
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});

updateNav();
revealVisibleItems();
window.addEventListener("scroll", () => {
  updateNav();
  revealVisibleItems();
}, { passive: true });
window.addEventListener("resize", revealVisibleItems);
window.addEventListener("load", revealVisibleItems);
