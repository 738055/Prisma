// src/components/PrismaLogo.tsx (VERSÃO FINAL ATUALIZADA)
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Edges } from '@react-three/drei';

// --- COMPONENTE DO PRISMA TRIANGULAR ---
const Prism = () => {
  const meshRef = useRef<THREE.Mesh>(null!);

  // Rotação suave para interagir com a luz
  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      meshRef.current.rotation.y = t * 0.25;
      meshRef.current.rotation.x = Math.sin(t * 0.5) * 0.15;
    }
  });

  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const radius = 1.0;
    shape.moveTo(0, radius);
    shape.lineTo(radius * Math.sin((2 * Math.PI) / 3), radius * Math.cos((2 * Math.PI) / 3));
    shape.lineTo(radius * Math.sin((4 * Math.PI) / 3), radius * Math.cos((4 * Math.PI) / 3));
    shape.closePath();

    const extrudeSettings = { depth: 1.5, bevelEnabled: false };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  return (
    <mesh ref={meshRef} geometry={geometry} scale={[1.8, 1.8, 1.8]}>
      <meshPhysicalMaterial
        color="#ffffff"
        transmission={1.0}
        roughness={0.0}
        thickness={1.5}
        ior={1.7} // Índice de refração alto para distorcer a luz
      />
      <Edges>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.7} />
      </Edges>
    </mesh>
  );
};

// --- FEIXES DE LUZ COLORIDOS QUE ENTRAM NO PRISMA ---
const IncomingBeams = () => {
    const groupRef = useRef<THREE.Group>(null!);

    const beams = useMemo(() => [
        { color: '#ff0055', position: new THREE.Vector3(0, 0.5, 0) },
        { color: '#00aaff', position: new THREE.Vector3(0, 0, 0) },
        { color: '#aaff00', position: new THREE.Vector3(0, -0.5, 0) },
        { color: '#ffaa00', position: new THREE.Vector3(0, 0.25, 0.2) },
        { color: '#aa00ff', position: new THREE.Vector3(0, -0.25, -0.2) },
    ], []);

    useFrame(({ clock }) => {
        if(groupRef.current) {
            // Movimento sutil nos feixes
            groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
        }
    });

    return (
        <group ref={groupRef} position={[-6, 0, 0]} rotation={[0, 0.5, 0]}>
            {beams.map((beam, i) => (
                <mesh key={i} position={beam.position}>
                    <planeGeometry args={[6, 0.1]} />
                    <meshBasicMaterial
                        color={beam.color}
                        transparent
                        opacity={0.6}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
            ))}
        </group>
    );
}

// --- FEIXE DE LUZ BRANCO QUE SAI DO PRISMA ---
const OutgoingBeam = () => {
    const meshRef = useRef<THREE.Mesh>(null!);

    useFrame(({ clock }) => {
        if (meshRef.current) {
            // Animação de pulsação sutil na opacidade
            const intensity = 0.5 + Math.sin(clock.getElapsedTime() * 2) * 0.2;
            (meshRef.current.material as THREE.MeshBasicMaterial).opacity = intensity;
        }
    });

    return (
        <group position={[7, 0, 0]} rotation={[0, -0.5, 0]}>
            <mesh ref={meshRef}>
                <planeGeometry args={[10, 2]} />
                 <meshBasicMaterial
                    color={"#ffffff"}
                    transparent
                    opacity={0.7}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
        </group>
    )
}


export default function PrismaLogo() {
  return (
    <div className="absolute inset-0 z-0 opacity-40">
      <Canvas camera={{ position: [0, 0, 12], fov: 60 }}>
        <ambientLight intensity={0.1} />
        <Prism />
        <IncomingBeams />
        <OutgoingBeam />
      </Canvas>
    </div>
  );
}