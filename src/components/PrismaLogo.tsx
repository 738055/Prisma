// src/components/PrismaLogo.tsx
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

// --- COMPONENTE DO PRISMA TRIANGULAR ---
const Prism = () => {
  const meshRef = useRef<THREE.Mesh>(null!);
  
  // A rotação agora é mais lenta e subtil, para um toque mais sofisticado
  useFrame(() => {
    if (meshRef.current) {
        meshRef.current.rotation.x += 0.0005;
        meshRef.current.rotation.y += 0.001;
    }
  });

  // Criamos a geometria do prisma triangular manualmente para ser exato.
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const height = 2;
    const radius = 1.2;
    shape.moveTo(0, radius);
    shape.lineTo(radius * Math.cos(Math.PI / 6), -radius * Math.sin(Math.PI / 6));
    shape.lineTo(-radius * Math.cos(Math.PI / 6), -radius * Math.sin(Math.PI / 6));
    shape.closePath();

    const extrudeSettings = {
      steps: 1,
      depth: height,
      bevelEnabled: false,
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  return (
    <mesh ref={meshRef} geometry={geometry} scale={[1.8, 1.8, 1.8]} rotation={[0.2, 0.5, 0]}>
        {/* Usamos EdgesGeometry para renderizar apenas as arestas, como um wireframe */}
        <edgesGeometry args={[geometry]} />
        <lineBasicMaterial color="#E1EEE6" linewidth={2} />
    </mesh>
  );
};

// --- COMPONENTE DOS FEIXES DE LUZ (INALTERADO) ---
const LightBeams = () => {
    const group = useRef<THREE.Group>(null!);
    useFrame(({ clock }) => {
        if(group.current) {
            group.current.rotation.y = clock.getElapsedTime() * 0.05;
            group.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.1) * 0.2;
        }
    });

    const colors = ['#00aaff', '#ffaa00', '#ff00aa', '#aaff00', '#00ffaa', '#aa00ff', '#ff4400'];
    
    return (
        <group ref={group}>
            {colors.map((color, i) => (
                <mesh key={i} rotation={[0, 0, (Math.PI * 2 * i) / colors.length]} position={[0,0,0]}>
                    <planeGeometry args={[0.08, 30]} />
                    <meshBasicMaterial 
                        color={color} 
                        transparent 
                        opacity={0.3} 
                        blending={THREE.AdditiveBlending}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            ))}
        </group>
    );
}

export default function PrismaLogo() {
  return (
    <div className="absolute inset-0 z-0 opacity-25">
      <Canvas camera={{ position: [0, 0, 10], fov: 75 }}>
        <Prism />
        <LightBeams />
      </Canvas>
    </div>
  );
}