'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

function latLngToVector3(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Builds a stylized ocean+landmass+grid equirectangular texture on a canvas,
// so the globe needs no external image asset.
function buildGlobeTexture() {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  const ocean = ctx.createLinearGradient(0, 0, 0, h);
  ocean.addColorStop(0, '#0c4f6e');
  ocean.addColorStop(0.5, '#0a6b8f');
  ocean.addColorStop(1, '#0c4f6e');
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, w, h);

  // Rough, stylized landmass blobs (not geographically precise — decorative).
  const blobs = [
    [[120, 130], [200, 110], [260, 160], [230, 230], [150, 240], [90, 190]], // Europe/Africa-ish
    [[280, 120], [420, 100], [520, 150], [480, 220], [380, 240], [300, 190]], // Asia-ish
    [[560, 260], [640, 250], [660, 320], [600, 360], [540, 320]], // SE Asia-ish
    [[700, 130], [800, 120], [830, 190], [760, 220], [700, 190]], // Australia-ish
    [[850, 90], [920, 80], [950, 140], [900, 170], [850, 140]], // extra island
    [[60, 260], [140, 250], [170, 340], [120, 420], [50, 380]], // Africa lower
    [[810, 300], [880, 290], [900, 360], [850, 400], [800, 360]],
  ];
  ctx.fillStyle = '#1c8a5e';
  blobs.forEach((pts) => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    pts.slice(1).forEach((p) => ctx.lineTo(p[0], p[1]));
    ctx.closePath();
    ctx.fill();
  });

  // Lat/long grid
  ctx.strokeStyle = 'rgba(255,255,255,.16)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += w / 12) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += h / 6) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function buildPinSprite(color) {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, color);
  grad.addColorStop(0.35, color);
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.13, 0, Math.PI * 2);
  ctx.fill();
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export default function Globe3D({ pins = [], onSelectPin, height = 340 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const width = container.clientWidth || 320;
    const heightPx = height;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / heightPx, 0.1, 100);
    camera.position.set(0, 0, 6.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, heightPx);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    renderer.domElement.style.cursor = 'grab';

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const texture = buildGlobeTexture();
    const sphereGeo = new THREE.SphereGeometry(2.4, 48, 48);
    const sphereMat = new THREE.MeshPhongMaterial({ map: texture, shininess: 6, specular: 0x1a4a5c });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(sphere);

    // subtle atmosphere glow
    const glowGeo = new THREE.SphereGeometry(2.5, 48, 48);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x4fc7e8, transparent: true, opacity: 0.12, side: THREE.BackSide });
    globeGroup.add(new THREE.Mesh(glowGeo, glowMat));

    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(4, 3, 5);
    scene.add(dir);

    const pinMeshes = [];
    const pinTexture = buildPinSprite('#faab18');
    pins.forEach((p) => {
      if (typeof p.lat !== 'number' || typeof p.lng !== 'number') return;
      const pos = latLngToVector3(p.lat, p.lng, 2.46);
      const mat = new THREE.SpriteMaterial({ map: pinTexture, depthTest: false, transparent: true });
      const sprite = new THREE.Sprite(mat);
      sprite.position.copy(pos);
      sprite.scale.set(0.34, 0.34, 0.34);
      sprite.userData.pin = p;
      globeGroup.add(sprite);
      pinMeshes.push(sprite);
    });

    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    let dragging = false;
    let moved = false;
    let lastX = 0;
    let lastY = 0;
    let rotY = 0.4;
    let rotX = -0.15;
    let autoRotate = true;

    function applyRotation() {
      globeGroup.rotation.y = rotY;
      globeGroup.rotation.x = Math.max(-0.6, Math.min(0.6, rotX));
    }
    applyRotation();

    function onPointerDown(e) {
      dragging = true;
      moved = false;
      autoRotate = false;
      lastX = e.clientX;
      lastY = e.clientY;
      renderer.domElement.style.cursor = 'grabbing';
    }
    function onPointerMove(e) {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) moved = true;
      rotY += dx * 0.005;
      rotX += dy * 0.005;
      lastX = e.clientX;
      lastY = e.clientY;
      applyRotation();
    }
    function onPointerUp(e) {
      dragging = false;
      renderer.domElement.style.cursor = 'grab';
      if (!moved) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointerNdc, camera);
        const hit = raycaster.intersectObjects(pinMeshes)[0];
        if (hit && onSelectPin) onSelectPin(hit.object.userData.pin);
      }
      setTimeout(() => { autoRotate = true; }, 2500);
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    let raf;
    function tick() {
      if (autoRotate && !dragging) {
        rotY += 0.0016;
        applyRotation();
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    tick();

    function handleResize() {
      const w = container.clientWidth || 320;
      camera.aspect = w / heightPx;
      camera.updateProjectionMatrix();
      renderer.setSize(w, heightPx);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      sphereGeo.dispose();
      sphereMat.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      texture.dispose();
      pinTexture.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins, height]);

  return <div ref={containerRef} style={{ width: '100%', height, touchAction: 'none' }} />;
}
