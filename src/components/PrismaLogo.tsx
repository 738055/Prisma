// src/components/PrismaLogo.tsx (OPACIDADE AJUSTADA)
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

// --- COMPONENTE DO PRISMA WIREFRAME (BASEADO NO SVG) ---
const WireframePrism = () => {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const radius = 2.0;
    shape.moveTo(0, radius);
    shape.lineTo(radius * Math.sin((2 * Math.PI) / 3), radius * Math.cos((2 * Math.PI) / 3));
    shape.lineTo(radius * Math.sin((4 * Math.PI) / 3), radius * Math.cos((4 * Math.PI) / 3));
    shape.closePath();

    const extrudeSettings = {
      steps: 1,
      depth: 3.0,
      bevelEnabled: false,
    };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  return (
    <lineSegments>
      <edgesGeometry args={[geometry]} />
      <lineBasicMaterial color="#E1EEE6" linewidth={2} />
    </lineSegments>
  );
};

// --- COMPONENTE PARA CONTER A CENA E A ANIMAÇÃO ---
const AnimatedScene = () => {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();
      groupRef.current.rotation.y = t * 0.1;
      groupRef.current.rotation.x = Math.sin(t * 0.3) * 0.1;
    }
  });

  return (
    <>
      <pointLight color="#ffffff" intensity={5} distance={20} position={[0, 0, -10]} />
      <ambientLight intensity={0.3} />
      <pointLight color="#00aaff" intensity={15} distance={25} position={[-10, 5, 5]} />
      <pointLight color="#ff00aa" intensity={15} distance={25} position={[10, -5, 5]} />

      <group ref={groupRef} position={[0, 0, -1.5]}>
        <mesh>
          <circleGeometry args={[4, 64]} />
          <meshStandardMaterial color="#E1EEE6" transparent opacity={0.1} side={THREE.DoubleSide} />
        </mesh>
        <WireframePrism />
      </group>
    </>
  );
}

// --- COMPONENTE PRINCIPAL ---
export default function PrismaLogo() {
  return (
    // A OPACIDADE FOI AJUSTADA AQUI PARA DEIXAR O LOGO MAIS SUTIL
    <div className="absolute inset-0 z-0 opacity-20">
      <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
        <AnimatedScene />
      </Canvas>
    </div>
  );
}