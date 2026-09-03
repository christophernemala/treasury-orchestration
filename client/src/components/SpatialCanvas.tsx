import {
  Component,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  AdaptiveDpr,
  Float,
  MeshDistortMaterial,
  PointMaterial,
  Points,
  Sphere,
} from "@react-three/drei";
import * as THREE from "three";
import type { ConnectionStatus } from "../types";

const palette: Record<ConnectionStatus, string> = {
  connecting: "#3b82f6",
  connected: "#1769ff",
  reconnecting: "#f59e0b",
  offline: "#e65d70",
};

class CanvasBoundary extends Component<
  { children: ReactNode; fallback: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.fallback();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function seededPositions(count: number) {
  let seed = 21991;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const values = new Float32Array(count * 3);
  for (let i = 0; i < values.length; i += 3) {
    values[i] = (next() - 0.5) * 15;
    values[i + 1] = (next() - 0.5) * 11;
    values[i + 2] = (next() - 0.5) * 12;
  }
  return values;
}

function ParticleField({ compact }: { compact: boolean }) {
  const positions = useMemo(
    () => seededPositions(compact ? 180 : 600),
    [compact],
  );
  return (
    <Points positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#60708b"
        size={compact ? 0.025 : 0.035}
        sizeAttenuation
        depthWrite={false}
        opacity={0.55}
      />
    </Points>
  );
}

function AgentCoreSphere({
  status,
  reduced,
  pointer,
}: {
  status: ConnectionStatus;
  reduced: boolean;
  pointer: MutableRefObject<{ x: number; y: number }>;
}) {
  const mesh = useRef<THREE.Mesh>(null!);
  const group = useRef<THREE.Group>(null!);
  useFrame((_state, delta) => {
    if (!mesh.current || !group.current || reduced) return;
    mesh.current.rotation.x += delta * 0.16;
    mesh.current.rotation.y += delta * 0.24;
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      pointer.current.x * 0.12,
      0.04,
    );
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      -pointer.current.y * 0.08,
      0.04,
    );
  });
  return (
    <group ref={group}>
      <Float
        speed={reduced ? 0 : 1.4}
        rotationIntensity={reduced ? 0 : 0.35}
        floatIntensity={reduced ? 0 : 0.65}
      >
        <Sphere ref={mesh} args={[1.28, 48, 48]}>
          <MeshDistortMaterial
            color={palette[status]}
            distort={reduced ? 0 : 0.32}
            speed={reduced ? 0 : 2.1}
            roughness={0.18}
            metalness={0.82}
            wireframe
          />
        </Sphere>
      </Float>
      <pointLight color={palette[status]} intensity={3.4} distance={7} />
    </group>
  );
}

function Scene({
  status,
  reduced,
  compact,
  pointer,
}: {
  status: ConnectionStatus;
  reduced: boolean;
  compact: boolean;
  pointer: MutableRefObject<{ x: number; y: number }>;
}) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 6, 4]} intensity={1.2} />
      <AgentCoreSphere status={status} reduced={reduced} pointer={pointer} />
      <ParticleField compact={compact} />
      <AdaptiveDpr pixelated />
    </>
  );
}

export function SpatialCanvas({ status }: { status: ConnectionStatus }) {
  const [available, setAvailable] = useState(() => {
    try {
      return Boolean(document.createElement("canvas").getContext("webgl2"));
    } catch {
      return false;
    }
  });
  const [reduced, setReduced] = useState(false);
  const [compact, setCompact] = useState(innerWidth < 760);
  const pointer = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)"),
      mobile = matchMedia("(max-width: 760px)");
    const sync = () => {
      setReduced(motion.matches);
      setCompact(mobile.matches);
    };
    sync();
    motion.addEventListener("change", sync);
    mobile.addEventListener("change", sync);
    const move = (e: PointerEvent) => {
      pointer.current = {
        x: (e.clientX / innerWidth) * 2 - 1,
        y: (e.clientY / innerHeight) * 2 - 1,
      };
    };
    addEventListener("pointermove", move, { passive: true });
    return () => {
      motion.removeEventListener("change", sync);
      mobile.removeEventListener("change", sync);
      removeEventListener("pointermove", move);
    };
  }, []);
  if (!available)
    return <div className="spatial-fallback" aria-hidden="true" />;
  return (
    <div className="spatial-canvas" aria-hidden="true">
      <CanvasBoundary fallback={() => setAvailable(false)}>
        <Canvas
          dpr={[1, 1.5]}
          frameloop={reduced ? "demand" : "always"}
          camera={{ position: [0, 0, 5], fov: 58 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          onCreated={({ gl }) =>
            gl.domElement.addEventListener(
              "webglcontextlost",
              (e) => {
                e.preventDefault();
                setAvailable(false);
              },
              { once: true },
            )
          }
        >
          <Scene
            status={status}
            reduced={reduced}
            compact={compact}
            pointer={pointer}
          />
        </Canvas>
      </CanvasBoundary>
    </div>
  );
}
