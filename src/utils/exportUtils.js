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

  if (isMultiColor) {
    const zip = new JSZip();

    // 1. Yazıları Kaldır, Sadece Tabanı Aktar
    const baseClone = groupRef.current.clone();
    
    // DİKKAT: baseClone ebeveynden koptuğu için Scene3D'deki 0.1 scale etkisinden çıkmış olur.
    // Bu yüzden burada scale'i 10 ile ÇARPMIYORUZ (çarpınca 2 metre oluyor).
    // Sadece Z-Up için 90 derece takla attırmamız yeterli!
    baseClone.rotation.x += Math.PI / 2;
    
    const toRemoveBase = [];
    baseClone.traverse((child) => {
      if (child.name && child.name.startsWith("Text")) {
        toRemoveBase.push(child);
      }
    });
    toRemoveBase.forEach(c => c.parent && c.parent.remove(c));
    baseClone.updateMatrixWorld(true);
    
    const baseResult = exporter.parse(baseClone, { binary: true });
    zip.file(`${fileName}_TABAN.stl`, baseResult.buffer);

    // 2. Tabanı Kaldır, Sadece Yazıları Aktar
    const textClone = groupRef.current.clone();
    
    // Aynı Şekilde: 10 ile çarpma, sadece takla attır
    textClone.rotation.x += Math.PI / 2;
    
    const toRemoveText = [];
    textClone.traverse((child) => {
      if (child.name && child.name.startsWith("Base")) {
        toRemoveText.push(child);
      }
    });
    toRemoveText.forEach(c => c.parent && c.parent.remove(c));
    textClone.updateMatrixWorld(true);

    const textResult = exporter.parse(textClone, { binary: true });
    zip.file(`${fileName}_YAZI.stl`, textResult.buffer);
    
    // Klasörü Sıkıştır ve Zip olarak indir
    zip.generateAsync({ type: "blob" }).then((content) => {
      downloadBlob(content, `${fileName}_CiftRenk.zip`);
    });

  } else {
    // Tek Parça Çıktı: groupRef sahneye bağlı olduğu için ebeveynin 0.1 ölçek küçültmesini taşır.
    // Bu küçültmeyi yenmek için 10 ile çarparak 1:1 mm ölçüsüne getiriyoruz.
    groupRef.current.scale.multiplyScalar(10);
    groupRef.current.rotation.x += Math.PI / 2;
    groupRef.current.updateMatrixWorld(true);

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