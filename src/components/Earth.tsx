import { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

function EarthWithTextures({ earthRef, cloudsRef }: { earthRef: React.MutableRefObject<THREE.Mesh | null>, cloudsRef: React.MutableRefObject<THREE.Mesh | null> }) {
  const [texturesLoaded, setTexturesLoaded] = useState(false);

  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();
    
    const loadTexture = (url: string): Promise<THREE.Texture> => {
      return new Promise((resolve, reject) => {
        textureLoader.load(
          url,
          (texture) => resolve(texture),
          undefined,
          (error) => {
            console.error('Failed to load texture:', url, error);
            reject(error);
          }
        );
      });
    };

    const textureUrls = [
      '/earth_arcgis.jpg',
      '/earth_clouds_4k.png',
      '/earth_lights_4k.png'
    ];

    console.log('开始加载纹理文件:', textureUrls);

    Promise.all(textureUrls.map(url => loadTexture(url)))
      .then(textures => {
        console.log('All textures loaded successfully:', textures);
        console.log('Earth texture:', textures[0]);
        console.log('Cloud texture:', textures[1]);
        console.log('Lights texture:', textures[2]);
        
        setTimeout(() => {
          if (earthRef?.current && earthRef.current.material) {
            const material = earthRef.current.material as THREE.MeshStandardMaterial;
            material.map = textures[0];
            material.emissiveMap = textures[2];
            material.emissive = new THREE.Color(0xffffff);
            material.emissiveIntensity = 2.5;
            material.needsUpdate = true;
            console.log('Earth material updated with local textures, emissive map:', textures[2], 'intensity:', 2.5);
          }
          if (cloudsRef?.current && cloudsRef.current.material) {
            const material = cloudsRef.current.material as THREE.MeshStandardMaterial;
            material.map = textures[1];
            material.transparent = true;
            material.opacity = 0.3;
            material.needsUpdate = true;
            console.log('Cloud material updated with local textures');
          }
          setTexturesLoaded(true);
          console.log('All local textures applied successfully');
        }, 200);
      })
      .catch(error => {
        console.error('Failed to load local textures:', error);
        console.error('纹理加载失败，将使用默认颜色');
        setTexturesLoaded(true);
      });
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.0005;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.0007;
    }
  });

  return (
    <>
      <mesh ref={earthRef}>
        <sphereGeometry args={[2, 128, 128]} />
        <meshStandardMaterial
          color={texturesLoaded ? "#ffffff" : "#3b4a5a"}
          metalness={0.0}
          roughness={0.7}
        />
      </mesh>

      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.03, 96, 96]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent={true}
          opacity={0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

function latLongToVector3(lat: number, lon: number, radius: number, height: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius + height) * Math.sin(phi) * Math.cos(theta);
  const z = (radius + height) * Math.sin(phi) * Math.sin(theta);
  const y = (radius + height) * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

function CityMarker({ lat, lon, color }: { lat: number; lon: number; color: string }) {
  const pos = latLongToVector3(lat, lon, 2, 0.02);
  return (
    <mesh position={pos.toArray()}>
      <sphereGeometry args={[0.03, 12, 12]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
    </mesh>
  );
}

function Graticule({ radius = 2.01 }: { radius?: number }) {
  const latLines = useMemo(() => {
    const lines: Float32Array[] = [];
    for (let lat = -75; lat <= 75; lat += 15) {
      const points: number[] = [];
      for (let lon = -180; lon <= 180; lon += 4) {
        const p = latLongToVector3(lat, lon, radius, 0);
        points.push(p.x, p.y, p.z);
      }
      lines.push(new Float32Array(points));
    }
    return lines;
  }, [radius]);

  const lonLines = useMemo(() => {
    const lines: Float32Array[] = [];
    for (let lon = -180; lon < 180; lon += 15) {
      const points: number[] = [];
      for (let lat = -90; lat <= 90; lat += 3) {
        const p = latLongToVector3(lat, lon, radius, 0);
        points.push(p.x, p.y, p.z);
      }
      lines.push(new Float32Array(points));
    }
    return lines;
  }, [radius]);

  return (
    <group>
      {latLines.map((line, idx) => (
        <line key={`lat-${idx}`}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[line, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#93c5fd" transparent opacity={0.2} />
        </line>
      ))}
      {lonLines.map((line, idx) => (
        <line key={`lon-${idx}`}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[line, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#60a5fa" transparent opacity={0.16} />
        </line>
      ))}
    </group>
  );
}

function OrbitingSatellite({
  radius,
  speed,
  color,
  tiltX,
  tiltZ,
  size = 0.04
}: {
  radius: number;
  speed: number;
  color: string;
  tiltX: number;
  tiltZ: number;
  size?: number;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.rotation.x = tiltX;
    groupRef.current.rotation.z = tiltZ;
  }, [tiltX, tiltZ]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed;
    if (!meshRef.current) return;
    const x = Math.cos(t) * radius;
    const z = Math.sin(t) * radius;
    meshRef.current.position.set(x, 0, z);
    const dx = -Math.sin(t);
    const dz = Math.cos(t);
    meshRef.current.lookAt(new THREE.Vector3(x + dx, 0, z + dz));
  });

  return (
    <group ref={groupRef}>
      <group ref={meshRef}>
        <mesh>
          <cylinderGeometry args={[size, size, size * 3, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[-size * 3, 0, 0]}>
          <boxGeometry args={[size * 4, size * 0.2, size * 1.5]} />
          <meshStandardMaterial color="#1e3a8a" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[size * 3, 0, 0]}>
          <boxGeometry args={[size * 4, size * 0.2, size * 1.5]} />
          <meshStandardMaterial color="#1e3a8a" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, -size * 1.5, 0]}>
          <sphereGeometry args={[size * 0.5]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
        </mesh>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.005, radius + 0.005, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export default function Earth({
  targetCoords,
  isSearching
}: {
  targetCoords: { lat: number; lon: number } | null;
  isSearching: boolean;
}) {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const controlsRef = useRef<any>(null);
  const [targetCameraPos, setTargetCameraPos] = useState<THREE.Vector3 | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (targetCoords && !isSearching) {
      setTargetCameraPos(latLongToVector3(targetCoords.lat, targetCoords.lon, 2, 0.25));
      setIsResetting(false);
    } else if (!isSearching) {
      setTargetCameraPos(new THREE.Vector3(0, 0, 6));
      setIsResetting(true);
    }
  }, [targetCoords, isSearching]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (!targetCameraPos && !isSearching && !isResetting && earthRef.current) {
      earthRef.current.rotation.y += 0.0005;
      if (cloudsRef.current) {
        cloudsRef.current.rotation.y += 0.0007;
      }
    }
    
    if (targetCameraPos && controlsRef.current) {
      state.camera.position.lerp(targetCameraPos, 0.03);
      controlsRef.current.target.lerp(new THREE.Vector3(0, 0, 0), 0.08);
      controlsRef.current.update();
      if (isResetting && state.camera.position.distanceTo(targetCameraPos) < 0.08) {
        setIsResetting(false);
        setTargetCameraPos(null);
      }
    }

    if (earthRef.current && isSearching) {
      earthRef.current.rotation.y = time * 0.5;
      if (cloudsRef.current) {
        cloudsRef.current.rotation.y = time * 0.55;
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.8} color="#6b7280" />
      <directionalLight position={[6, 3, 6]} intensity={2.0} color="#ffffff" castShadow />
      <pointLight position={[-8, -4, -6]} intensity={0.3} color="#3b82f6" />
      <pointLight position={[0, 0, 8]} intensity={0.2} color="#1a1a2e" />
      
      <Stars radius={1000} depth={100} count={15000} factor={4} saturation={0.8} fade speed={1.2} />

      <EarthWithTextures earthRef={earthRef} cloudsRef={cloudsRef} />

      <CityMarker lat={39.9042} lon={116.4074} color="#22d3ee" />
      <CityMarker lat={40.7128} lon={-74.006} color="#f59e0b" />
      <CityMarker lat={51.5074} lon={-0.1278} color="#a78bfa" />
      <CityMarker lat={35.6762} lon={139.6503} color="#34d399" />

      <OrbitingSatellite radius={2.3} speed={0.4} color="#4ade80" tiltX={0.2} tiltZ={0.1} />
      <OrbitingSatellite radius={2.5} speed={0.25} color="#60a5fa" tiltX={-0.4} tiltZ={0.3} size={0.05} />
      <OrbitingSatellite radius={2.7} speed={0.35} color="#f472b6" tiltX={0.6} tiltZ={-0.2} />

      <OrbitControls
        ref={controlsRef}
        enableZoom
        enablePan={false}
        enableRotate
        autoRotate={false}
        minDistance={2.05}
        maxDistance={10}
      />
    </>
  );
}