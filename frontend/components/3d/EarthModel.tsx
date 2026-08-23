'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

interface EarthModelProps {
  className?: string;
}

export function EarthModel({ className = '' }: EarthModelProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const sceneRef = useRef<{
    renderer?: THREE.WebGLRenderer;
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    controls?: OrbitControls;
    earth?: THREE.Mesh;
    animationId?: number;
  }>({});

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !mountRef.current) return;

    const initScene = async () => {
      try {
        const mount = mountRef.current;
        if (!mount) return;

        // Use WebGL renderer (simpler and more compatible)
        const renderer = new THREE.WebGLRenderer({ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance" 
        });

        const width = mount.clientWidth;
        const height = mount.clientHeight;
        
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mount.appendChild(renderer.domElement);

        // Setup Scene & Camera
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(25, width / height, 0.1, 100);
        camera.position.set(4.5, 2, 3);

        // OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = true;
        controls.enablePan = false;
        controls.minDistance = 3;
        controls.maxDistance = 10;

        // Load Textures
        const textureLoader = new THREE.TextureLoader();
        
        // For demo purposes, create simple colored textures instead of loading files
        // In production, you would load actual Earth texture files
        const createColorTexture = (color: string) => {
          const canvas = document.createElement('canvas');
          canvas.width = 256;
          canvas.height = 256;
          const context = canvas.getContext('2d')!;
          context.fillStyle = color;
          context.fillRect(0, 0, 256, 256);
          
          // Add some noise for Earth-like appearance
          context.fillStyle = 'rgba(255, 255, 255, 0.1)';
          for (let i = 0; i < 1000; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const size = Math.random() * 2;
            context.fillRect(x, y, size, size);
          }
          
          const texture = new THREE.CanvasTexture(canvas);
          texture.colorSpace = THREE.SRGBColorSpace;
          return texture;
        };

        const dayTexture = createColorTexture('#4a7c59'); // Earth green-blue
        const nightTexture = createColorTexture('#1a1a2e'); // Dark with city lights effect

        // Create Earth Mesh with Node Material (TSL simulation)
        const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
        
        // For now, use standard material since WebGPU TSL support may vary
        // In production with proper TSL support, you'd use MeshStandardNodeMaterial
        const earthMaterial = new THREE.MeshStandardMaterial({
          map: dayTexture,
          // Simulate day/night blending with emissive for night side
          emissiveMap: nightTexture,
          emissive: new THREE.Color(0x112244),
          emissiveIntensity: 0.2,
          roughness: 0.8,
          metalness: 0.1,
        });

        const earth = new THREE.Mesh(earthGeometry, earthMaterial);
        scene.add(earth);

        // Sun Light
        const sun = new THREE.DirectionalLight(0xffffff, 2);
        sun.position.set(5, 3, 5);
        sun.castShadow = true;
        scene.add(sun);

        // Ambient light for better visibility
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        scene.add(ambientLight);

        // Store references
        sceneRef.current = {
          renderer,
          scene,
          camera,
          controls,
          earth,
        };

        // Animation Loop
        const animate = () => {
          const animationId = requestAnimationFrame(animate);
          sceneRef.current.animationId = animationId;

          if (earth) {
            earth.rotation.y += 0.002; // Slow rotation
          }

          if (controls) {
            controls.update();
          }

          renderer.render(scene, camera);
        };

        animate();

        // Handle resize
        const handleResize = () => {
          if (!mount || !camera || !renderer) return;
          
          const width = mount.clientWidth;
          const height = mount.clientHeight;
          
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        };

        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
        };

      } catch (error) {
        console.error('Error initializing WebGPU Earth model:', error);
        
        // Fallback to basic WebGL if WebGPU fails
        initBasicEarth();
      }
    };

    const initBasicEarth = () => {
      const mount = mountRef.current;
      if (!mount) return;

      // Fallback WebGL renderer
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true 
      });
      
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(25, width / height, 0.1, 100);
      camera.position.set(4.5, 2, 3);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;

      // Simple Earth with gradient material
      const earthGeometry = new THREE.SphereGeometry(1, 32, 32);
      const earthMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a7c59,
        roughness: 0.8,
        metalness: 0.1,
      });

      const earth = new THREE.Mesh(earthGeometry, earthMaterial);
      scene.add(earth);

      const sun = new THREE.DirectionalLight(0xffffff, 2);
      sun.position.set(5, 3, 5);
      scene.add(sun);

      const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
      scene.add(ambientLight);

      sceneRef.current = {
        renderer: renderer as any,
        scene,
        camera,
        controls,
        earth,
      };

      const animate = () => {
        const animationId = requestAnimationFrame(animate);
        sceneRef.current.animationId = animationId;

        if (earth) {
          earth.rotation.y += 0.002;
        }

        controls.update();
        renderer.render(scene, camera);
      };

      animate();
    };

    initScene();

    return () => {
      // Cleanup
      if (sceneRef.current.animationId) {
        cancelAnimationFrame(sceneRef.current.animationId);
      }
      
      if (sceneRef.current.renderer && mountRef.current) {
        mountRef.current.removeChild(sceneRef.current.renderer.domElement);
        sceneRef.current.renderer.dispose();
      }
      
      if (sceneRef.current.controls) {
        sceneRef.current.controls.dispose();
      }
    };
  }, [isClient]);

  if (!isClient) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 ${className}`}>
        <div className="text-center text-white">
          <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm opacity-70">Loading Earth Model...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mountRef} 
      className={`w-full h-full ${className}`}
      style={{ minHeight: '400px' }}
    />
  );
}