function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

const supportsFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (supportsFinePointer.matches && !prefersReducedMotion.matches) {
  const particleCanvas = document.createElement('canvas');
  particleCanvas.className = 'cursor-particles';
  particleCanvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(particleCanvas);

  const context = particleCanvas.getContext('2d');

  if (!context) {
    particleCanvas.remove();
  } else {
    const particleLimit = 24;
    const maxDevicePixelRatio = 1.25;
    const particlePalettes = {
      dark: {
        warm: [254, 217, 164],
        hot: [255, 199, 92],
        soft: [255, 255, 255],
        glow: [255, 221, 120],
      },
      light: {
        warm: [217, 119, 6],
        hot: [180, 83, 9],
        soft: [15, 23, 42],
        glow: [245, 158, 11],
      },
    };
    let activeTheme = getCurrentTheme();
    let particleColors = activeTheme === 'light' ? particlePalettes.light : particlePalettes.dark;
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;
    let devicePixelRatio = Math.min(window.devicePixelRatio || 1, maxDevicePixelRatio);
    const particles = [];
    let animationFrameId = 0;
    let lastFrameTime = 0;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let lastSpawnTime = 0;
    let hasPointer = false;

    const resizeCanvas = () => {
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
      devicePixelRatio = Math.min(window.devicePixelRatio || 1, maxDevicePixelRatio);
      particleCanvas.width = Math.round(viewportWidth * devicePixelRatio);
      particleCanvas.height = Math.round(viewportHeight * devicePixelRatio);
      particleCanvas.style.width = `${viewportWidth}px`;
      particleCanvas.style.height = `${viewportHeight}px`;
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };

    const requestRender = () => {
      if (!animationFrameId && particles.length) {
        animationFrameId = window.requestAnimationFrame(renderParticles);
      }
    };

    const syncPalette = () => {
      const theme = getCurrentTheme();
      if (activeTheme === theme) return;
      activeTheme = theme;
      particleColors = theme === 'light' ? particlePalettes.light : particlePalettes.dark;
    };

    const clearParticles = () => {
      particles.length = 0;
      hasPointer = false;
      lastFrameTime = 0;
      context.clearRect(0, 0, viewportWidth, viewportHeight);
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
      }
    };

    const rgba = (channels, alpha) => `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${alpha})`;

    const spawnParticle = (x, y, dx, dy, energy = 1) => {
      if (particles.length >= particleLimit) particles.shift();

      const speed = Math.min(2.45, Math.hypot(dx, dy) * 0.05 + 0.4) * energy;
      const angle = Math.atan2(-dy, -dx) + (Math.random() - 0.5) * 0.9;
      const life = 15 + Math.random() * 10;
      const toneRoll = Math.random();
      particles.push({
        x: x - dx * 0.04,
        y: y - dy * 0.04,
        prevX: x,
        prevY: y,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 0.3,
        vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 0.3,
        life,
        ttl: life,
        size: 1.35 + Math.random() * 1.9,
        tone: toneRoll > 0.82 ? 'soft' : toneRoll > 0.26 ? 'warm' : 'hot',
      });
    };

    function renderParticles(timestamp) {
      syncPalette();
      if (!lastFrameTime) lastFrameTime = timestamp;
      const delta = Math.min(24, timestamp - lastFrameTime);
      lastFrameTime = timestamp;

      context.clearRect(0, 0, viewportWidth, viewportHeight);

      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        particle.prevX = particle.x;
        particle.prevY = particle.y;
        particle.x += particle.vx * delta * 0.06;
        particle.y += particle.vy * delta * 0.06;
        particle.vx *= 0.985;
        particle.vy *= 0.985;
        particle.life -= delta * 0.065;

        if (particle.life <= 0) {
          particles.splice(index, 1);
          continue;
        }

        const progress = particle.life / particle.ttl;
        const trailAlpha = (particle.tone === 'hot' ? 0.44 : particle.tone === 'warm' ? 0.34 : 0.24) * progress;
        const fillAlpha = (particle.tone === 'hot' ? 0.8 : particle.tone === 'warm' ? 0.66 : 0.48) * progress;
        const glowAlpha = (particle.tone === 'soft' ? 0.12 : 0.2) * progress;
        const strokeChannels = particle.tone === 'soft' ? particleColors.soft : particle.tone === 'hot' ? particleColors.hot : particleColors.warm;
        const fillChannels = particle.tone === 'soft' ? particleColors.soft : particle.tone === 'hot' ? particleColors.hot : particleColors.warm;
        const strokeColor = rgba(strokeChannels, trailAlpha);
        const fillColor = rgba(fillChannels, fillAlpha);
        const glowColor = rgba(particle.tone === 'soft' ? fillChannels : particleColors.glow, glowAlpha);

        context.beginPath();
        context.arc(particle.x, particle.y, Math.max(1, particle.size * (0.85 + progress * 0.55)), 0, Math.PI * 2);
        context.fillStyle = glowColor;
        context.fill();

        context.beginPath();
        context.moveTo(particle.prevX, particle.prevY);
        context.lineTo(particle.x, particle.y);
        context.strokeStyle = strokeColor;
        context.lineWidth = Math.max(1, particle.size * (0.35 + progress * 0.55));
        context.lineCap = 'round';
        context.stroke();

        context.beginPath();
        context.arc(particle.x, particle.y, Math.max(0.7, particle.size * (0.38 + progress * 0.72)), 0, Math.PI * 2);
        context.fillStyle = fillColor;
        context.fill();
      }

      if (!particles.length) {
        animationFrameId = 0;
        lastFrameTime = 0;
        context.clearRect(0, 0, viewportWidth, viewportHeight);
        return;
      }

      animationFrameId = window.requestAnimationFrame(renderParticles);
    }

    resizeCanvas();

    document.addEventListener(
      'pointermove',
      (event) => {
        if (event.pointerType && event.pointerType !== 'mouse') return;

        const pointerX = event.clientX;
        const pointerY = event.clientY;
        const now = performance.now();

        if (!hasPointer) {
          hasPointer = true;
          lastPointerX = pointerX;
          lastPointerY = pointerY;
          lastSpawnTime = now;
          return;
        }

        const dx = pointerX - lastPointerX;
        const dy = pointerY - lastPointerY;
        const distance = Math.hypot(dx, dy);
        if (distance < 7 || now - lastSpawnTime < 16) {
          lastPointerX = pointerX;
          lastPointerY = pointerY;
          return;
        }

        const spawnCount = Math.min(3, 1 + Math.floor(distance / 24));
        for (let index = 0; index < spawnCount; index += 1) {
          const offset = (index + 1) / (spawnCount + 1);
          spawnParticle(lastPointerX + dx * offset, lastPointerY + dy * offset, dx, dy);
        }

        lastPointerX = pointerX;
        lastPointerY = pointerY;
        lastSpawnTime = now;
        requestRender();
      },
      { passive: true },
    );

    document.addEventListener(
      'pointerdown',
      (event) => {
        if (event.pointerType && event.pointerType !== 'mouse') return;
        if (!hasPointer) return;

        for (let index = 0; index < 5; index += 1) {
          spawnParticle(lastPointerX, lastPointerY, Math.random() - 0.5, Math.random() - 0.5, 1.25);
        }
        requestRender();
      },
      { passive: true },
    );

    window.addEventListener('resize', resizeCanvas, { passive: true });
    document.addEventListener('mouseout', (event) => {
      if (event.relatedTarget) return;
      clearParticles();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) clearParticles();
    });
    window.addEventListener('blur', clearParticles);
  }
}
