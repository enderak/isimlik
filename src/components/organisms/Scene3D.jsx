import React, { useMemo, useState } from 'react';
import { Text3D, PerspectiveCamera, OrbitControls, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

export const Scene3D = ({
  text,
  isItalic,
  groupRef,
  isThicknessThick,
  materialColor,
  plateThickness,
  tiltAngle
}) => {
  const [textSize, setTextSize] = useState([6, 0.6, 0.6]);

  const baseH = (plateThickness / 10);
  const baseW = textSize[0] + 0.8;
  const baseD = textSize[2] + 0.8;

  const textDepth = isThicknessThick ? 0.6 : 0.2;
  const gap = 0.15; // "Sünme" / Havada kalma boşluğu (1.5mm)

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 4, 15]} />
      <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.5} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
      <pointLight position={[10, 10, 10]} intensity={1.2} castShadow />

      <group ref={groupRef} position={[0, -1, 0]}>

        {/* YAZI ("YAPIŞKAN SÜNME" - WEDGE TRANSFORMATION) */}
        <Text3D
          key={`${text}-${isItalic}-${isThicknessThick}-${tiltAngle}-optimer`}
          font="/fonts/optimer_bold.typeface.json"
          size={1.0}
          height={textDepth}
          curveSegments={16}
          bevelEnabled={false} // Keskin siluet için bevel kapalı
          onUpdate={(self) => {
            if (!self.geometry.userData.morphed) {
              // 1. Önce TextGeometry'nin sınırlarını bulup X ve Z'de merkeze, Y'de 0'a oturtuyoruz
              self.geometry.computeBoundingBox();
              let bbox = self.geometry.boundingBox;
              self.geometry.translate(
                -(bbox.max.x + bbox.min.x) / 2, // X ekseninde merkez
                -bbox.min.y,                    // Y ekseninde tabanı 0'a hizala
                -(bbox.max.z + bbox.min.z) / 2  // Z ekseninde merkez
              );

              // 2. Normalize edilmiş ölçüleri al
              self.geometry.computeBoundingBox();
              bbox = self.geometry.boundingBox;
              const minY = bbox.min.y;
              
              const minZ = bbox.min.z; 
              const maxZ = bbox.max.z; 
              const D = maxZ - minZ; // Harfin extrude kalınlığı (textDepth)

              const positions = self.geometry.attributes.position;

              const tiltAngleRad = THREE.MathUtils.degToRad(tiltAngle);
              const italicAngleRad = THREE.MathUtils.degToRad(12);

              // 3. PÜRÜZSÜZ LİNEER (AFFINE) MATRİS DÖNÜŞÜMÜ
              // Önceki koddaki çarpık "testere dişi" kıvrımlarının sebebi non-lineer (Y*Z) bir formül kullanmamdı.
              // Formülü tamamen Saf Geometrik Shear (Kayma) matrisine çevirdik. Yüzeyler 100% pürüzsüz ve düz kalacak.
              
              for(let i = 0; i < positions.count; i++) {
                 const x = positions.getX(i);
                 const y = positions.getY(i);
                 const z = positions.getZ(i);

                 // z 0'dan (Ön yüz) -D'ye (Arka yüz) doğru gider. absZ = derinlikteki mesafe.
                 const absZ = Math.abs(maxZ - z); 

                 // A) Y-Shear (Sünme): Derinliğe (Z'ye) bağlı olarak aşağı doğru kayma.
                 // Ön yüz (absZ=0) -> 0. 
                 // Arka yüz (absZ=D) -> harita -gap kadar aşağı iner.
                 const yShift = D === 0 ? 0 : - (absZ / D) * gap;

                 // B) Z-Shear (Eğim/Tilt): Yüksekliğe (Y'ye) bağlı olarak geriye doğru kayma.
                 // Alt kısım (y=0) -> 0. 
                 // Üst kısım -> geriye doğru yatar.
                 const zShift = - (y * Math.tan(tiltAngleRad));

                 // C) X-Shear (İtalik): Yüksekliğe bağlı olarak sağa kayma.
                 const xShift = isItalic ? (y * Math.tan(italicAngleRad)) : 0;

                 // Noktaları yeni lineer koordinatlarına taşıyoruz.
                 positions.setXYZ(i, x + xShift, y + yShift, z + zShift);
              }

              // 4. Transformasyon sonrası bütünü havaya (baseH + gap) kaldırıyoruz.
              // Ön alt kenar (yShift=0) -> baseH + gap seviyesinde HAVADA asılı kalır.
              // Arka alt kenar (yShift=-gap) -> baseH + gap - gap = baseH. Tam tabloya DEĞER!
              self.geometry.translate(0, baseH + gap, 0);

              self.geometry.computeVertexNormals();
              self.geometry.computeBoundingBox();
              self.geometry.userData.morphed = true;
              positions.needsUpdate = true;

              // 5. Taban plakasını ölçülere göre genişlet
              const fbox = self.geometry.boundingBox;
              setTextSize([
                fbox.max.x - fbox.min.x,
                fbox.max.y - fbox.min.y,
                fbox.max.z - fbox.min.z
              ]);
            }
          }}
        >
          {text || "73"}
          <meshStandardMaterial
            color={materialColor}
            roughness={0.4}
            metalness={0.1}
          />
        </Text3D>

        {/* TABAN PLAKASI */}
        <RoundedBox
          position={[0, baseH / 2, 0]}
          receiveShadow
          args={[baseW, baseH, baseD]}
          radius={0.05}
          smoothness={4}
          creased
        >
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </RoundedBox>

      </group>
    </>
  );
};