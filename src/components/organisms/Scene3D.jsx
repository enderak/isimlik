import React, { useMemo, useState } from 'react';
import { Text3D, Center, PerspectiveCamera, OrbitControls, RoundedBox } from '@react-three/drei';
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

  const handleCentered = (props) => {
    const { width, height, depth } = props;
    if (width && width > 0) {
      setTextSize(prev => {
        if (
          Math.abs(prev[0] - width) < 0.001 &&
          Math.abs(prev[1] - height) < 0.001 &&
          Math.abs(prev[2] - depth) < 0.001
        ) return prev; 
        return [width, height, depth];
      });
    }
  };

  const baseH = (plateThickness / 10); 
  const baseW = textSize[0] + 0.8; 
  // Wedge transform hesaplanan derinliği bbox'a yansıyacağı için, plate ona göre büyüyecektir.
  const baseD = textSize[2] + 0.8; 

  const textDepth = isThicknessThick ? 0.6 : 0.2; 

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 4, 15]} />
      <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.5} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
      <pointLight position={[10, 10, 10]} intensity={1.2} castShadow />

      <group ref={groupRef} position={[0, -1, 0]}>
        
        {/* YAZI (WEDGE TRANSFORMATION) */}
        <Center 
          top 
          position={[0, baseH, 0]} 
          onCentered={handleCentered}
        >
          <Text3D
            key={`${text}-${isItalic}-${isThicknessThick}-${tiltAngle}`} 
            font="/fonts/Plus_Jakarta_Sans_Bold.json" 
            size={1.0}
            height={textDepth} 
            curveSegments={16}
            bevelEnabled={false} // Keskin kama silueti için bevel kapalı
            onUpdate={(self) => {
              if (!self.geometry.userData.morphed) {
                self.geometry.computeBoundingBox();
                const bbox = self.geometry.boundingBox;
                const minY = bbox.min.y;
                const maxY = bbox.max.y;
                const H = maxY - minY;
                
                const minZ = bbox.min.z; // Arka Yüz (0'a yakın)
                const maxZ = bbox.max.z; // Ön Yüz (textDepth)
                const D = maxZ - minZ;

                const positions = self.geometry.attributes.position;
                
                const tiltAngleRad = THREE.MathUtils.degToRad(tiltAngle);
                const maxZShift = H * Math.tan(tiltAngleRad);
                
                const italicAngleRad = THREE.MathUtils.degToRad(12);
                const maxXShift = H * Math.tan(italicAngleRad);

                for(let i = 0; i < positions.count; i++) {
                   const x = positions.getX(i);
                   const y = positions.getY(i);
                   const z = positions.getZ(i);
                   
                   const depthNorm = D === 0 ? 0 : (maxZ - z) / D; // Ön(0) -> Arka(1)
                   const heightNorm = H === 0 ? 0 : (maxY - y) / H; // Üst(0) -> Alt(1)
                   
                   // KAMA (Wedge) DÖNÜŞÜMÜ
                   const zShift = - (depthNorm * heightNorm * maxZShift);
                   
                   // İTALİK DÖNÜŞÜM
                   const heightNormInverted = H === 0 ? 0 : (y - minY) / H; // Alt(0) -> Üst(1)
                   const xShift = isItalic ? (heightNormInverted * maxXShift) : 0;
                   
                   positions.setXYZ(i, x + xShift, y, z + zShift);
                }
                
                self.geometry.computeVertexNormals(); 
                self.geometry.computeBoundingBox();
                self.geometry.userData.morphed = true;
                positions.needsUpdate = true;
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