'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const TEX_BASE = '/assets/globe';

function latLngToVector3(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
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
  return new THREE.CanvasTexture(canvas);
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

    const loader = new THREE.TextureLoader();
    const albedoTex = loader.load(`${TEX_BASE}/earth-albedo.jpg`);
    const nightTex = loader.load(`${TEX_BASE}/earth-night.jpg`);
    const bumpTex = loader.load(`${TEX_BASE}/earth-bump.jpg`);
    const cloudsTex = loader.load(`${TEX_BASE}/earth-clouds.png`);
    if ('colorSpace' in albedoTex) {
      albedoTex.colorSpace = THREE.SRGBColorSpace;
      nightTex.colorSpace = THREE.SRGBColorSpace;
    }

    const sphereGeo = new THREE.SphereGeometry(2.4, 64, 64);
    const sphereMat = new THREE.MeshPhongMaterial({
      map: albedoTex,
      bumpMap: bumpTex,
      bumpScale: 0.04,
      emissiveMap: nightTex,
      emissive: new THREE.Color(0xffe9b0),
      emissiveIntensity: 0.9,
      shininess: 5,
      specular: 0x223344,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(sphere);

    // Cloud layer, slightly larger, rotates independently for parallax.
    const cloudsGeo = new THREE.SphereGeometry(2.428, 64, 64);
    const cloudsMat = new THREE.MeshLambertMaterial({ map: cloudsTex, transparent: true, opacity: 0.55, depthWrite: false });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    globeGroup.add(cloudsMesh);

    // Subtle atmosphere glow
    const glowGeo = new THREE.SphereGeometry(2.52, 48, 48);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x4fc7e8, transparent: true, opacity: 0.1, side: THREE.BackSide });
    globeGroup.add(new THREE.Mesh(glowGeo, glowMat));

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const dir = new THREE.DirectionalLight(0xffffff, 1.1);
    dir.position.set(4, 3, 5);
    scene.add(dir);

    const pinMeshes = [];
    const pinTexture = buildPinSprite('#faab18');
    pins.forEach((p) => {
      if (typeof p.lat !== 'number' || typeof p.lng !== 'number') return;
      const pos = latLngToVector3(p.lat, p.lng, 2.5);
      const mat = new THREE.SpriteMaterial({ map: pinTexture, depthTest: false, transparent: true });
      const sprite = new THREE.Sprite(mat);
      sprite.position.copy(pos);
      sprite.scale.set(0.42, 0.42, 0.42);
      sprite.userData.pin = p;
      sprite.userData.baseScale = 0.42;
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
    let t = 0;
    function tick() {
      if (autoRotate && !dragging) {
        rotY += 0.0016;
        applyRotation();
      }
      cloudsMesh.rotation.y += 0.00035;
      t += 0.045;
      pinMeshes.forEach((sprite, i) => {
        const s = sprite.userData.baseScale * (1 + Math.sin(t + i) * 0.12);
        sprite.scale.set(s, s, s);
      });
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    tick();

    function handleResize() {
      const w = container.clientWidth || 320;
      if (w === 0) return;
      camera.aspect = w / heightPx;
      camera.updateProjectionMatrix();
      renderer.setSize(w, heightPx);
    }
    window.addEventListener('resize', handleResize);
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);
    const settleTimer = setTimeout(handleResize, 50);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settleTimer);
      ro.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      sphereGeo.dispose();
      sphereMat.dispose();
      cloudsGeo.dispose();
      cloudsMat.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      albedoTex.dispose();
      nightTex.dispose();
      bumpTex.dispose();
      cloudsTex.dispose();
      pinTexture.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins, height]);

  return <div ref={containerRef} style={{ width: '100%', height, touchAction: 'none' }} />;
}
