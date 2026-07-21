AOS.init({
  duration: 700,
  once: true,
});

// Particles background
tsParticles.load("tsparticles", {
  fpsLimit: 60,
  particles: {
    number: { value: 60 },
    color: { value: ["#7b61ff", "#ffffff"] },
    shape: { type: "circle" },
    opacity: { value: 0.6 },
    size: { value: { min: 1, max: 4 } },
    links: {
      enable: true,
      distance: 140,
      color: "#7b61ff",
      opacity: 0.15,
    },
    move: { enable: true, speed: 0.7 }
  }
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor=>{
  anchor.addEventListener('click',(e)=>{
    const t=document.querySelector(anchor.getAttribute('href'));
    if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth'});}
  });
});
