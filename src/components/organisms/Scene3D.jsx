import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Text3D, Center, PerspectiveCamera, OrbitControls, RoundedBox } from '@react-three/drei';
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

  // CSG Kaynak Mesh'leri
  const [textMesh, setTextMesh] = useState(null);
  const [baseMesh, setBaseMesh] = useState(null);
  
  // Üretilen Manifold Geometri
  const [unionGeometry, setUnionGeometry] = useState(null);
  const internalParentRef = useRef();

  // Italic Shear
  const shearMatrix = useMemo(() => {
    const matrix = new THREE.Matrix4();
    if (isItalic) {
      const angle = Math.tan(THREE.MathUtils.degToRad(12)); 
      matrix.makeShear(angle, 0, 0, 0, 0, 0); 
    }
    return matrix;
  }, [isItalic]);

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
  const baseD = textSize[2] + 2.0; 
  const textDepth = isThicknessThick ? 2.5 : 1.0; 
  const tiltAngleRad = THREE.MathUtils.degToRad(tiltAngle);
  
  // Harfi taban içine gömüp kesiştirme (Intersection) başlangıcı
  const sinkDepth = textDepth * Math.sin(tiltAngleRad) + 0.2; 

  // Boolean CSG Union Tetikleyici
  useEffect(() => {
    if (!textMesh || !baseMesh || !internalParentRef.current) return;
    
    try {
      // Bileşenlerin dünya matrislerini güncelliyoruz
      textMesh.updateMatrixWorld(true);
      baseMesh.updateMatrixWorld(true);
      internalParentRef.current.updateMatrixWorld(true);
      
      const evaluator = new Evaluator();
      
      // Taban Plakası Brush
      const brushBase = new Brush(baseMesh.geometry);
      brushBase.matrix.copy(baseMesh.matrixWorld);
      brushBase.matrixAutoUpdate = false;
      brushBase.updateMatrixWorld();

      // Yazı Brush
      const brushText = new Brush(textMesh.geometry);
      brushText.matrix.copy(textMesh.matrixWorld);
      brushText.matrixAutoUpdate = false;
      brushText.updateMatrixWorld();

      // Mükemmel Boolean Birleşimi!
      const resultMesh = evaluator.evaluate(brushBase, brushText, ADDITION);
      
      if (resultMesh && resultMesh.geometry) {
        // Çıkan sonucu World Space'den Local Space'e geri çevir (Aksi takdirde iki kere kayar)
        const parentInverse = new THREE.Matrix4().copy(internalParentRef.current.matrixWorld).invert();
        resultMesh.geometry.applyMatrix4(parentInverse);
        
        // Yeniden normals hesaplat ki pürüzsüz görünsün
        resultMesh.geometry.computeVertexNormals();
        
        setUnionGeometry(resultMesh.geometry.clone());
      }
    } catch (e) {
      console.warn("CSG Operation Failed:", e);
    }
  }, [textMesh, baseMesh, textSize, text, isItalic, tiltAngle, isThicknessThick, plateThickness]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 4, 15]} />
      <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.5} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
      <pointLight position={[10, 10, 10]} intensity={1.2} castShadow />

      <group ref={internalParentRef} position={[0, -1, 0]}>
        
        {/* KAYNAK MODELLER (GÜN IŞIĞINDAN GİZLİ) - Sadece CSG hesabı için varlar */}
        <group visible={false}>
          {/* YAZI */}
          <Center 
            top 
            position={[0, baseH - sinkDepth, 0]} 
            onCentered={handleCentered}
          >
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
              rotation={[-tiltAngleRad, 0, 0]} 
              onUpdate={(self) => {
                if (isItalic && !self.geometry.userData.sheared) {
                  self.geometry.applyMatrix4(shearMatrix);
                  self.geometry.userData.sheared = true;
                  self.geometry.computeBoundingBox();
                }
                // Morph sonrası CSG'yi zorla update ettirmek için state'de ref tazeleyebiliriz
                // setTextMesh(null); setTimeout(()=>setTextMesh(self)); // Hızlı hack :) Ama useEffect `textSize` dinliyor.
              }}
            >
              {text || "73"}
              <meshBasicMaterial />
            </Text3D>
          </Center>

          {/* TABAN PLAKASI */}
          <RoundedBox 
            ref={setBaseMesh}
            position={[0, baseH / 2, 0]}
            args={[baseW, baseH, baseD]} 
            radius={0.05} 
            smoothness={4} 
            creased
          >
            <meshBasicMaterial /> 
          </RoundedBox>
        </group>

        {/* MÜKEMMEL TEK PARÇA (MANIFOLD UNION) MESH - DIŞA AKTARILACAK OLAN BUDUR */}
        {unionGeometry && (
          <mesh ref={groupRef} geometry={unionGeometry} receiveShadow castShadow>
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