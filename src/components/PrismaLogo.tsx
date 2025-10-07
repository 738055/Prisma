// src/components/PrismaLogo.tsx (Fiel ao Logo SVG)
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

// --- COMPONENTE DO PRISMA WIREFRAME (BASEADO NO SVG) ---
const WireframePrism = () => {
  // Geometria de um prisma triangular, como no logo
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const radius = 2.0; // Ajustado para a proporção do logo
    shape.moveTo(0, radius);
    shape.lineTo(radius * Math.sin((2 * Math.PI) / 3), radius * Math.cos((2 * Math.PI) / 3));
    shape.lineTo(radius * Math.sin((4 * Math.PI) / 3), radius * Math.cos((4 * Math.PI) / 3));
    shape.closePath();

    const extrudeSettings = {
      steps: 1,
      depth: 3.0, // Profundidade do prisma
      bevelEnabled: false,
    };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  return (
    <lineSegments>
      <edgesGeometry args={[geometry]} />
      {/* Cor das linhas do prisma, similar ao SVG */}
      <lineBasicMaterial color="#E1EEE6" linewidth={2} />
    </lineSegments>
  );
};

// --- COMPONENTE PRINCIPAL DO LOGO ANIMADO ---
export default function PrismaLogo() {
  const groupRef = useRef<THREE.Group>(null!);

  // Animação de rotação de todo o conjunto
  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();
      groupRef.current.rotation.y = t * 0.1;
      groupRef.current.rotation.x = Math.sin(t * 0.3) * 0.1;
    }
  });

  return (
    <div className="absolute inset-0 z-0 opacity-25">
      <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
        {/* Luz branca suave ao fundo para criar um "feixe" ou aura */}
        <pointLight color="#ffffff" intensity={5} distance={20} position={[0, 0, -10]} />
        <ambientLight intensity={0.3} />
        
        {/* Luzes coloridas vivas que orbitam o logo */}
        <pointLight color="#00aaff" intensity={15} distance={25} position={[-10, 5, 5]} />
        <pointLight color="#ff00aa" intensity={15} distance={25} position={[10, -5, 5]} />

        <group ref={groupRef} position={[0,0,-1.5]}>
          {/* O círculo de fundo do logo */}
          <mesh>
            <circleGeometry args={[4, 64]} />
            <meshStandardMaterial color="#E1EEE6" transparent opacity={0.1} side={THREE.DoubleSide} />
          </mesh>
          
          {/* O prisma wireframe no centro */}
          <WireframePrism />
        </group>
      </Canvas>
    </div>
  );
}