// src/utils/exportUtils.js
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';

export const handleExport = (groupRef, fileName = "SAKRAD_Isimlik") => {
  if (!groupRef.current) return;

  const exporter = new STLExporter();
  // Binary format daha az yer kaplar ve 3D yazıcılar için idealdir
  const result = exporter.parse(groupRef.current, { binary: true });
  const blob = new Blob([result], { type: 'application/octet-stream' });
  
  const link = document.createElement('a');
  link.style.display = 'none';
  document.body.appendChild(link);
  
  link.href = URL.createObjectURL(blob);
  link.download = `${fileName}_${new Date().getTime()}.stl`;
  link.click();
  
  document.body.removeChild(link);
};