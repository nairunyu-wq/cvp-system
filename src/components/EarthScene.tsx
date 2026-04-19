import { Canvas } from '@react-three/fiber';
import Earth from './Earth';

export default function EarthScene({ targetCoords, isSearching }: { targetCoords: { lat: number, lon: number } | null, isSearching: boolean }) {
  return (
    <div className="w-full h-full absolute inset-0 flex items-center justify-center" style={{ backgroundColor: '#050814', overflow: 'hidden' }}>
      <Canvas 
        camera={{ position: [0, 0, 6], fov: 45, near: 0.01, far: 2000 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ 
          antialias: true, 
          alpha: false, 
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance'
        }}
        dpr={[1, 2]}
        frameloop="always"
      >
        <color attach="background" args={['#050814']} />
        <Earth targetCoords={targetCoords} isSearching={isSearching} />
      </Canvas>
    </div>
  );
}