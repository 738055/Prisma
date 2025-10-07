// src/components/PrismaLogo.tsx (VERSÃO ATUALIZADA)
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

// --- COMPONENTE DO PRISMA DE CRISTAL ---
const CrystalPrism = () => {
  const meshRef = useRef<THREE.Mesh>(null!);

  // Animação de rotação mais suave e elegante
  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      meshRef.current.rotation.y = t * 0.1;
      meshRef.current.rotation.x = Math.sin(t * 0.5) * 0.1;
    }
  });

  // Geometria de um prisma triangular
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const radius = 1.0; // Raio do triângulo equilátero
    shape.moveTo(0, radius);
    shape.lineTo(radius * Math.sin((2 * Math.PI) / 3), radius * Math.cos((2 * Math.PI) / 3));
    shape.lineTo(radius * Math.sin((4 * Math.PI) / 3), radius * Math.cos((4 * Math.PI) / 3));
    shape.closePath();

    const extrudeSettings = {
      steps: 1,
      depth: 1.5, // Altura do prisma
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 2,
    };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  return (
    <mesh ref={meshRef} geometry={geometry} scale={[1.5, 1.5, 1.5]} position={[0, 0, 0]}>
        {/* Material físico que reage realisticamente à luz */}
        <meshPhysicalMaterial
            color="#ffffff"
            transmission={1.0}
            roughness={0.05}
            metalness={0.0}
            thickness={1.5}
            ior={1.7} // Índice de refração (similar ao diamante)
            envMapIntensity={0.5}
        />
    </mesh>
  );
};

// --- COMPONENTE DAS LUZES ORBITAIS COLORIDAS ---
const OrbitingLights = () => {
    const groupRef = useRef<THREE.Group>(null!);

    // Luzes coloridas que se movem em órbitas
    const lights = useMemo(() => [
        { color: '#00aaff', intensity: 150, distance: 10, position: [5, 2, 0] },
        { color: '#ff00aa', intensity: 150, distance: 10, position: [-5, -2, 0] },
        { color: '#aaff00', intensity: 100, distance: 10, position: [0, 5, 0] },
    ], []);

    useFrame(({ clock }) => {
        if (groupRef.current) {
            const t = clock.getElapsedTime() * 0.5;
            groupRef.current.children.forEach((light, i) => {
                const angle = t + (i * 2 * Math.PI) / lights.length;
                light.position.x = 5 * Math.cos(angle);
                light.position.z = 5 * Math.sin(angle);
                light.position.y = 3 * Math.sin(angle * 2);
            });
        }
    });

    return (
        <group ref={groupRef}>
            {lights.map((light, i) => (
                <pointLight
                    key={i}
                    color={light.color}
                    intensity={light.intensity}
                    distance={light.distance}
                />
            ))}
        </group>
    );
};

// --- COMPONENTE DO FEIXE DE LUZ DE FUNDO ---
const WhiteLightBeam = () => {
    return (
        <mesh position={[0, 0, -5]} rotation={[0, 0, 0]}>
            <planeGeometry args={[15, 15]} />
            <meshBasicMaterial transparent opacity={0.3}>
                <gradientTexture
                    stops={[0, 0.5, 1]}
                    colors={['#ffffff', '#ffffff', 'transparent']}
                    size={1024}
                />
            </meshBasicMaterial>
        </mesh>
    );
}

// --- COMPONENTE PRINCIPAL DO LOGO ---
export default function PrismaLogo() {
  return (
    <div className="absolute inset-0 z-0 opacity-40">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={0.2} />
        <WhiteLightBeam />
        <CrystalPrism />
        <OrbitingLights />
      </Canvas>
    </div>
  );
}