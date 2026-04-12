// src/utils/exportUtils.js — v4.0.0-sweep-update
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';
import JSZip from 'jszip';

const MAX_STL_SIZE_MB = 50; // Maksimum STL dosya boyutu

function downloadBlob(blob, filename) {
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    document.body.removeChild(link);
  }, 100);
}

export const handleExport = (groupRef, fileName = "SAKRAD_Isimlik", isMultiColor = false) => {
  if (!groupRef.current) return;

  const exporter = new STLExporter();
  
  // THREE.js Sahesinde Y=Yukarı iken 3D Yazıcılarda (Slicer) Z=Yukarı mantığı vardır.
  // Bu yüzden aktarmadan hemen önce modeli 90 derece X ekseninde çeviriyoruz 
  // (böylece tablonun altı düz şekilde tablaya yapışıyor, yüz üstü düşmüyor).
  const originalScale = groupRef.current.scale.clone();
  const originalRotation = groupRef.current.rotation.clone();

  // DUAL EXPORT VE SINGLE EXPORT İÇİN TEK GEÇERLİ BOYUT DÜZELTMESİ (Garantili!)
  // Sahnede model 0.05 oranında küçüktür (ekrana sığması için). 
  // Gerçek mm'ye ulaşmak için export anında (ana ebeveyne dokunmadan) bunu 20 ile çarpıyoruz.
  groupRef.current.scale.multiplyScalar(20);
  groupRef.current.rotation.x += Math.PI / 2;
  groupRef.current.updateMatrixWorld(true);

  if (isMultiColor) {
    const zip = new JSZip();

    // Sahnedeki (orijinal) çocukları güvenle ayır
    const allChildren = [...groupRef.current.children];

    // 1. SADECE TABANI AKTAR
    groupRef.current.children = allChildren.filter(c => !c.name || !c.name.startsWith("Text"));
    groupRef.current.updateMatrixWorld(true);
    const baseResult = exporter.parse(groupRef.current, { binary: true });
    zip.file(`${fileName}_TABAN.stl`, baseResult.buffer);

    // 2. SADECE YAZILARI AKTAR
    groupRef.current.children = allChildren.filter(c => c.name && c.name.startsWith("Text"));
    groupRef.current.updateMatrixWorld(true);
    const textResult = exporter.parse(groupRef.current, { binary: true });
    zip.file(`${fileName}_YAZI.stl`, textResult.buffer);

    // Çocukları eski haline getir
    groupRef.current.children = allChildren;
    
    // Zip indir
    zip.generateAsync({ type: "blob" }).then((content) => {
      downloadBlob(content, `${fileName}_CiftRenk.zip`);
    });

  } else {
    // Binary format daha az yer kaplar ve 3D yazıcılar için idealdir
    const result = exporter.parse(groupRef.current, { binary: true });
    const blob = new Blob([result], { type: 'application/octet-stream' });
    downloadBlob(blob, `${fileName}_${new Date().getTime()}.stl`);
  }

  // Tekrar eski görsel boyutuna ve açısına geri al
  groupRef.current.scale.copy(originalScale);
  groupRef.current.rotation.copy(originalRotation);
  groupRef.current.updateMatrixWorld(true);
};