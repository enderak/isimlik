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
  const textDepth = isThicknessThick ? 0.35 : 0.2; // Harf et kalınlığı azaltıldı
  const supportHeight = 0.45; // Destek takozu 4.5mm
  const gap = 0.15; // 1.5mm hava payı

  const baseW = textSize[0] + 0.8;
  const baseD = textDepth + supportHeight + 0.6; // Plaka derinliği artık harf + desteğe göre otomatik
  const baseCenterZ = -(textDepth + supportHeight) / 2; // Plakanın merkezini harflerin altına hizala

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 4, 15]} />
      <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.5} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
      <pointLight position={[10, 10, 10]} intensity={1.2} castShadow />

      <group ref={groupRef} position={[0, -1, 0]}>

        {/* KATMAN 1: İÇ DESTEK KOLONU (INSET WEDGE) */}
        {/* Ana harften birazcık daha dar, tabana bağlanıp ana harfin altını dolduran destek yapısı */}
        <Text3D
          key={`support-${text}-${isItalic}-${isThicknessThick}-${tiltAngle}-optimer`}
          font="/fonts/optimer_bold.typeface.json"
          size={1.0}
          height={supportHeight} // 4.5mm kuyruk
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
              
              const INSET_AMOUNT = -0.06; // Ana harften ~0.6mm daha dar (içte kalması için)

              for(let i = 0; i < positions.count; i++) {
                 // 1. Normal (Yüzey yönü) ekseninde içe doğru (negatif) daraltma
                 const nx = normals.getX(i);
                 const nz = normals.getZ(i);

                 const x = positions.getX(i) + (nx * INSET_AMOUNT);
                 const y = positions.getY(i);
                 const z = positions.getZ(i) + (nz * INSET_AMOUNT);

                 const absZ = Math.abs(maxZ - positions.getZ(i)); 
                 const depthNorm = D === 0 ? 0 : (absZ / D); // Ön yüz=0. Arka yüz=1.

                  // 2. Destek uzaması (Sünme - Tabana değme)
                  // gap kadar havada asılıyız (0.15), yere değmek için (0.2) kadar düşüyoruz (iyice gömülsün)
                  const yShift = D === 0 ? 0 : - (depthNorm) * (gap + 0.05);

                 // 3. Eğim (Tilt) ve İtalik
                 const zShift = - (y * Math.tan(tiltAngleRad));
                 const xShift = isItalic ? (y * Math.tan(italicAngleRad)) : 0;

                 positions.setXYZ(i, x + xShift, y + yShift, z + zShift);
              }

              self.geometry.translate(0, baseH + gap, 0); // Ana harfle hizalanıp aşağı esniyor
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
          size={1.0}
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

                 // SAF affine yatıklık (Sünme YOK, her yanı havada)
                 const zShift = - (y * Math.tan(tiltAngleRad));
                 const xShift = isItalic ? (y * Math.tan(italicAngleRad)) : 0;

                 positions.setXYZ(i, x + xShift, y, z + zShift);
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