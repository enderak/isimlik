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
              const maxY = bbox.max.y;
              const H = maxY - minY;
              
              const minZ = bbox.min.z; 
              const maxZ = bbox.max.z; 
              const D = maxZ - minZ; // Harfin extrude kalınlığı (textDepth)

              // Orijinal Noktalar ve Normalleri Bloom için hazırlıyoruz
              const positions = self.geometry.attributes.position;
              self.geometry.computeVertexNormals(); // Yumuşak Bloom'u dışa doğru şişirmek için
              const normals = self.geometry.attributes.normal;

              const tiltAngleRad = THREE.MathUtils.degToRad(tiltAngle);
              const italicAngleRad = THREE.MathUtils.degToRad(12);
              
              for(let i = 0; i < positions.count; i++) {
                 const x = positions.getX(i);
                 const y = positions.getY(i);
                 const z = positions.getZ(i);

                 const absZ = Math.abs(maxZ - z); 
                 const depthNorm = D === 0 ? 0 : (absZ / D); // Ön yüz=0. Arka yüz=1.
                 const heightNormInverse = H === 0 ? 0 : (maxY - y) / H; // Tepe=0. Alt zemin=1.

                 // === VİSKOZ BLOOM (BAL GİBİ SÜNEN YAYILMA EFEKTİ) ===
                 // Sadece harfin arkasının alt kısmı tabana değdiği için o noktada şellale gibi (organik) yayılsın!
                 // Havada kalan ön-alt kısımlar sivilce/tümör gibi şişmesin diye `depthNorm * heightNormInverse` ile sadece ORAYA odaklıyoruz.
                 const contactProximity = depthNorm * heightNormInverse; 
                 
                 // Eğrisel bir yayılımla (sadece son 1-2 mm'de sert bir şişme, "damla" geçişi)
                 const bloomPower = Math.pow(contactProximity, 5); 
                 const bloomIntensity = 0.5; // (Birimi MM cinsinden genişleme gücü; max 0.5 birim şişkinlik)

                 const nx = normals.getX(i);
                 const nz = normals.getZ(i); 

                 const xBloom = nx * bloomPower * bloomIntensity;
                 const zBloom = nz * bloomPower * bloomIntensity;

                 // Şişmiş haldeki lokal koordinatlar
                 const bX = x + xBloom;
                 const bZ = z + zBloom;

                 // === AFFINE TRANSFORMATION (DOĞRUSAL KAMA VE YATMA) MATRİSİ ===
                 const yShift = D === 0 ? 0 : - (depthNorm) * gap;
                 const zShift = - (y * Math.tan(tiltAngleRad));
                 const xShift = isItalic ? (y * Math.tan(italicAngleRad)) : 0;

                 // Yeni konumları ayarla (Şişmiş X ve Z'ye Affine kaymaları ekle)
                 positions.setXYZ(i, bX + xShift, y + yShift, bZ + zShift);
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