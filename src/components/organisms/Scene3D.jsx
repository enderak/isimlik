import React, { useState, useMemo } from 'react';
import { Text3D, Center, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

/**
 * KAMA (WEDGE) GEOMETRİSİ
 * Yan kesiti bir üçgen olan prizma oluşturur:
 *   - Ön yüz (z = +hd, görüntüleyiciye bakan): baseH kadar alçak
 *   - Arka yüz (z = -hd, arkada):              baseH + letterH kadar yüksek
 *   - Alt yüz (y = 0):                         düz, 3D yazıcı tablası
 *   - Üst yüz:                                 ön-alçak → arka-yüksek eğimi
 */
function createWedgeGeometry(W, frontH, backH, D) {
  const geo = new THREE.BufferGeometry();
  const hw = W / 2;
  const hd = D / 2;

  // 8 köşe noktası
  const positions = new Float32Array([
    // Ön yüz (z = +hd) — kısa taraf
    -hw,     0,  hd,  // 0: ön-alt-sol
     hw,     0,  hd,  // 1: ön-alt-sağ
     hw, frontH,  hd, // 2: ön-üst-sağ
    -hw, frontH,  hd, // 3: ön-üst-sol
    // Arka yüz (z = -hd) — uzun taraf
    -hw,    0,  -hd,  // 4: arka-alt-sol
     hw,    0,  -hd,  // 5: arka-alt-sağ
     hw, backH, -hd,  // 6: arka-üst-sağ
    -hw, backH, -hd,  // 7: arka-üst-sol
  ]);

  // Dışa bakan yüzeyler (saat yönünün tersine sarma = CCW)
  const indices = [
    // Alt (y=0, aşağı bakan)
    0, 5, 4,   0, 1, 5,
    // Ön (z=+hd, +Z yönü)
    0, 2, 1,   0, 3, 2,
    // Arka (z=-hd, -Z yönü)
    4, 6, 5,   4, 7, 6,
    // Sol (x=-hw, -X yönü)
    0, 4, 7,   0, 7, 3,
    // Sağ (x=+hw, +X yönü)
    1, 2, 6,   1, 6, 5,
    // Üst-eğimli (sloped top)
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
  // Text3D boyutları ölçüldüğünde state'e kaydediliyor
  const [letterSize, setLetterSize] = useState({ width: 6.0, height: 1.0 });

  // İtalik için Shear matrisi
  const shearMatrix = useMemo(() => {
    const matrix = new THREE.Matrix4();
    if (isItalic) {
      const angle = Math.tan(THREE.MathUtils.degToRad(12));
      // Three.js r160 ve altı için 3 argümanlı overload kullan
      try { matrix.makeShear(angle, 0, 0, 0, 0, 0); }
      catch { matrix.makeShear(angle, 0, 0); }
    }
    return matrix;
  }, [isItalic]);

  // Temel ölçüler
  const baseH   = plateThickness / 10;          // Tabanın ön yüzü (ince plaka)
  const letterH = letterSize.height;
  const letterW = letterSize.width;
  const backH   = baseH + letterH;               // Tabanın arka yüzü (harf yüksekliği + plaka)

  // Kama derinliği: tan(açı) = yükseklik farkı / derinlik
  const tiltRad = THREE.MathUtils.degToRad(Math.max(tiltAngle, 1));
  const wedgeD  = letterH / Math.tan(tiltRad);  // Eğim açısına göre kama derinliği
  const wedgeW  = letterW + 0.8;                 // Genişlik = harf genişliği + kenar boşluğu

  // Harf kalınlığı (extrude derinliği) — küçük tutuldu, esas destek kamadan geliyor
  const textDepth = isThicknessThick ? 0.45 : 0.18;

  // Kama geometrisi sadece ölçüler değişince yeniden hesaplanır
  const wedgeGeo = useMemo(
    () => createWedgeGeometry(wedgeW, baseH, backH, wedgeD),
    [wedgeW, baseH, backH, wedgeD]
  );

  // Center bileşeni ölçümleri bildirdiğinde çalışır (sonsuz döngüyü önlemek için fark kontrolü)
  const handleCentered = ({ width, height }) => {
    setLetterSize(prev => {
      if (
        Math.abs((prev.width  - width)  || 0) < 0.001 &&
        Math.abs((prev.height - height) || 0) < 0.001
      ) return prev;
      return { width: width ?? prev.width, height: height ?? prev.height };
    });
  };

  // Modeli sahnede ortalamak için dikey offset
  const groupOffsetY = -(baseH + letterH * 0.5);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 3, 14]} />
      <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.5} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
      <pointLight position={[-5, 8, 3]} intensity={0.8} castShadow />

      {/*
        groupRef → STL Exporter bu group'u traverse ederek içindeki
        tüm mesh'leri (kama + harfler) tek dosyaya yazar.
      */}
      <group ref={groupRef} position={[0, groupOffsetY, 0]}>

        {/* ── KAMA (WEDGE) TABAN ── */}
        <mesh geometry={wedgeGeo} receiveShadow castShadow>
          <meshStandardMaterial
            color={materialColor}
            roughness={0.45}
            metalness={0.08}
          />
        </mesh>

        {/*
          ── HARFLER ──
          Tamamen DİKEY duruyorlar (rotation YOK).
          Kama tabanının ön üst kenarından (y=baseH, z=+wedgeD/2) başlıyorlar.
          Text3D varsayılan olarak +Z yönünde extrude ettiği için:
            - Harfin arka yüzü, kamanın ön yüzüne gömülüyor (manifold birleşim)
            - Harfin ön yüzü (+Z) görüntüleyiciye bakıyor
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
            <meshStandardMaterial
              color={materialColor}
              roughness={0.4}
              metalness={0.1}
            />
          </Text3D>
        </Center>

      </group>
    </>
  );
};