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
  tiltAngle,
  textOffset,
  autoCenter,
  arcRadius
}) => {
  const [textSize, setTextSize] = useState([6, 0.6, 0.6]);

  const supportHeight = 20.0; // Milimetrik rampa (20mm)
  const tiltAngleRad = THREE.MathUtils.degToRad(tiltAngle);
  const zExtent = supportHeight + (30.0 * Math.tan(tiltAngleRad)); // Eğimden kaynaklı toplam derinlik

  // DİNAMİK TABAN PLAKASI (Eğim arttıkça taban büyür)
  const baseD = zExtent + 20.0; // 20mm pay
  const baseH = plateThickness; 
  
  // MERKEZLEME MANTIĞI
  // autoCenter açıksa, metni plakanın tam ortasına (Z) çeker.
  // Kapalıysa manuel textOffset kullanılır.
  const zCenterOffset = autoCenter ? (-baseD / 2 + zExtent / 2) : textOffset;
  const baseCenterZ = -baseD / 2;

  const baseW = textSize[0] + 16.0; 
  const textDepth = isThicknessThick ? 6.0 : 3.0;
  const gap = 0.0;

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 4, 15]} />
      <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.5} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
      <pointLight position={[10, 10, 10]} intensity={1.2} castShadow />

      <group ref={groupRef} position={[0, -1, zCenterOffset]}>

        {/* KATMAN 1: İÇ DESTEK KOLONU (INSET WEDGE) */}
        {/* Ana harften birazcık daha dar, tabana bağlanıp ana harfin altını dolduran destek yapısı */}
        <Text3D
          key={`support-${text}-${isItalic}-${isThicknessThick}-${tiltAngle}-optimer`}
          font="/fonts/optimer_bold.typeface.json"
          size={30.0} // Milimetrik harf boyu (30mm)
          height={supportHeight}
          curveSegments={16}
          bevelEnabled={false}
          onUpdate={(self) => {
            if (!self.geometry.userData.morphed) {
              self.geometry.computeBoundingBox();
              let bbox = self.geometry.boundingBox;
              self.geometry.translate(
                -(bbox.max.x + bbox.min.x) / 2, 
                -bbox.min.y,                    
                -bbox.max.z - textDepth // ÖN YÜZÜ ANA HARFİN ARKA DUVARINA DAYA
              );

              self.geometry.computeBoundingBox();
              bbox = self.geometry.boundingBox;
              const maxZ = bbox.max.z; 
              const minZ = bbox.min.z;
              const D = maxZ - minZ;

              const positions = self.geometry.attributes.position;
              self.geometry.computeVertexNormals();
              const normals = self.geometry.attributes.normal;

              const tiltAngleRad = THREE.MathUtils.degToRad(tiltAngle);
              const italicAngleRad = THREE.MathUtils.degToRad(12);
              
              const INSET_AMOUNT = 0.2; // Desteği ana harfle tam sıfıra sıfır yap (Boşluk kalmasın)

              for(let i = 0; i < positions.count; i++) {
                 // 1. Normal (Yüzey yönü) ekseninde hizalama
                 const nx = normals.getX(i);
                 const nz = normals.getZ(i);

                 const x = positions.getX(i) + (nx * INSET_AMOUNT);
                 const y = positions.getY(i);
                 const z = positions.getZ(i) + (nz * INSET_AMOUNT);

                 const absZ = Math.abs(maxZ - positions.getZ(i)); 
                 const depthNorm = D === 0 ? 0 : (absZ / D); // Ön yüz=0. Arka yüz=1.

                  // 2. GELİŞMİŞ ARC SWEEP MANTIĞI (R yarıçaplı kavis)
                  const progress = depthNorm; // 0=Ön, 1=Arka
                  
                  // Yay boyunca ilerleme açısı (Radyan)
                  // 90 derecelik bir kavis (çeyrek daire) için:
                  const angle = progress * (Math.PI / 2);
                  
                  // Kavisli yer değiştirme (Fixed Orientation Sweep)
                  // Harfin sırtından tabana doğru R yarıçaplı bir yay çizer
                  const yOffset = arcRadius * (1 - Math.cos(angle));
                  const zOffset = arcRadius * Math.sin(angle);

                  const startZ = -textDepth - (y * Math.tan(tiltAngleRad));
                  const yFinal = (y - yOffset) + baseH;
                  const zShift = startZ - zOffset;

                  // YANAL GENİŞLEME (Pah Etkisi): Sıfır yayılma (Sadece harfin kendi genişliği)
                  const taperFactor = 1.0;
                  const xTapered = x * taperFactor;

                  // 3. İtalik (X ekseni kayması)
                  const xShift = isItalic ? (y * Math.tan(italicAngleRad)) : 0;

                  positions.setXYZ(i, xTapered + xShift, yFinal, zShift);
              }

              // self.geometry.translate(0, baseH + gap, 0); // ARTIK DÖNGÜ İÇİNDE YAPILIYOR
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
        {/* Havada asılı duran, 100% orijinal boyutlu ve sıfır bozulmalı asıl harflar */}
        <Text3D
          key={`main-${text}-${isItalic}-${isThicknessThick}-${tiltAngle}-optimer`}
          font="/fonts/optimer_bold.typeface.json"
          size={30.0} // Milimetrik harf boyu (30mm)
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
                -bbox.max.z // FRONT FACE TO Z=0
              );

              const positions = self.geometry.attributes.position;
              
              const tiltAngleRad = THREE.MathUtils.degToRad(tiltAngle);
              const italicAngleRad = THREE.MathUtils.degToRad(12);
              
              for(let i = 0; i < positions.count; i++) {
                  const x = positions.getX(i);
                  const y = positions.getY(i);
                  const z = positions.getZ(i);

                   // SAF AFFINE SHEAR (Resimdeki gibi üst yüzeyi düz tutar)
                   const zShift = - (y * Math.tan(tiltAngleRad)) + z;
                   const xShift = isItalic ? (y * Math.tan(italicAngleRad)) : 0;

                   positions.setXYZ(i, x + xShift, y, zShift);
               }

               // gap kadar BÜTÜN HARFİ havaya taşı (altı boşluk olacak, boşluğu Destek Kolonu dolduracak)
               self.geometry.translate(0, baseH + gap, 0);

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

        {/* TABAN PLAKASI */}
        <RoundedBox
          position={[0, baseH / 2, baseCenterZ]} // DİNAMİK MERKEZLEME
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