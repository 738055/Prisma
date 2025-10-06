// src/components/PrismaLogo.tsx
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

const Prism = () => {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    if (meshRef.current) {
        meshRef.current.rotation.x += 0.001;
        meshRef.current.rotation.y += 0.003;
    }
  });

  const vertices = [
    // base
    1, 0, 1,   -1, 0, 1,   -1, 0, -1,
    -1, 0, -1,   1, 0, -1,   1, 0, 1,
    // apex
    0, 2, 0,
    // faces
    -1, 0, 1,   1, 0, 1,   0, 2, 0,
    1, 0, 1,   1, 0, -1,  0, 2, 0,
    1, 0, -1,  -1, 0, -1, 0, 2, 0,
    -1, 0, -1,  -1, 0, 1,  0, 2, 0
  ];
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

  return (
    <lineSegments ref={meshRef} geometry={geometry} scale={[1.5, 1.5, 1.5]}>
        <lineBasicMaterial color="#E1EEE6" linewidth={2} />
    </lineSegments>
  );
};

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
                    <planeGeometry args={[0.1, 30]} />
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
      <Canvas camera={{ position: [0, 0, 15], fov: 75 }}>
        <Prism />
        <LightBeams />
      </Canvas>
    </div>
  );
}