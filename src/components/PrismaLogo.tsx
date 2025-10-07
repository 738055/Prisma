// src/components/PrismaLogo.tsx (VERSÃO ATUALIZADA)
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Edges } from '@react-three/drei';

// --- COMPONENTE DO PRISMA TRIANGULAR ---
const Prism = () => {
  const meshRef = useRef<THREE.Mesh>(null!);

  // Rotação suave e contínua
  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      meshRef.current.rotation.y = t * 0.2;
      meshRef.current.rotation.x = Math.sin(t * 0.5) * 0.1;
    }
  });

  // Geometria de um prisma de base triangular
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const radius = 1.2; // Raio do triângulo
    shape.moveTo(0, radius);
    shape.lineTo(radius * Math.sin((2 * Math.PI) / 3), radius * Math.cos((2 * Math.PI) / 3));
    shape.lineTo(radius * Math.sin((4 * Math.PI) / 3), radius * Math.cos((4 * Math.PI) / 3));
    shape.closePath();

    const extrudeSettings = {
      steps: 1,
      depth: 1.8, // Altura do prisma
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 5,
    };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  return (
    <mesh ref={meshRef} geometry={geometry} scale={[1.5, 1.5, 1.5]}>
        {/* Material de cristal que reage à luz */}
        <meshPhysicalMaterial
            color="#ffffff"
            transmission={1.0} // Permite a passagem de luz (transparência)
            roughness={0.05}   // Superfície polida
            metalness={0.0}
            thickness={2.0}    // Espessura para refração
            ior={1.5}          // Índice de Refração (similar a vidro)
        />
        {/* Arestas brancas para definir a forma */}
        <Edges scale={1} threshold={15}>
            <lineBasicMaterial color="#ffffff" linewidth={1} />
        </Edges>
    </mesh>
  );
};

// --- LUZES VIVAS E COLORIDAS ---
const VividLights = () => {
    const groupRef = useRef<THREE.Group>(null!);

    const lights = useMemo(() => [
        { color: '#00aaff', intensity: 15, distance: 12 },
        { color: '#ff00aa', intensity: 15, distance: 12 },
        { color: '#aaff00', intensity: 10, distance: 12 },
    ], []);

    useFrame(({ clock }) => {
        if (groupRef.current) {
            const t = clock.getElapsedTime() * 0.4;
            groupRef.current.children.forEach((light, i) => {
                const angle = t + (i * 2 * Math.PI) / lights.length;
                light.position.x = 6 * Math.cos(angle);
                light.position.z = 6 * Math.sin(angle);
                light.position.y = 4 * Math.sin(angle * 2);
            });
        }
    });

    return (
        <group ref={groupRef}>
            {lights.map((light, i) => <pointLight key={i} {...light} />)}
        </group>
    );
}

export default function PrismaLogo() {
  return (
    <div className="absolute inset-0 z-0 opacity-30">
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
        {/* Feixe de luz branco ao fundo */}
        <pointLight color="#ffffff" intensity={10} distance={15} position={[0, 0, -10]} />
        <ambientLight intensity={0.2} />
        <Prism />
        <VividLights />
      </Canvas>
    </div>
  );
}