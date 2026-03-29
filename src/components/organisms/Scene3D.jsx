import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Text3D, OrbitControls, PerspectiveCamera, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { Evaluator, Brush, ADDITION } from 'three-bvh-csg';

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

  const [textMesh, setTextMesh] = useState(null);
  const [baseMesh, setBaseMesh] = useState(null);
  const [unionGeometry, setUnionGeometry] = useState(null);

  const shearMatrix = useMemo(() => {
    const matrix = new THREE.Matrix4();
    if (isItalic) {
      const angle = Math.tan(THREE.MathUtils.degToRad(12)); 
      matrix.makeShear(angle, 0, 0, 0, 0, 0); 
    }
    return matrix;
  }, [isItalic]);

  const baseH = (plateThickness / 10); 
  const baseW = textSize[0] + 0.8; 
  const baseD = textSize[2] + 2.0; 
  const textDepth = isThicknessThick ? 2.5 : 1.0; 

  // CSG Engine - Yalnızca pure geometri okur, sahne offsetlerini kendi verir.
  useEffect(() => {
    if (!textMesh || !baseMesh) return;
    
    try {
      const evaluator = new Evaluator();
      
      // Taban Plakası: Sıfır noktasından Y ekseninde yukarı kaydırılır
      const baseGeo = baseMesh.geometry.clone();
      baseGeo.translate(0, baseH / 2, 0);
      const brushBase = new Brush(baseGeo);
      
      // Harfler: Zaten 'onUpdate' içinde kusursuz bir şekilde matrix hesabı yapılıp konumu ayarlandı
      const textGeo = textMesh.geometry.clone();
      const brushText = new Brush(textGeo);

      // Mutlak Boolean Birleşimi
      const resultMesh = evaluator.evaluate(brushBase, brushText, ADDITION);
      
      if (resultMesh && resultMesh.geometry) {
        resultMesh.geometry.computeVertexNormals();
        setUnionGeometry(resultMesh.geometry.clone());
      }
    } catch (e) {
      console.error("CSG Operation Failed:", e);
    }
  }, [textMesh, baseMesh, textSize, text, plateThickness]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 4, 15]} />
      <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.5} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
      <pointLight position={[10, 10, 10]} intensity={1.2} castShadow />

      <group ref={groupRef} position={[0, -1, 0]}>
        
        {/* KAYNAK MODELLER (GÖRÜNMEZ) - İşlemler geometriler düzeyinde saf matris ile yürür */}
        <group visible={false}>
          <Text3D
            ref={setTextMesh}
            key={`${text}-${isItalic}-${isThicknessThick}-${tiltAngle}-source`} 
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
              if (self.geometry.userData.morphed) return;
              
              // 1. İtalik (Shear)
              if (isItalic) {
                self.geometry.applyMatrix4(shearMatrix);
              }
              
              // 2. Kendisini %100 tam merkeze ve yere sıfır hizaya oturtur
              self.geometry.computeBoundingBox();
              const bbox1 = self.geometry.boundingBox;
              self.geometry.translate(
                -(bbox1.max.x + bbox1.min.x) / 2, // X ekseni merkezi
                -bbox1.min.y,                     // Y ekseni tabanı
                -(bbox1.max.z + bbox1.min.z) / 2  // Z ekseni merkezi
              );

              // 3. Eğim (Rotation)
              const tiltAngleRad = THREE.MathUtils.degToRad(tiltAngle);
              self.geometry.rotateX(-tiltAngleRad);

              // 4. Sink Depth (Boşlukları yok et, göm ve tabana yerleştir)
              const sinkDepth = textDepth * Math.sin(tiltAngleRad) + 0.2;
              self.geometry.translate(0, baseH - sinkDepth, 0);

              // 5. Çerçevenin yeni hacmini ölç
              self.geometry.computeBoundingBox();
              const bbox2 = self.geometry.boundingBox;
              const newW = bbox2.max.x - bbox2.min.x;
              const newH = bbox2.max.y - bbox2.min.y;
              const newD = bbox2.max.z - bbox2.min.z;
              
              self.geometry.userData.morphed = true;
              
              // 6. Taban plakasının bu yeni ölçülere göre sarabilmesi için durumu bildir (React render tetikler)
              setTextSize([newW, newH, newD]);
            }}
          >
            {text || "73"}
            <meshBasicMaterial />
          </Text3D>

          <RoundedBox 
            ref={setBaseMesh}
            args={[baseW, baseH, baseD]} 
            radius={0.05} 
            smoothness={4} 
            creased
          >
            <meshBasicMaterial /> 
          </RoundedBox>
        </group>

        {/* DIŞA AKTARILAN TEK VE KUSURSUZ MODEL (MANIFOLD MESH) */}
        {unionGeometry && (
          <mesh geometry={unionGeometry} receiveShadow castShadow>
             <meshStandardMaterial 
                color={materialColor} 
                roughness={0.4} 
                metalness={0.1} 
              />
          </mesh>
        )}

      </group>
    </>
  );
};