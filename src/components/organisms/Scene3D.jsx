import React, { useMemo, useState } from 'react';
import { Text3D, Center, PerspectiveCamera, OrbitControls, Environment, RoundedBox } from '@react-three/drei';
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
  
  // Italik için Shear Matrisi
  const shearMatrix = useMemo(() => {
    const matrix = new THREE.Matrix4();
    if (isItalic) {
      const angle = Math.tan(THREE.MathUtils.degToRad(12)); 
      matrix.makeShear(angle, 0, 0); 
    }
    return matrix;
  }, [isItalic]);

  const handleCentered = (props) => {
    const { width, height, depth } = props;
    if (width && width > 0) {
      setTextSize(prev => {
        // Rakamları çok ufak küsurat değişimlerinde (floating point error) bile re-render'ı durdurmak için
        // Math.abs ile kontrol edebiliriz veya direkt karşılaştırabiliriz.
        if (
          Math.abs(prev[0] - width) < 0.001 &&
          Math.abs(prev[1] - height) < 0.001 &&
          Math.abs(prev[2] - depth) < 0.001
        ) {
          return prev; // Değişim yoksa state'i GÜNCELLEME (Infinite loop'u engeller)
        }
        return [width, height, depth];
      });
    }
  };

  const baseH = (plateThickness / 10); 
  const baseW = textSize[0] + 0.8; 
  const baseD = textSize[2] + 2.0; 

  const textDepth = isThicknessThick ? 2.5 : 0.8; 

  const tiltAngleRad = THREE.MathUtils.degToRad(tiltAngle);
  // Boşluğu kapatmak için harfin Z kalınlığının, dönüş açısındaki Y izdüşümü kadar harfleri aşağı/tabana batırıyoruz.
  const sinkDepth = textDepth * Math.sin(tiltAngleRad) + 0.2; 

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 4, 15]} />
      <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.5} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
      <pointLight position={[10, 10, 10]} intensity={1.2} castShadow />

      <group ref={groupRef} position={[0, -1, 0]}>
        {/* YAZI MODELİ */}
        <Center 
          top 
          position={[0, baseH - sinkDepth, 0]} // Yazıyı tabanın içine gömerek döndürme boşluğunu gizler
          onCentered={handleCentered}
        >
          <Text3D
            // Parametrelerden herhangi biri değiştiğinde modeli temizce yeniden oluştursun
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
            rotation={[-tiltAngleRad, 0, 0]} // Standard fiziksel üç boyutlu dönüş
            onUpdate={(self) => {
              if (isItalic && !self.geometry.userData.sheared) {
                // Sadece İtalik deformasyonu korunur
                self.geometry.applyMatrix4(shearMatrix);
                self.geometry.userData.sheared = true;
                self.geometry.computeBoundingBox();
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
        </Center>

        {/* TABAN (BASE PLATE) */}
        <RoundedBox 
          position={[0, baseH / 2, 0]}
          receiveShadow
          args={[baseW, baseH, baseD]} 
          radius={0.05} // Çok hafif pah/yuvarlaklık FDM dostu
          smoothness={4} 
          creased
        >
          {/* Taban her zaman sabit hafif dokulu koyu gri (FDM Tablası) hissiyatında kalsın diye UI rengini bağlamadık, dilerseniz bağlanabilir. */}
          <meshStandardMaterial color="#334155" roughness={0.8} /> 
        </RoundedBox>
      </group>
    </>
  );
};