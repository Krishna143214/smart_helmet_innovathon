 "use client";

import { Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface SimulationHelmetViewProps {
  alertActive: boolean;
  dashboardBuzzerOn: boolean;
  gas: number;
  temperature: number;
  humidity: number;
  severity: "NORMAL" | "WARNING" | "CRITICAL";
}

function ImportedModel({
  alertActive,
  dashboardBuzzerOn,
}: SimulationHelmetViewProps) {
  const { scene } = useGLTF("/models/helmet.glb");
  const framing = useMemo(() => {
    const helmetRoot = scene.getObjectByName("MineWatch_Helmet_Root");
    const model = (helmetRoot ?? scene).clone(true);
    model.traverse((object) => {
      if (!object) return;
      const mesh = object as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.material = Array.isArray(mesh.material)
          ? mesh.material.map((material) => material.clone())
          : mesh.material.clone();
      }
    });
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const largestSide = Math.max(size.x, size.y, size.z);
    const scale = largestSide > 0 ? 2 / largestSide : 1;
    const buzzer = model.getObjectByName("Buzzer");
    return {
      model,
      scale,
      buzzer,
      buzzerBaseScale: buzzer?.scale.clone() ?? new THREE.Vector3(1, 1, 1),
      position: [-center.x * scale, -center.y * scale, -center.z * scale] as [
        number,
        number,
        number,
      ],
    };
  }, [scene]);

  useFrame(({ clock }) => {
    const ledNames = ["Warning_LED_Red", "Warning_LED_Red.001"];
    const ledIntensity = alertActive
      ? 1.4 + (Math.sin(clock.elapsedTime * 10) + 1) * 0.9
      : 0;

    for (const name of ledNames) {
      const led = framing.model.getObjectByName(name);
      led?.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) return;
        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];
        for (const material of materials) {
          if ("emissive" in material) {
            const standard = material as THREE.MeshStandardMaterial;
            standard.emissive.set(alertActive ? "#ff182d" : "#000000");
            standard.emissiveIntensity = ledIntensity;
          }
        }
      });
    }

    if (framing.buzzer) {
      const pulse =
        dashboardBuzzerOn || alertActive
          ? 1 + Math.sin(clock.elapsedTime * 18) * 0.035
          : 1;
      framing.buzzer.scale.copy(framing.buzzerBaseScale).multiplyScalar(pulse);
    }
  });

  return (
    <group position={framing.position} scale={framing.scale}>
      <primitive object={framing.model} />
    </group>
  );
}

export function SimulationHelmetView(_props: SimulationHelmetViewProps) {
  return (
    <div className="simulation-helmet-canvas">
      <Canvas camera={{ position: [3.2, 2.1, 4.6], fov: 38 }} dpr={[1, 1.6]}>
        <color attach="background" args={["#0b1726"]} />
        <ambientLight intensity={1.35} />
        <directionalLight position={[4, 5, 5]} intensity={2.1} />
        <directionalLight
          position={[-4, 2, -3]}
          intensity={1.1}
          color="#69a9ff"
        />
        <Suspense fallback={null}>
          <ImportedModel
            {..._props}
          />
        </Suspense>
        <OrbitControls
          enablePan={false}
          minDistance={2.4}
          maxDistance={8}
          minPolarAngle={0.25}
          maxPolarAngle={2.85}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/helmet.glb");
