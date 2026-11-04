"use client";
import { useEffect, useRef, useState } from "react";
import AuthScene from "./AuthScene";

/**
 * Кіру бетінің 3D фоны (three.js): ноутбук (экранда код), кітаптар, қалқып жүрген фигуралар,
 * жарқыраған желі. Тінтуір қозғалғанда камера сәл бұрылады. WebGL болмаса, жай SVG фон көрсетіледі.
 */
export default function AuthScene3D() {
  const host = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    if (!window.matchMedia("(min-width: 1024px)").matches) { setFallback(true); return; }
    (async () => {
      const THREE = await import("three");
      const { RoundedBoxGeometry } = await import("three/examples/jsm/geometries/RoundedBoxGeometry.js");
      const el = host.current;
      if (!el || disposed) return;
      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      } catch {
        setFallback(true);
        return;
      }
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x0b1230, 9, 22);
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      const camBase = new THREE.Vector3(0, 1.1, 9);

      // Жарық
      scene.add(new THREE.HemisphereLight(0x8fa8ff, 0x0b1230, 0.9));
      const key = new THREE.DirectionalLight(0xffffff, 1.6);
      key.position.set(3, 6, 5);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.left = -8; key.shadow.camera.right = 8; key.shadow.camera.top = 6; key.shadow.camera.bottom = -6;
      scene.add(key);
      const blue = new THREE.PointLight(0x3b82f6, 40, 14); blue.position.set(-4, 1.5, 3); scene.add(blue);
      const violet = new THREE.PointLight(0xa855f7, 35, 14); violet.position.set(4, 2, 2); scene.add(violet);
      const screenGlow = new THREE.PointLight(0x7c8cff, 18, 6); scene.add(screenGlow);

      // Үстел
      const desk = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshStandardMaterial({ color: 0x141a42, roughness: 0.35, metalness: 0.5 }));
      desk.rotation.x = -Math.PI / 2; desk.position.y = -1.6; desk.receiveShadow = true; scene.add(desk);

      // Экран текстурасы: код жолдары
      const cv = document.createElement("canvas"); cv.width = 1024; cv.height = 640;
      const g = cv.getContext("2d")!;
      const colors = ["#C084FC", "#60A5FA", "#F472B6", "#34D399", "#FBBF24", "#A5B4FC"];
      const lines = Array.from({ length: 16 }, (_, i) => ({ indent: [0, 1, 1, 2, 2, 3, 2, 1, 2, 3, 3, 2, 1, 1, 0, 0][i], parts: Array.from({ length: 1 + ((i * 7) % 3) }, (_, k) => ({ w: 60 + ((i * 37 + k * 53) % 150), c: colors[(i + k * 2) % colors.length] })) }));
      let typed = 0;
      function drawScreen(t: number) {
        const grad = g.createLinearGradient(0, 0, 0, 640); grad.addColorStop(0, "#151c42"); grad.addColorStop(1, "#0a0f28");
        g.fillStyle = grad; g.fillRect(0, 0, 1024, 640);
        g.fillStyle = "#1d2552"; g.fillRect(0, 0, 1024, 44);
        ["#F87171", "#FBBF24", "#34D399"].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(30 + i * 26, 22, 8, 0, 7); g.fill(); });
        g.fillStyle = "#2a3366"; g.fillRect(0, 44, 200, 596);
        for (let i = 0; i < 12; i++) { g.fillStyle = i === 3 ? "#3b4a9a" : "#323c78"; g.fillRect(24, 76 + i * 40, 120 - (i % 3) * 22, 12); }
        const shown = Math.floor(typed);
        lines.forEach((ln, i) => {
          if (i > shown) return;
          let x = 236 + ln.indent * 36; const y = 78 + i * 34;
          g.fillStyle = "#4a5590"; g.font = "18px monospace"; g.fillText(String(i + 1).padStart(2, " "), 210 - 4, y + 12);
          ln.parts.forEach((p) => { g.fillStyle = p.c; g.globalAlpha = 0.9; roundRect(x, y, p.w, 14, 7); g.fill(); x += p.w + 16; });
          g.globalAlpha = 1;
          if (i === shown && Math.floor(t * 2) % 2 === 0) { g.fillStyle = "#E0E7FF"; g.fillRect(x, y - 4, 4, 22); }
        });
      }
      function roundRect(x: number, y: number, w: number, h: number, r: number) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
      drawScreen(0);
      const screenTex = new THREE.CanvasTexture(cv); screenTex.colorSpace = THREE.SRGBColorSpace; screenTex.anisotropy = 8;

      // Ноутбук
      const laptop = new THREE.Group();
      const alu = new THREE.MeshStandardMaterial({ color: 0x3a4377, metalness: 0.8, roughness: 0.28 });
      const base = new THREE.Mesh(new RoundedBoxGeometry(4.4, 0.16, 3, 4, 0.06), alu); base.castShadow = true; base.receiveShadow = true; laptop.add(base);
      const kb = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 1.5), new THREE.MeshStandardMaterial({ color: 0x1a2048, roughness: 0.8 }));
      kb.rotation.x = -Math.PI / 2; kb.position.set(0, 0.085, -0.25); laptop.add(kb);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 12; c++) {
        const k = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.03, 0.26), new THREE.MeshStandardMaterial({ color: 0x2b3368, roughness: 0.6 }));
        k.position.set(-1.7 + c * 0.31, 0.1, -0.85 + r * 0.34); laptop.add(k);
      }
      const pad = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.75), new THREE.MeshStandardMaterial({ color: 0x323b72, roughness: 0.4, metalness: 0.4 }));
      pad.rotation.x = -Math.PI / 2; pad.position.set(0, 0.082, 0.95); laptop.add(pad);
      const lid = new THREE.Group(); lid.position.set(0, 0.08, -1.5); laptop.add(lid);
      const lidBox = new THREE.Mesh(new RoundedBoxGeometry(4.4, 2.8, 0.12, 4, 0.06), alu); lidBox.position.y = 1.4; lidBox.castShadow = true; lid.add(lidBox);
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(4.1, 2.56), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
      screen.position.set(0, 1.4, 0.065); lid.add(screen);
      lid.rotation.x = -0.22;
      laptop.position.set(-0.2, -1.6, 0.4); laptop.rotation.y = 0.32;
      laptop.scale.setScalar(0.95);
      scene.add(laptop);
      screenGlow.position.set(-0.4, 0.4, 1.6);

      // Кітаптар
      const books = new THREE.Group();
      const bookColors = [0x2e3a8c, 0x5b3aa8, 0x1e4f8f, 0x7c3aed, 0x334155];
      let y = 0;
      bookColors.forEach((c, i) => {
        const h = 0.28 + (i % 2) * 0.08;
        const b = new THREE.Mesh(new RoundedBoxGeometry(2.1 - i * 0.08, h, 1.5, 3, 0.04), new THREE.MeshStandardMaterial({ color: c, roughness: 0.55 }));
        b.position.set((i % 2 ? 0.08 : -0.06), y + h / 2, 0); b.rotation.y = (i % 3 - 1) * 0.08; b.castShadow = true; b.receiveShadow = true;
        const pages = new THREE.Mesh(new THREE.BoxGeometry(2.0 - i * 0.08, h * 0.7, 1.42), new THREE.MeshStandardMaterial({ color: 0xe8e6f5, roughness: 0.9 }));
        pages.position.x = 0.04; b.add(pages);
        books.add(b); y += h;
      });
      books.position.set(4.3, -1.6, -0.6); books.rotation.y = -0.4; scene.add(books);

      // Гүл (кәстрөл + жапырақтар)
      const plant = new THREE.Group();
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.3, 0.7, 32), new THREE.MeshStandardMaterial({ color: 0x1f2a5a, roughness: 0.5 }));
      pot.position.y = 0.35; pot.castShadow = true; plant.add(pot);
      for (let i = 0; i < 9; i++) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x1e8a5e : 0x27a372, roughness: 0.6 }));
        leaf.scale.set(0.45, 1.6, 0.2);
        const a = (i / 9) * Math.PI * 2;
        leaf.position.set(Math.cos(a) * 0.18, 1.0 + (i % 3) * 0.12, Math.sin(a) * 0.18);
        leaf.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
        leaf.castShadow = true; plant.add(leaf);
      }
      plant.position.set(2.9, -1.6, -1.6); scene.add(plant);

      // Қалқып жүрген фигуралар
      const glass = (c: number) => new THREE.MeshPhysicalMaterial({ color: c, metalness: 0.1, roughness: 0.15, transmission: 0.35, thickness: 0.5, clearcoat: 1, emissive: c, emissiveIntensity: 0.25 });
      const floaters: { m: import("three").Mesh; base: import("three").Vector3; sp: number; ph: number }[] = [];
      const addF = (geo: import("three").BufferGeometry, c: number, x: number, yy: number, z: number, s = 1) => {
        const m = new THREE.Mesh(geo, glass(c)); m.position.set(x, yy, z); m.scale.setScalar(s); m.castShadow = true; scene.add(m);
        floaters.push({ m, base: m.position.clone(), sp: 0.5 + Math.random() * 0.6, ph: Math.random() * 6 });
      };
      addF(new THREE.IcosahedronGeometry(0.45, 0), 0x60a5fa, 1.9, 2.3, -1.5);
      addF(new THREE.TorusGeometry(0.38, 0.13, 24, 64), 0xc084fc, 3.6, 0.9, -0.5);
      addF(new RoundedBoxGeometry(0.5, 0.5, 0.5, 4, 0.12), 0x3b82f6, 2.3, 0.2, 1.4);
      addF(new THREE.OctahedronGeometry(0.35, 0), 0xf472b6, 0.6, 3.0, -2.5);
      addF(new THREE.SphereGeometry(0.25, 32, 24), 0x34d399, 2.6, -0.2, 1.2);
      addF(new THREE.TorusKnotGeometry(0.22, 0.08, 96, 12), 0xfbbf24, 3.2, 2.9, -2.4);

      // «</>» белгісі (3D жазу орнына шыны пластина)
      const tagCv = document.createElement("canvas"); tagCv.width = 256; tagCv.height = 128;
      const tg = tagCv.getContext("2d")!; tg.fillStyle = "#fff"; tg.font = "bold 84px monospace"; tg.textAlign = "center"; tg.textBaseline = "middle"; tg.fillText("</>", 128, 68);
      const tagTex = new THREE.CanvasTexture(tagCv); tagTex.colorSpace = THREE.SRGBColorSpace;
      const tag = new THREE.Mesh(new RoundedBoxGeometry(1.1, 0.62, 0.12, 4, 0.08), [glass(0x6366f1), glass(0x6366f1), glass(0x6366f1), glass(0x6366f1), new THREE.MeshBasicMaterial({ map: tagTex, transparent: true, color: 0xffffff }), glass(0x6366f1)]);
      tag.position.set(1.0, 2.1, 0.2); tag.rotation.set(0.1, -0.3, 0.1); scene.add(tag);
      floaters.push({ m: tag as unknown as import("three").Mesh, base: tag.position.clone(), sp: 0.7, ph: 1 });

      // Желі (нүктелер + сызықтар)
      const pts: import("three").Vector3[] = [];
      for (let i = 0; i < 46; i++) pts.push(new THREE.Vector3((Math.random() - 0.5) * 18, 1 + Math.random() * 5, -6 - Math.random() * 4));
      const dots = new THREE.Points(new THREE.BufferGeometry().setFromPoints(pts), new THREE.PointsMaterial({ color: 0xc7d2fe, size: 0.09, transparent: true, opacity: 0.9 }));
      scene.add(dots);
      const seg: import("three").Vector3[] = [];
      pts.forEach((a, i) => pts.forEach((b, j) => { if (j > i && a.distanceTo(b) < 2.6) seg.push(a, b); }));
      const net = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(seg), new THREE.LineBasicMaterial({ color: 0x8b9cff, transparent: true, opacity: 0.22 }));
      scene.add(net);

      // Өлшем
      function resize() {
        const w = el!.clientWidth, h = el!.clientHeight;
        renderer.setSize(w, h, false);
        renderer.domElement.style.width = "100%"; renderer.domElement.style.height = "100%";
        camera.aspect = w / h;
        // Тар экранда сахна кішірек көрінсін
        camera.position.z = camBase.z * Math.max(1, 1.5 / camera.aspect);
        camera.updateProjectionMatrix();
      }
      resize();
      window.addEventListener("resize", resize);
      const mouse = { x: 0, y: 0 };
      const onMove = (e: PointerEvent) => { mouse.x = e.clientX / window.innerWidth - 0.5; mouse.y = e.clientY / window.innerHeight - 0.5; };
      window.addEventListener("pointermove", onMove);

      const clock = new THREE.Clock();
      let raf = 0;
      function frame() {
        const t = clock.getElapsedTime();
        if (!reduce) {
          floaters.forEach((f, i) => {
            f.m.position.y = f.base.y + Math.sin(t * f.sp + f.ph) * 0.18;
            f.m.rotation.x += 0.004 + i * 0.0006; f.m.rotation.y += 0.006;
          });
          laptop.position.y = -1.6 + Math.sin(t * 0.8) * 0.02;
          net.rotation.y = Math.sin(t * 0.05) * 0.05;
          typed = (t * 1.6) % (lines.length + 6);
          drawScreen(t); screenTex.needsUpdate = true;
        }
        camera.position.x += (camBase.x + mouse.x * 0.8 - camera.position.x) * 0.04;
        camera.position.y += (camBase.y - mouse.y * 0.5 - camera.position.y) * 0.04;
        camera.lookAt(0, 0.2, 0);
        renderer.render(scene, camera);
        raf = requestAnimationFrame(frame);
      }
      typed = lines.length; drawScreen(0); screenTex.needsUpdate = true;
      frame();
      el.dataset.ready = "1";

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", resize);
        window.removeEventListener("pointermove", onMove);
        scene.traverse((o) => {
          const m = o as import("three").Mesh;
          m.geometry?.dispose?.();
          const mat = m.material as import("three").Material | import("three").Material[] | undefined;
          (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
        });
        screenTex.dispose(); tagTex.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })().catch(() => setFallback(true));
    return () => { disposed = true; cleanup(); };
  }, []);

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_15%,rgba(79,70,229,.55),transparent_60%),radial-gradient(ellipse_at_80%_70%,rgba(147,51,234,.35),transparent_55%)] bg-[#0B1230]" />
      {fallback ? <AuthScene /> : <div ref={host} className="absolute inset-0" />}
    </div>
  );
}
