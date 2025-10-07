// src/components/PrismaLogo.tsx (VERSÃO FINAL E DINÂMICA)
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

// --- PARTÍCULAS DE LUZ COLORIDAS EM MOVIMENTO ---
const LightParticles = () => {
  const meshRef = useRef<THREE.Points>(null!);

  const count = 200;
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const palette = [new THREE.Color('#00aaff'), new THREE.Color('#ff00aa'), new THREE.Color('#aaff00'), new THREE.Color('#ffaa00')];

    for (let i = 0; i < count; i++) {
      // Posição inicial à esquerda
      positions[i * 3] = -10 - Math.random() * 5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 3;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3;

      // Velocidade para a direita
      velocities[i * 3] = 2 + Math.random() * 2; // Velocidade em X
      velocities[i * 3 + 1] = 0;
      velocities[i * 3 + 2] = 0;

      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return { positions, colors, velocities };
  }, []);

  useFrame((state, delta) => {
    if (meshRef.current) {
      const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        positions[i * 3] += particles.velocities[i * 3] * delta;

        // Se a partícula passar do prisma, reseta sua posição
        if (positions[i * 3] > 0) {
          positions[i * 3] = -10 - Math.random() * 5;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 3;
        }
      }
      meshRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={particles.positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={particles.colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} vertexColors blending={THREE.AdditiveBlending} transparent />
    </points>
  );
};

// --- PRISMA CENTRAL GIRATÓRIO ---
const RotatingPrism = () => {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      meshRef.current.rotation.y = t * 0.4;
      meshRef.current.rotation.x = Math.sin(t * 0.7) * 0.2;
    }
  });
  
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const radius = 1.0;
    shape.moveTo(0, radius);
    shape.lineTo(radius * Math.sin((2 * Math.PI) / 3), radius * Math.cos((2 * Math.PI) / 3));
    shape.lineTo(radius * Math.sin((4 * Math.PI) / 3), radius * Math.cos((4 * Math.PI) / 3));
    shape.closePath();
    const extrudeSettings = { depth: 1.5, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2 };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} scale={[1.6, 1.6, 1.6]}>
      <primitive object={geometry} />
      <meshPhysicalMaterial
        color="#ffffff"
        transmission={1.0}
        roughness={0.0}
        thickness={2.0}
        ior={1.7}
      />
    </mesh>
  );
};

// --- FEIXE DE LUZ BRANCO EM MOVIMENTO ---
const WhiteBeam = () => {
    const materialRef = useRef<THREE.ShaderMaterial>(null!);

    useFrame((state) => {
        if(materialRef.current) {
            materialRef.current.uniforms.time.value = state.clock.getElapsedTime();
        }
    });

    const shader = {
        uniforms: { time: { value: 0 } },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            varying vec2 vUv;
            void main() {
                float intensity = smoothstep(0.0, 0.8, vUv.x);
                float wave = 0.5 + 0.5 * sin(vUv.x * 20.0 - time * 2.0);
                float opacity = intensity * wave;
                gl_FragColor = vec4(1.0, 1.0, 1.0, opacity);
            }
        `
    }

    return (
        <mesh position={[6, 0, 0]} rotation={[0,0,0]}>
            <planeGeometry args={[10, 1.5]} />
            <shaderMaterial
                ref={materialRef}
                args={[shader]}
                transparent
                blending={THREE.AdditiveBlending}
            />
        </mesh>
    );
}

export default function PrismaLogo() {
  return (
    <div className="absolute inset-0 z-0 opacity-50">
      <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
        <ambientLight intensity={0.2} />
        <LightParticles />
        <RotatingPrism />
        <WhiteBeam />
      </Canvas>
    </div>
  );
}