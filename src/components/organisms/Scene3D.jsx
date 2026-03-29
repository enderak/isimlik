import React, { useState, useMemo } from 'react';
import { Text3D, Center, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

/**
 * KAMA (WEDGE) GEOMETRİSİ - DOĞRU YÖN
 *
 * Yan görünüm (sağdan bakış):
 *
 *   ████████  ← Harfler (dikey)
 *   █      █
 *   █      █─────────────────┐  ← Üst yüzey eğimli (öne doğru alçalır)
 *   █      │                 │
 *   ████████─────────────────┘
 *   ▲ ÖN (tall = harfler burada dikey durur)
 *                             ▲ ARKA (thin = sadece plaka kalınlığı)
 *
 * Öne baktığında harfleri görürsün.
 * Arka yüzey ince → destek materyali GEREKMEZ (support-free FDM)
 */
function createWedgeGeometry(W, frontH, backH, D) {
  const geo = new THREE.BufferGeometry();
  const hw = W / 2;
  const hd = D / 2;

  // frontH = tall (ön, görüntüleyiciye bakan)
  // backH  = short (arka, masaya gömülen taraf)
  const positions = new Float32Array([
    // ÖN YÜZ (z = +hd) — UZUN, harfler burada
    -hw,      0,  hd,  // 0: ön-alt-sol
     hw,      0,  hd,  // 1: ön-alt-sağ
     hw, frontH,  hd,  // 2: ön-üst-sağ
    -hw, frontH,  hd,  // 3: ön-üst-sol
    // ARKA YÜZ (z = -hd) — KISA
    -hw,     0, -hd,   // 4: arka-alt-sol
     hw,     0, -hd,   // 5: arka-alt-sağ
     hw, backH, -hd,   // 6: arka-üst-sağ
    -hw, backH, -hd,   // 7: arka-üst-sol
  ]);

  const indices = [
    // Alt (y=0)
    0, 5, 4,   0, 1, 5,
    // Ön (z=+hd, harflerin arka yüzüyle kesişiyor)
    0, 2, 1,   0, 3, 2,
    // Arka (z=-hd)
    4, 6, 5,   4, 7, 6,
    // Sol (x=-hw)
    0, 4, 7,   0, 7, 3,
    // Sağ (x=+hw)
    1, 2, 6,   1, 6, 5,
    // Üst-eğimli (frontH'den backH'ye inen rampa)
    3, 7, 6,   3, 6, 2,
  ];

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export const Scene3D = ({
  text,
  isItalic,
  groupRef,
  isThicknessThick,
  materialColor,
  plateThickness,
  tiltAngle,
}) => {
  const [letterSize, setLetterSize] = useState({ width: 6.0, height: 1.0 });

  const shearMatrix = useMemo(() => {
    const matrix = new THREE.Matrix4();
    if (isItalic) {
      const angle = Math.tan(THREE.MathUtils.degToRad(12));
      try { matrix.makeShear(angle, 0, 0, 0, 0, 0); }
      catch (_) { matrix.makeShear(angle, 0, 0); }
    }
    return matrix;
  }, [isItalic]);

  const baseH   = plateThickness / 10;   // arka ince plaka yüksekliği
  const letterH = letterSize.height;
  const letterW = letterSize.width;

  // ÖN YÜZ UZUN  (harfler + plaka kalınlığı)
  const frontH = baseH + letterH;
  // ARKA YÜZ KISA (sadece plaka)
  const backH  = baseH;

  // Kama derinliği: tan(eğim) = (frontH - backH) / D = letterH / D
  const tiltRad = THREE.MathUtils.degToRad(Math.max(tiltAngle, 1));
  const wedgeD  = letterH / Math.tan(tiltRad);
  const wedgeW  = letterW + 0.8;

  // Harf extrusion derinliği (kama içine gömülen miktar)
  const textDepth = isThicknessThick ? 0.45 : 0.18;

  const wedgeGeo = useMemo(
    () => createWedgeGeometry(wedgeW, frontH, backH, wedgeD),
    [wedgeW, frontH, backH, wedgeD]
  );

  const handleCentered = ({ width, height }) => {
    setLetterSize(prev => {
      if (
        Math.abs((prev.width  - (width  ?? prev.width))  ) < 0.001 &&
        Math.abs((prev.height - (height ?? prev.height)) ) < 0.001
      ) return prev;
      return { width: width ?? prev.width, height: height ?? prev.height };
    });
  };

  // Sahne ortalaması
  const groupOffsetY = -(frontH * 0.5);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 3, 14]} />
      <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.5} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
      <pointLight position={[-5, 8, 3]} intensity={0.8} castShadow />

      <group ref={groupRef} position={[0, groupOffsetY, 0]}>

        {/* ── KAMA TABAN ── */}
        <mesh geometry={wedgeGeo} receiveShadow castShadow>
          <meshStandardMaterial color={materialColor} roughness={0.45} metalness={0.08} />
        </mesh>

        {/*
          ── HARFLER ──
          - DİKEY (rotation = 0)
          - ÖN YÜZDE (z = +wedgeD/2) konumlandırılmış
          - Alt hizası y = baseH (kamanın ön yüzündeki plaka üstü)
          - Text3D +Z yönünde extrude eder → arka yüzü kama içine gömülür (manifold ✓)
          - Görünen (ön) yüzü +Z yönünde → görüntüleyiciye bakıyor ✓
        */}
        <Center
          top
          position={[0, baseH, wedgeD / 2]}
          onCentered={handleCentered}
        >
          <Text3D
            key={`${text}-${isItalic}-${isThicknessThick}-${tiltAngle}`}
            font="/fonts/Plus_Jakarta_Sans_Bold.json"
            size={1.0}
            height={textDepth}
            curveSegments={16}
            bevelEnabled
            bevelThickness={isThicknessThick ? 0.04 : 0.015}
            bevelSize={isThicknessThick ? 0.03 : 0.01}
            bevelOffset={0}
            bevelSegments={4}
            onUpdate={(self) => {
              if (isItalic && !self.geometry.userData.sheared) {
                self.geometry.applyMatrix4(shearMatrix);
                self.geometry.userData.sheared = true;
                self.geometry.computeBoundingBox();
              }
            }}
          >
            {text || '73'}
            <meshStandardMaterial color={materialColor} roughness={0.4} metalness={0.1} />
          </Text3D>
        </Center>

      </group>
    </>
  );
};