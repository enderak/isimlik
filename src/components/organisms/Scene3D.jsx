import React, { useMemo, useState } from 'react';
import { Text3D, PerspectiveCamera, OrbitControls, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

// Milimetrik değerleri Three.js sahne birimine çevir
// 1mm = 0.1 birim (böylece 30mm harf = 3 birim → ekrana güzel sığar)
const SCALE = 0.1;

export const Scene3D = ({
  text,
  isItalic,
  groupRef,
  isThicknessThick,
  materialColor,
  baseColor,
  plateThickness,
  tiltAngle,
  textOffset,
  autoCenter,
  arcRadius,
  baseHeight,
  targetWidth
}) => {
  const [textSize, setTextSize] = useState([6, 0.6, 0.6]);

  // Tüm ölçüler mm cinsinden (gerçek fiziksel boyut)
  const letterSize = 30.0;         // Harf yüksekliği (mm)
  const supportDepth = 20.0;       // Destek kolonu derinliği (mm) — extrude yönü
  const tiltAngleRad = THREE.MathUtils.degToRad(tiltAngle);
  const zExtent = supportDepth + (letterSize * Math.tan(tiltAngleRad));

  // DİNAMİK TABAN PLAKASI
  const baseD = zExtent + 20.0;    // Derinlik (mm)
  const baseH = baseHeight;        // Kullanıcı kontrollü yükseklik (mm)
  
  // MERKEZleme
  const zCenterOffset = autoCenter ? (-baseD / 2 + zExtent / 2) : textOffset;
  const baseCenterZ = -baseD / 2;

  const baseW = textSize[0] + 16.0; 
  const textDepth = isThicknessThick ? 6.0 : 3.0;

  // Chamfer (3mm pah)
  const chamferSize = Math.min(3.0, (baseH / 2) - 0.2);

  const innerScale = targetWidth ? (targetWidth / baseW) : 1;
  const scaledCenterZ = baseCenterZ * innerScale;
  const scaledBaseW = baseW * innerScale;
  const scaledBaseD = baseD * innerScale;

  return (
    <>
      {/* Kamera: modelin tam ortasını gösterir */}
      <PerspectiveCamera makeDefault position={[0, 4, 14]} fov={50} />
      <OrbitControls 
        makeDefault 
        minPolarAngle={0.2} 
        maxPolarAngle={Math.PI / 1.8}
        target={[0, 0.5, -1]}
      />
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
      <pointLight position={[10, 10, 10]} intensity={1.2} castShadow />

      {/* Tüm modeli SCALE ile küçültüyoruz: mm → sahne birimi */}
      <group scale={[SCALE, SCALE, SCALE]} position={[0, -0.5, zCenterOffset * SCALE]}>

        {/* EXPORT EDİLECEK MODEL GRUBU (Birebir mm ölçüsündedir, scale = 1 veya hedef ölçüye göre) */}
        <group ref={groupRef} scale={[innerScale, innerScale, innerScale]}>

        {/* KATMAN 1: İÇ DESTEK KOLONU (SWEEP KAVİSLİ RAMP) */}
        {/* Harfin sırtından tabana doğru R yarıçaplı bir yay çizerek iner */}
        <Text3D
          name="TextSupport"
          key={`support-${text}-${isItalic}-${isThicknessThick}-${tiltAngle}-${arcRadius}-${baseHeight}-optimer`}
          font="/fonts/optimer_bold.typeface.json"
          size={letterSize}
          height={supportDepth}
          curveSegments={16}
          bevelEnabled={false}
          onUpdate={(self) => {
            if (!self.geometry.userData.morphed) {
              self.geometry.computeBoundingBox();
              let bbox = self.geometry.boundingBox;
              // Merkeze al + arka yüzü ana harfin arkasına daya
              self.geometry.translate(
                -(bbox.max.x + bbox.min.x) / 2, 
                -bbox.min.y,                    
                -bbox.max.z - textDepth
              );

              self.geometry.computeBoundingBox();
              bbox = self.geometry.boundingBox;
              const maxZ = bbox.max.z; 
              const minZ = bbox.min.z;
              const D = maxZ - minZ;

              const positions = self.geometry.attributes.position;
              self.geometry.computeVertexNormals();
              const normals = self.geometry.attributes.normal;

              const tiltRad = THREE.MathUtils.degToRad(tiltAngle);
              const italicRad = THREE.MathUtils.degToRad(12);
              for(let i = 0; i < positions.count; i++) {
                 const x = positions.getX(i);
                 const y = positions.getY(i);
                 // Orijinal Z koordinatını koruyoruz (derinlik hesaplaması için)
                 const zOriginal = positions.getZ(i);

                 const absZ = Math.abs(maxZ - zOriginal); 
                 const depthNorm = D === 0 ? 0 : (absZ / D);

                  // ARC SWEEP: Çeyrek daire yay formülü
                  // progress: 0 = ön yüz (harfin sırtı), 1 = arka yüz (tabana temas)
                  const progress = depthNorm;
                  const angle = progress * (Math.PI / 2);
                  
                  // Y: aşağı iner (tabana doğru)  →  R * (1 - cos θ)
                  // Z: arkaya kıvrılır             →  R * sin θ
                  const yOffset = arcRadius * (1 - Math.cos(angle));
                  const zOffset = arcRadius * Math.sin(angle);

                  const startZ = -textDepth - (y * Math.tan(tiltRad));
                  let yFinal = (y - yOffset) + baseH;
                  const zShift = startZ - zOffset;

                  const xShift = isItalic ? (y * Math.tan(italicRad)) : 0;

                  // AMS ÇAKIŞMASINI (Gcode Overlap) GİDERMEK İÇİN:
                  // yFinal, base plate'in üst yüzeyinden (baseH) aşağı düşerse, tabanın "içine" girer.
                  // Çift renkli baskılarda iki cismin iç içe geçmesi çakışma (overlap) hatası verir.
                  // Bu yüzden taban plakasının TAM ÜSTÜNDE durduruyoruz (yFinal = baseH).
                  if (yFinal < baseH) {
                      yFinal = baseH;
                  }

                  positions.setXYZ(i, x + xShift, yFinal, zShift);
              }

              self.geometry.computeVertexNormals();
              self.geometry.computeBoundingBox();
              self.geometry.userData.morphed = true;
              positions.needsUpdate = true;
            }
          }}
        >
          {text || "73"}
          <meshStandardMaterial color={materialColor} roughness={0.4} metalness={0.1} />
        </Text3D>

        {/* KATMAN 2: ANA HARF (FLOATING SHIELD) */}
        {/* Eğik duran, tam boyutlu asıl harfler */}
        <Text3D
          name="TextMain"
          key={`main-${text}-${isItalic}-${isThicknessThick}-${tiltAngle}-${baseHeight}-optimer`}
          font="/fonts/optimer_bold.typeface.json"
          size={letterSize}
          height={textDepth}
          curveSegments={16}
          bevelEnabled={false}
          onUpdate={(self) => {
            if (!self.geometry.userData.morphed) {
              self.geometry.computeBoundingBox();
              let bbox = self.geometry.boundingBox;
              self.geometry.translate(
                -(bbox.max.x + bbox.min.x) / 2, 
                -bbox.min.y,                    
                -bbox.max.z
              );

              const positions = self.geometry.attributes.position;
              const tiltRad = THREE.MathUtils.degToRad(tiltAngle);
              const italicRad = THREE.MathUtils.degToRad(12);
              
              for(let i = 0; i < positions.count; i++) {
                  const x = positions.getX(i);
                  const y = positions.getY(i);
                  const z = positions.getZ(i);

                   const zShift = -(y * Math.tan(tiltRad)) + z;
                   const xShift = isItalic ? (y * Math.tan(italicRad)) : 0;

                   positions.setXYZ(i, x + xShift, y, zShift);
               }

               // Taban yüksekliği kadar yukarı kaldır
               self.geometry.translate(0, baseH, 0);

              self.geometry.computeVertexNormals();
              self.geometry.computeBoundingBox();
              self.geometry.userData.morphed = true;
              positions.needsUpdate = true;

              // Taban plakasını ölçülere göre genişlet
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
          <meshStandardMaterial color={materialColor} roughness={0.4} metalness={0.1} />
        </Text3D>

        {/* TABAN PLAKASI — Koyu renkli, üstünde chamfer çizgisi */}
        <RoundedBox
          name="BasePlate"
          position={[0, baseH / 2, baseCenterZ]}
          receiveShadow
          args={[baseW, baseH, baseD]}
          radius={0.5}
          smoothness={4}
          creased
        >
          <meshStandardMaterial color={baseColor || '#334155'} roughness={0.8} />
        </RoundedBox>

        {/* Chamfer görsel efekti: Üst kenarlarda pahlı kenar */}
        {chamferSize > 0.5 && (
          <mesh name="BaseChamfer" position={[0, baseH - 0.05, baseCenterZ]} receiveShadow>
            <boxGeometry args={[baseW - chamferSize * 0.6, 0.3, baseD - chamferSize * 0.6]} />
            <meshStandardMaterial 
              color="#475569" 
              roughness={0.6} 
              metalness={0.05}
              transparent
              opacity={0.6}
            />
          </mesh>
        )}

        </group>

        {/* ZEMİN GÖLGE DÜZLEMI (Sadece arayüzde görünür, STL'e gitmez) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, scaledCenterZ]} receiveShadow>
          <planeGeometry args={[scaledBaseW + 40, scaledBaseD + 40]} />
          <shadowMaterial opacity={0.15} />
        </mesh>

      </group>
    </>
  );
};