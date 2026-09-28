import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * The Helix hero: a double helix of glowing particles, carried over from
 * the Helix template. Raw three.js, paused when offscreen, and it respects
 * reduced-motion.
 */
// Some devices can't give us WebGL (GPU disabled, low-power mode, too
// many tabs, older phones). The hero must never take the page down with
// it, so check first and fall back to a still glow.
function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    const gl = window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl"));
    gl?.getExtension("WEBGL_lose_context")?.loseContext(); // free the probe's slot
    return !!gl;
  } catch {
    return false;
  }
}

export default function HelixCanvas() {
  const mountRef = useRef(null);
  const [failed, setFailed] = useState(() => !webglAvailable());

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      42,
      mount.clientWidth / mount.clientHeight,
      0.1,
      200
    );
    // a narrow viewport crops the form badly, so pull back on phones
    const baseZ = () => (mount.clientWidth < 700 ? 38 : 26);
    camera.position.set(0, 0, baseZ());

    if (failed) return;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      setFailed(true);
      return;
    }
    // The GPU can also drop the context later (sleep, driver reset).
    const onLost = (e) => {
      e.preventDefault();
      setFailed(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", onLost);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const VIOLET = new THREE.Color("#7c5cff");
    const CYAN = new THREE.Color("#22d3ee");
    const EMBER = new THREE.Color("#ff8a5c");

    // ---- helix strands -------------------------------------------------
    const TURNS = 5;
    const PER_TURN = 68;
    const COUNT = TURNS * PER_TURN;
    const RADIUS = 5.4;
    const HEIGHT = 30;

    const positions = new Float32Array(COUNT * 2 * 3);
    const colors = new Float32Array(COUNT * 2 * 3);
    const sizes = new Float32Array(COUNT * 2);
    const seeds = new Float32Array(COUNT * 2);

    const strandA = [];
    const strandB = [];

    for (let i = 0; i < COUNT; i++) {
      const t = i / COUNT;
      const angle = t * Math.PI * 2 * TURNS;
      const y = (t - 0.5) * HEIGHT;
      // gentle waist so the strand reads as a form, not a tube
      const r = RADIUS * (0.78 + 0.22 * Math.cos(t * Math.PI * 2));

      const ax = Math.cos(angle) * r;
      const az = Math.sin(angle) * r;
      const bx = Math.cos(angle + Math.PI) * r;
      const bz = Math.sin(angle + Math.PI) * r;

      strandA.push(new THREE.Vector3(ax, y, az));
      strandB.push(new THREE.Vector3(bx, y, bz));

      const c1 = VIOLET.clone().lerp(CYAN, t);
      const c2 = CYAN.clone().lerp(t > 0.6 ? EMBER : VIOLET, t);

      for (const [idx, x, yy, z, c] of [
        [i * 2, ax, y, az, c1],
        [i * 2 + 1, bx, y, bz, c2],
      ]) {
        positions[idx * 3] = x;
        positions[idx * 3 + 1] = yy;
        positions[idx * 3 + 2] = z;
        colors[idx * 3] = c.r;
        colors[idx * 3 + 1] = c.g;
        colors[idx * 3 + 2] = c.b;
        sizes[idx] = 12 + Math.random() * 16;
        seeds[idx] = Math.random() * 100;
      }
    }

    const helixGeo = new THREE.BufferGeometry();
    helixGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    helixGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    helixGeo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    helixGeo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

    const pointMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 1 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: /* glsl */ `
        attribute float aSize;
        attribute float aSeed;
        uniform float uTime;
        uniform float uPixelRatio;
        varying vec3 vColor;
        varying float vFade;
        void main() {
          vColor = color;
          vec3 p = position;
          // breathing shimmer along the strand
          float pulse = sin(uTime * 1.4 + aSeed) * 0.5 + 0.5;
          p.x += sin(uTime * 0.6 + aSeed) * 0.10;
          p.z += cos(uTime * 0.6 + aSeed) * 0.10;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          // dim the points travelling around the back of the form.
          // mv.z sits roughly in [-34, -18] for this camera, so the
          // smoothstep has to span that range, not a 0-centred one.
          float depth = 0.3 + 0.7 * smoothstep(-34.0, -18.0, mv.z);
          vFade = depth * (0.45 + 0.55 * pulse);
          gl_PointSize = aSize * uPixelRatio * (1.0 + pulse * 0.35) * (18.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uOpacity;
        varying vec3 vColor;
        varying float vFade;
        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          if (d > 0.5) discard;
          float core = smoothstep(0.5, 0.0, d);
          float glow = pow(core, 3.0);
          gl_FragColor = vec4(vColor * (0.32 + glow * 1.15), glow * vFade * uOpacity);
        }
      `,
      vertexColors: true,
    });

    const helixPoints = new THREE.Points(helixGeo, pointMat);
    group.add(helixPoints);

    // ---- rungs between the strands -------------------------------------
    const rungVerts = [];
    const rungColors = [];
    for (let i = 0; i < COUNT; i += 5) {
      const a = strandA[i];
      const b = strandB[i];
      rungVerts.push(a.x, a.y, a.z, b.x, b.y, b.z);
      const c = VIOLET.clone().lerp(CYAN, i / COUNT);
      rungColors.push(c.r, c.g, c.b, c.r, c.g, c.b);
    }
    const rungGeo = new THREE.BufferGeometry();
    rungGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(rungVerts, 3)
    );
    rungGeo.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(rungColors, 3)
    );
    const rungs = new THREE.LineSegments(
      rungGeo,
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    group.add(rungs);

    // ---- ambient dust ---------------------------------------------------
    const DUST = 420;
    const dustPos = new Float32Array(DUST * 3);
    const dustCol = new Float32Array(DUST * 3);
    const dustSize = new Float32Array(DUST);
    const dustSeed = new Float32Array(DUST);
    for (let i = 0; i < DUST; i++) {
      const r = 10 + Math.random() * 26;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      dustPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 42;
      dustPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      const c =
        Math.random() > 0.88
          ? EMBER.clone()
          : VIOLET.clone().lerp(CYAN, Math.random());
      dustCol[i * 3] = c.r;
      dustCol[i * 3 + 1] = c.g;
      dustCol[i * 3 + 2] = c.b;
      dustSize[i] = 4 + Math.random() * 9;
      dustSeed[i] = Math.random() * 100;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    dustGeo.setAttribute("color", new THREE.BufferAttribute(dustCol, 3));
    dustGeo.setAttribute("aSize", new THREE.BufferAttribute(dustSize, 1));
    dustGeo.setAttribute("aSeed", new THREE.BufferAttribute(dustSeed, 1));
    const dustMat = pointMat.clone();
    dustMat.uniforms.uOpacity.value = 0.5;
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    // ---- interaction ----------------------------------------------------
    const pointer = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    const onPointerMove = (e) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    let scrollY = 0;
    const onScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const onResize = () => {
      if (!mount.clientWidth) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // pause when offscreen so we never burn battery below the fold
    let visible = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    io.observe(mount);

    const clock = new THREE.Clock();
    let raf;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;

      const t = clock.getElapsedTime();
      pointer.x += (target.x - pointer.x) * 0.05;
      pointer.y += (target.y - pointer.y) * 0.05;

      pointMat.uniforms.uTime.value = t;
      dustMat.uniforms.uTime.value = t * 0.4;

      if (!reduced) {
        group.rotation.y = t * 0.16 + pointer.x * 0.5;
        group.rotation.x = -pointer.y * 0.22;
        group.rotation.z = Math.sin(t * 0.22) * 0.05;
        dust.rotation.y = -t * 0.03;
      }

      // drift the form up as the hero scrolls away
      group.position.y = scrollY * 0.012;
      camera.position.z = baseZ() + Math.min(scrollY, 900) * 0.006;

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      renderer.domElement.removeEventListener("webglcontextlost", onLost);
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      helixGeo.dispose();
      rungGeo.dispose();
      dustGeo.dispose();
      pointMat.dispose();
      dustMat.dispose();
      rungs.material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [failed]);

  if (failed) return <div className="helix-fallback" aria-hidden="true" />;

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    />
  );
}
