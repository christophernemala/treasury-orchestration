import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

function AtomRings() {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (ring1Ref.current) {
      ring1Ref.current.rotation.y += delta * 0.4;
      ring1Ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.6) * 0.15 + 0.3;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y -= delta * 0.35;
      ring2Ref.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.5) * 0.18 - 0.25;
    }
  });

  return (
    <group position={[0, 0.2, 0]}>
      {/* Outer Torus Ring 1 */}
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.4}>
        <mesh ref={ring1Ref} rotation={[0.4, 0.3, 0]}>
          <torusGeometry args={[2.2, 0.12, 32, 100]} />
          <meshStandardMaterial
            color="#C3A77B"
            emissive="#7A6136"
            emissiveIntensity={0.4}
            metalness={0.92}
            roughness={0.18}
          />
        </mesh>
      </Float>

      {/* Inner Intersecting Torus Ring 2 */}
      <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.5}>
        <mesh ref={ring2Ref} rotation={[-0.5, -0.4, 0.6]}>
          <torusGeometry args={[1.7, 0.1, 32, 100]} />
          <meshStandardMaterial
            color="#E4D3B4"
            emissive="#8C6F3C"
            emissiveIntensity={0.5}
            metalness={0.95}
            roughness={0.15}
          />
        </mesh>
      </Float>

      {/* Center Core / Nucleus */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial
          color="#FFF2D6"
          emissive="#C3A77B"
          emissiveIntensity={1.2}
          roughness={0.1}
          metalness={0.5}
        />
      </mesh>
    </group>
  );
}

export function AtomIllustration() {
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) setHasWebGL(false);
    } catch {
      setHasWebGL(false);
    }
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at 50% 45%, #221D16 0%, #0F1214 60%, #080A0C 100%)",
        overflow: "hidden",
      }}
    >
      {/* Background radial glow */}
      <div
        style={{
          position: "absolute",
          width: "480px",
          height: "480px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(195,167,123,0.18) 0%, rgba(195,167,123,0.02) 60%, transparent 80%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      {/* Grid texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          pointerEvents: "none",
        }}
      />

      {/* 3D Canvas or SVG fallback */}
      <div style={{ width: "100%", height: "360px", position: "relative" }}>
        {hasWebGL ? (
          <Canvas
            camera={{ position: [0, 0, 6], fov: 45 }}
            style={{ width: "100%", height: "100%" }}
            gl={{ alpha: true, antialias: true }}
          >
            <ambientLight intensity={0.8} />
            <directionalLight position={[5, 8, 5]} intensity={2.2} color="#FFF2DF" />
            <pointLight position={[-4, -3, -2]} intensity={1.2} color="#C3A77B" />
            <AtomRings />
          </Canvas>
        ) : (
          <div
            style={{
              display: "grid",
              placeItems: "center",
              height: "100%",
            }}
          >
            <svg width="240" height="240" viewBox="0 0 240 240" fill="none">
              <ellipse
                cx="120"
                cy="120"
                rx="100"
                ry="45"
                transform="rotate(-25 120 120)"
                stroke="#C3A77B"
                strokeWidth="5"
                opacity="0.85"
              />
              <ellipse
                cx="120"
                cy="120"
                rx="85"
                ry="40"
                transform="rotate(35 120 120)"
                stroke="#E4D3B4"
                strokeWidth="4"
                opacity="0.9"
              />
              <circle cx="120" cy="120" r="14" fill="#FFF2D6" />
            </svg>
          </div>
        )}
      </div>

      {/* Metallic pedestal reflection label */}
      <div
        style={{
          marginTop: "10px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          zIndex: 2,
        }}
      >
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "22px",
            fontWeight: 700,
            letterSpacing: "0.55em",
            color: "#C3A77B",
            textIndent: "0.55em",
            textShadow: "0 0 24px rgba(195,167,123,0.45)",
          }}
        >
          ATOM
        </span>
        <span
          style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.2em",
            color: "rgba(255,255,255,0.45)",
            textTransform: "uppercase",
          }}
        >
          GOVERNED TREASURY CORE
        </span>
      </div>
    </div>
  );
}
