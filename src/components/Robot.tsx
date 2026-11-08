"use client";

import { useEffect, useRef, useState } from "react";
import type * as THREE_NS from "three";

/**
 * Тірі 3D робот (three.js). Басы тінтуірге қарай бұрылады, көзін жыпылықтатады,
 * сәлемдескенде қол бұлғайды, сөйлегенде аузы қимылдайды.
 * `head` — тек басы (кішкентай көмекші батырмасы үшін).
 */
export default function Robot({
  size = 320,
  float = true,
  track = true,
  wave = false,
  talking = false,
  head = false,
  className = "",
}: {
  size?: number;
  float?: boolean;
  track?: boolean;
  wave?: boolean;
  talking?: boolean;
  head?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const live = useRef({ wave, talking, float, track });
  live.current = { wave, talking, float, track };
  const [failed, setFailed] = useState(false);
  const w = size;
  const h = head ? size : Math.round(size * 1.23);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let dispose: (() => void) | undefined;
    let started = false;
    const io = new IntersectionObserver((ents) => {
      const vis = ents.some((e) => e.isIntersecting);
      if (vis && !started) {
        started = true;
        import("three").then((THREE) => import("three/examples/jsm/environments/RoomEnvironment.js").then(({ RoomEnvironment }) => {
          if (!ref.current) return;
          try { dispose = build(THREE, RoomEnvironment, ref.current, w, h, head, live); } catch { setFailed(true); }
        }));
      }
      el.dataset.vis = vis ? "1" : "0";
    }, { rootMargin: "100px" });
    io.observe(el);
    return () => { io.disconnect(); dispose?.(); };
  }, [w, h, head]);

  return (
    <div ref={ref} className={`relative select-none ${className}`} style={{ width: w, height: h }} aria-hidden>
      {failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={size <= 120 ? "/robot/robot-sm.webp" : "/robot/robot.webp"} alt="" className="h-full w-full object-contain" />
      )}
    </div>
  );
}

type Live = { current: { wave: boolean; talking: boolean; float: boolean; track: boolean } };

