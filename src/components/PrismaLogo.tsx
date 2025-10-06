// src/components/PrismaLogo.tsx
import { Canvas } from '@react-three/fiber';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Prism = () => {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame(() => (meshRef.current.rotation.y += 0.005));

  return (
    <mesh ref={meshRef} scale={[2.5, 2.5, 2.5]}>
      <cylinderGeometry args={[1, 1, 2, 3]} />
      <meshBasicMaterial wireframe color="#E1EEE6" />
    </mesh>
  );
};

const LightBeams = () => {
    const beams = useRef<THREE.Group>(null!);
    useFrame(({ clock }) => {
        if (beams.current) {
            beams.current.rotation.y = clock.getElapsedTime() * 0.1;
        }
    });

    const colors = ['#00aaff', '#ffaa00', '#ff00aa', '#aaff00', '#00ffaa', '#aa00ff'];
    
    return (
        <group ref={beams}>
            {colors.map((color, i) => (
                <mesh key={i} position={[ (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 15]}>
                    <boxGeometry args={[0.1, 0.1, 8]} />
                    <meshBasicMaterial color={color} transparent opacity={0.7} />
                </mesh>
            ))}
        </group>
    );
}

export default function PrismaLogo() {
  return (
    <div className="absolute inset-0 z-0 opacity-20">
      <Canvas camera={{ position: [0, 0, 10], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <Prism />
        <LightBeams />
      </Canvas>
    </div>
  );
}