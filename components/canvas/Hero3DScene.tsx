'use client';

import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Torus, Stars } from '@react-three/drei';
import * as THREE from 'three';

// The golden armillary sphere-like rings (matching the video)
function ArmillaryRings() {
  const groupRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.12;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.4;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = t * 0.28;
      ring2Ref.current.rotation.x = Math.PI / 3;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.y = t * 0.35;
      ring3Ref.current.rotation.z = Math.PI / 4;
    }
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.2;
      coreRef.current.rotation.x = t * 0.12;
    }
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: '#C9A84C',
    metalness: 0.85,
    roughness: 0.25,
    emissive: '#8B6914',
    emissiveIntensity: 0.4,
  });

  const coreMat = new THREE.MeshStandardMaterial({
    color: '#1a1c2e',
    metalness: 0.6,
    roughness: 0.4,
    emissive: '#2D3460',
    emissiveIntensity: 0.3,
  });

  return (
    <group ref={groupRef}>
      {/* Core sphere */}
      <Sphere ref={coreRef} args={[0.65, 32, 32]}>
        <primitive object={coreMat} attach="material" />
      </Sphere>

      {/* Ring 1: equatorial */}
      <Torus ref={ring1Ref} args={[1.1, 0.025, 8, 100]}>
        <primitive object={goldMat} attach="material" />
      </Torus>

      {/* Ring 2: meridian */}
      <Torus ref={ring2Ref} args={[1.1, 0.022, 8, 100]}>
        <primitive object={goldMat} attach="material" />
      </Torus>

      {/* Ring 3: polar */}
      <Torus ref={ring3Ref} args={[1.1, 0.018, 8, 100]}>
        <primitive object={goldMat} attach="material" />
      </Torus>

      {/* Outer ring */}
      <Torus args={[1.45, 0.015, 8, 120]}>
        <meshStandardMaterial
          color="#8B6914"
          metalness={0.9}
          roughness={0.3}
          emissive="#4A3808"
          emissiveIntensity={0.3}
        />
      </Torus>
    </group>
  );
}

// Floating golden particles like the video
function GoldenParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 200;

  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 1.8 + Math.random() * 2.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = clock.getElapsedTime() * 0.06;
      pointsRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.04) * 0.2;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#E8C97A"
        size={0.025}
        sizeAttenuation
        transparent
        opacity={0.7}
      />
    </points>
  );
}

export default function Hero3DScene() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        {/* Starfield background */}
        <Stars
          radius={80}
          depth={50}
          count={2000}
          factor={3}
          saturation={0.1}
          fade
          speed={0.3}
        />

        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[3, 5, 3]}
          intensity={1.8}
          color="#E8D5A0"
        />
        <pointLight
          position={[-3, -2, 2]}
          intensity={0.8}
          color="#5E6AD2"
        />
        <pointLight
          position={[2, 3, -2]}
          intensity={0.6}
          color="#C9A84C"
        />

        {/* Main armillary sphere */}
        <ArmillaryRings />

        {/* Floating golden particles */}
        <GoldenParticles />
      </Canvas>
    </div>
  );
}