function build(THREE: typeof THREE_NS, RoomEnvironment: new () => THREE_NS.Scene, el: HTMLDivElement, w: number, h: number, headOnly: boolean, live: Live) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.style.cssText = "width:100%;height:100%;display:block";
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;

  const camera = new THREE.PerspectiveCamera(headOnly ? 26 : 28, w / h, 0.1, 50);
  if (headOnly) { camera.position.set(0, 0.5, 5.2); camera.lookAt(0, 0.42, 0); }
  else { camera.position.set(0, 0.35, 6.9); camera.lookAt(0, 0.05, 0); }

  scene.add(new THREE.HemisphereLight(0xdff4ff, 0x1b2370, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(2.5, 4, 5); scene.add(key);
  const rim = new THREE.PointLight(0x22d3ee, 18, 12); rim.position.set(-3, 1.5, -1.5); scene.add(rim);
  const rim2 = new THREE.PointLight(0x8b5cf6, 14, 12); rim2.position.set(3, -1, -1.5); scene.add(rim2);

  const shell = new THREE.MeshPhysicalMaterial({ color: 0xf5f8fd, roughness: 0.18, metalness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05, iridescence: 0.35, iridescenceIOR: 1.35, sheen: 0.4, sheenColor: new THREE.Color(0x9ad8ff) });
  // Жұмсақ жарқыл (бөлек «bloom» орнына)
  const haloTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d")!; const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, "rgba(120,245,255,1)"); r.addColorStop(0.35, "rgba(56,232,255,.45)"); r.addColorStop(1, "rgba(56,232,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const halo = (sx: number, sy: number, op = 0.8) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false })); m.scale.set(sx, sy, 1); return m; };
  const blue = new THREE.MeshPhysicalMaterial({ color: 0x3b5bdb, roughness: 0.3, metalness: 0.2, clearcoat: 0.8 });
  const dark = new THREE.MeshPhysicalMaterial({ color: 0x060a1f, roughness: 0.06, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.02 });
  const glow = new THREE.MeshStandardMaterial({ color: 0x5ff3ff, emissive: 0x38e8ff, emissiveIntensity: 2.4, roughness: 0.4 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xffb84d, emissive: 0xff9f1c, emissiveIntensity: 1.4 });

  const root = new THREE.Group(); scene.add(root);

  // ── Дене
  const body = new THREE.Group(); root.add(body);
  if (!headOnly) {
    const torso = new THREE.Mesh(new THREE.SphereGeometry(0.62, 48, 32), shell);
    torso.scale.set(1, 1.08, 0.9); torso.position.y = -0.62; body.add(torso);
    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.585, 0.025, 12, 64), glow);
    belt.rotation.x = Math.PI / 2; belt.position.y = -0.78; belt.scale.set(1, 0.92, 1); body.add(belt);
    const core = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.03, 12, 32), glow);
    core.position.set(0, -0.5, 0.555); body.add(core);
    const coreIn = new THREE.Mesh(new THREE.CircleGeometry(0.08, 24), gold);
    coreIn.position.set(0, -0.5, 0.56); body.add(coreIn);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.16, 24), blue);
    neck.position.y = -0.02; body.add(neck);
  }

  // ── Астындағы ұшатын жарық сақина
  const rings: THREE_NS.Mesh[] = [];
  let beam: THREE_NS.Mesh | undefined;
  if (!headOnly) {
    for (const [r, y, op] of [[0.42, -1.42, 1], [0.62, -1.5, 0.55]] as const) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.02, 8, 64), new THREE.MeshBasicMaterial({ color: 0x5ff3ff, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false }));
      ring.rotation.x = Math.PI / 2; ring.position.y = y; root.add(ring); rings.push(ring);
    }
    beam = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.62, 0.55, 48, 1, true), new THREE.MeshBasicMaterial({ color: 0x38e8ff, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.y = -1.22; root.add(beam);
    const thr = halo(0.9, 0.35, 0.9); thr.position.y = -1.36; root.add(thr);
  }

  // ── Қолдар (иық топсасы)
  const arms: THREE_NS.Group[] = [];
  if (!headOnly) for (const s of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(0.56 * s, -0.38, 0); body.add(pivot);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.36, 8, 16), shell);
    arm.position.y = -0.26; pivot.add(arm);
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.022, 8, 24), glow);
    cuff.rotation.x = Math.PI / 2; cuff.position.y = -0.38; pivot.add(cuff);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 16), blue);
    hand.position.y = -0.52; pivot.add(hand);
    const sh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 16), blue); pivot.add(sh);
    pivot.rotation.z = 0.32 * s;
    arms.push(pivot);
  }

  // ── Бас
  const headG = new THREE.Group(); headG.position.y = 0.5; root.add(headG);
  const HX = 0.92, HY = 0.76, HZ = 0.78;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), shell);
  skull.scale.set(HX, HY, HZ); headG.add(skull);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48, Math.PI / 2 - 1.0, 2.0, Math.PI / 2 - 0.62, 1.2), dark);
  visor.scale.set(HX * 1.012, HY * 1.012, HZ * 1.012); headG.add(visor);
  const visorRim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.018, 8, 96), glow);
  visorRim.scale.set(HX * 0.86, HY * 0.6, 1); visorRim.position.z = HZ * 0.66; headG.add(visorRim);

  const onFace = (x: number, y: number) => HZ * 1.02 * Math.sqrt(Math.max(0, 1 - (x / HX) ** 2 - (y / HY) ** 2)) + 0.012;
  const eyes: THREE_NS.Mesh[] = [];
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.13, 8, 16), glow);
    eye.position.set(0.27 * s, 0.06, onFace(0.27, 0.06));
    eye.rotation.y = 0.27 * s * 0.9;
    headG.add(eye); eyes.push(eye);
    const eh = halo(0.42, 0.55, 0.55); eh.position.copy(eye.position); eh.position.z += 0.02; headG.add(eh);
  }
  const face = halo(1.5, 1.0, 0.12); face.position.set(0, 0, HZ + 0.05); headG.add(face);
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.024, 8, 32, Math.PI), glow);
  mouth.rotation.z = Math.PI; mouth.position.set(0, -0.17, onFace(0, -0.17)); headG.add(mouth);
  for (const s of [-1, 1]) {
    const cheek = new THREE.Mesh(new THREE.CircleGeometry(0.05, 20), new THREE.MeshBasicMaterial({ color: 0xff7eb6, transparent: true, opacity: 0.55 }));
    cheek.position.set(0.44 * s, -0.12, onFace(0.44, -0.12)); cheek.rotation.y = 0.55 * s; headG.add(cheek);
  }
  // Құлақтар
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.16, 32), blue);
    ear.rotation.z = Math.PI / 2; ear.position.x = HX * 0.98 * s; headG.add(ear);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.03, 10, 32), s > 0 ? gold : glow);
    ring.rotation.y = Math.PI / 2; ring.position.x = HX * 1.07 * s; headG.add(ring);
  }
  // Антенна
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.28, 12), blue);
  ant.position.y = HY + 0.12; headG.add(ant);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.065, 20, 16), gold);
  bulb.position.y = HY + 0.29; headG.add(bulb);

  // ── Қимыл
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const look = { x: 0, y: 0, tx: 0, ty: 0, last: 0 };
  const onMove = (e: PointerEvent) => {
    if (!live.current.track) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height * (headOnly ? 0.45 : 0.3);
    look.tx = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth * 0.45)));
    look.ty = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight * 0.45)));
    look.last = performance.now();
  };
  window.addEventListener("pointermove", onMove, { passive: true });

  let raf = 0, nextBlink = 1.5, blinkT = -1;
  const clock = new THREE.Clock();
  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (el.dataset.vis === "0") return;
    const t = clock.getElapsedTime();
    const { wave, talking, float } = live.current;
    // Біраз уақыт тінтуір қозғалмаса, айналаға ақырын қарайды
    if (performance.now() - look.last > 3500) { look.tx = Math.sin(t * 0.5) * 0.35; look.ty = Math.sin(t * 0.37) * 0.12; }
    look.x += (look.tx - look.x) * 0.08; look.y += (look.ty - look.y) * 0.08;
    headG.rotation.y = look.x * 0.62;
    headG.rotation.x = look.y * 0.38;
    headG.rotation.z = -look.x * 0.06 + (wave && !reduced ? Math.sin(t * 3) * 0.06 : 0);
    body.rotation.y = look.x * 0.18;
    root.position.y = float && !reduced ? Math.sin(t * 1.6) * 0.07 : 0;
    root.rotation.z = float && !reduced ? Math.sin(t * 0.8) * 0.02 : 0;

    if (arms.length) {
      const [l, r] = arms;
      l.rotation.z = -0.32 - Math.sin(t * 1.6) * 0.04;
      if (wave && !reduced) { r.rotation.z = 2.5 + Math.sin(t * 7) * 0.35; r.rotation.x = -0.2; }
      else { r.rotation.z += (0.32 + Math.sin(t * 1.6) * 0.04 - r.rotation.z) * 0.12; r.rotation.x *= 0.9; }
    }
    // Жыпылықтау
    if (t > nextBlink && blinkT < 0) blinkT = t;
    let sy = 1;
    if (blinkT >= 0) { const k = (t - blinkT) / 0.16; sy = k < 1 ? Math.abs(1 - 2 * k) * 0.9 + 0.1 : 1; if (k >= 1) { blinkT = -1; nextBlink = t + 2.2 + Math.random() * 3; } }
    eyes.forEach((e) => (e.scale.y = sy));
    mouth.scale.set(1, talking ? 0.6 + Math.abs(Math.sin(t * 14)) * 1.1 : 1, 1);
    glow.emissiveIntensity = talking ? 2.6 + Math.sin(t * 10) * 0.6 : 2.4;
    bulb.material === gold && (gold.emissiveIntensity = 1.1 + Math.sin(t * 3) * 0.5);
    rings.forEach((r, i) => { const k = (Math.sin(t * 2.2 + i * 1.3) + 1) / 2; r.scale.setScalar(1 + k * 0.12); (r.material as THREE_NS.MeshBasicMaterial).opacity = (i ? 0.35 : 0.8) + k * 0.2; r.position.y = (i ? -1.5 : -1.42) - root.position.y * 0.6; });
    if (beam) (beam.material as THREE_NS.MeshBasicMaterial).opacity = 0.12 + Math.sin(t * 3) * 0.05;
    renderer.render(scene, camera);
  };
  tick();

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("pointermove", onMove);
    scene.traverse((o) => { const m = o as THREE_NS.Mesh; if (m.geometry) m.geometry.dispose(); });
    [shell, blue, dark, glow, gold].forEach((m) => m.dispose());
    env.dispose(); haloTex.dispose(); pmrem.dispose(); renderer.dispose();
    renderer.domElement.remove();
  };
}
