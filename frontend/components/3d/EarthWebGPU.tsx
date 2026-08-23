'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

interface EarthWebGPUProps {
  className?: string;
}

export function EarthWebGPU({ className = '' }: EarthWebGPUProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sceneRef = useRef<{
    renderer?: any;
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

        // Check WebGPU support
        if (!('gpu' in navigator)) {
          console.log('WebGPU not supported, using WebGL fallback');
          initFallbackEarth();
          return;
        }

        // Dynamically import WebGPU modules
        const THREE_WEBGPU = await import('three/webgpu');
        const WebGPURenderer = (THREE_WEBGPU as any).default || (THREE_WEBGPU as any).WebGPURenderer;

        // Initialize WebGPU Renderer (required for TSL)
        const renderer = new WebGPURenderer({ 
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        });
        
        await renderer.init();

        const width = mount.clientWidth;
        const height = mount.clientHeight;
        
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mount.appendChild(renderer.domElement);

        // Setup Scene & Camera
        const scene = new THREE.Scene();
        scene.background = null; // Transparent background
        
        const camera = new THREE.PerspectiveCamera(25, width / height, 0.1, 100);
        camera.position.set(4.5, 2, 3);
        camera.lookAt(0, 0, 0);

        // OrbitControls for interaction
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = true;
        controls.enablePan = false;
        controls.minDistance = 2.5;
        controls.maxDistance = 10;
        controls.autoRotate = false;

        // Load Textures
        const textureLoader = new THREE.TextureLoader();
        
        // Create procedural textures as placeholders
        // In production, load actual Earth textures: earth_day_4k.jpg, earth_night_4k.jpg, earth_specular_clouds_4k.jpg
        const createEarthDayTexture = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 1024;
          canvas.height = 512;
          const ctx = canvas.getContext('2d')!;
          
          // Ocean blue base
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
          gradient.addColorStop(0, '#1a4d6d');
          gradient.addColorStop(0.3, '#2a5f7d');
          gradient.addColorStop(0.5, '#3a8a5a');
          gradient.addColorStop(0.7, '#2a5f7d');
          gradient.addColorStop(1, '#1a4d6d');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Add land masses (simplified)
          ctx.fillStyle = '#4a7c59';
          for (let i = 0; i < 100; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 50 + 20;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
          }
          
          const dayTexture = new THREE.CanvasTexture(canvas);
          dayTexture.colorSpace = THREE.SRGBColorSpace;
          dayTexture.wrapS = THREE.RepeatWrapping;
          dayTexture.wrapT = THREE.ClampToEdgeWrapping;
          return dayTexture;
        };

        const createEarthNightTexture = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 1024;
          canvas.height = 512;
          const ctx = canvas.getContext('2d')!;
          
          // Dark base
          ctx.fillStyle = '#0a0a1a';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Add city lights
          ctx.fillStyle = '#ffd700';
          for (let i = 0; i < 500; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 2;
            ctx.globalAlpha = Math.random() * 0.8 + 0.2;
            ctx.fillRect(x, y, size, size);
          }
          
          const nightTexture = new THREE.CanvasTexture(canvas);
          nightTexture.colorSpace = THREE.SRGBColorSpace;
          nightTexture.wrapS = THREE.RepeatWrapping;
          nightTexture.wrapT = THREE.ClampToEdgeWrapping;
          return nightTexture;
        };

        const createSpecularTexture = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 1024;
          canvas.height = 512;
          const ctx = canvas.getContext('2d')!;
          
          // Water (white for specular) and land (dark)
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Dark land areas
          ctx.fillStyle = '#222222';
          for (let i = 0; i < 100; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 50 + 20;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
          }
          
          const specularTexture = new THREE.CanvasTexture(canvas);
          specularTexture.wrapS = THREE.RepeatWrapping;
          specularTexture.wrapT = THREE.ClampToEdgeWrapping;
          return specularTexture;
        };

        const dayTexture = createEarthDayTexture();
        const nightTexture = createEarthNightTexture();
        const specularTexture = createSpecularTexture();

        // Create Earth Mesh with advanced material
        const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
        
        // Create a custom shader material that simulates day/night transition
        // This works similar to TSL but uses GLSL shaders directly
        const earthMaterial = new THREE.ShaderMaterial({
          uniforms: {
            dayTexture: { value: dayTexture },
            nightTexture: { value: nightTexture },
            sunDirection: { value: new THREE.Vector3(5, 3, 5).normalize() },
          },
          vertexShader: `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            void main() {
              vUv = uv;
              vNormal = normalize(normalMatrix * normal);
              vPosition = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform sampler2D dayTexture;
            uniform sampler2D nightTexture;
            uniform vec3 sunDirection;
            
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            void main() {
              // Calculate lighting based on sun direction (similar to TSL dot product)
              float lightingFactor = dot(vNormal, sunDirection);
              
              // Smooth transition between day and night (similar to TSL smoothstep)
              float mixFactor = smoothstep(-0.2, 0.2, lightingFactor);
              
              // Sample textures
              vec4 dayColor = texture2D(dayTexture, vUv);
              vec4 nightColor = texture2D(nightTexture, vUv);
              
              // Mix day and night based on lighting (similar to TSL mix)
              vec4 finalColor = mix(nightColor, dayColor, mixFactor);
              
              // Add some ambient lighting
              finalColor.rgb += vec3(0.1, 0.1, 0.15) * (1.0 - mixFactor);
              
              gl_FragColor = finalColor;
            }
          `,
        });

        const earth = new THREE.Mesh(earthGeometry, earthMaterial);
        scene.add(earth);

        // Sun Light (DirectionalLight at position 5, 3, 5)
        const sun = new THREE.DirectionalLight(0xffffff, 2);
        sun.position.set(5, 3, 5);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        scene.add(sun);

        // Ambient light for visibility on dark side
        const ambientLight = new THREE.AmbientLight(0x222244, 0.3);
        scene.add(ambientLight);

        // Store references
        sceneRef.current = {
          renderer,
          scene,
          camera,
          controls,
          earth,
        };

        // Animation Loop using setAnimationLoop (WebGPU preferred method)
        renderer.setAnimationLoop(() => {
          if (earth) {
            earth.rotation.y += 0.002; // Slow rotation
          }

          if (controls) {
            controls.update();
          }

          renderer.render(scene, camera);
        });

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
        // Fallback to WebGL Earth
        initFallbackEarth();
      }
    };

    const initFallbackEarth = () => {
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
      controls.minDistance = 2.5;
      controls.maxDistance = 10;

      // Simple textured Earth
      const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
      const earthMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a7c59,
        roughness: 0.8,
        metalness: 0.1,
        emissive: 0x112244,
        emissiveIntensity: 0.1,
      });

      const earth = new THREE.Mesh(earthGeometry, earthMaterial);
      scene.add(earth);

      const sun = new THREE.DirectionalLight(0xffffff, 2);
      sun.position.set(5, 3, 5);
      scene.add(sun);

      const ambientLight = new THREE.AmbientLight(0x222244, 0.3);
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
      
      if (sceneRef.current.renderer) {
        if (sceneRef.current.renderer.setAnimationLoop) {
          sceneRef.current.renderer.setAnimationLoop(null);
        }
        
        if (mountRef.current && sceneRef.current.renderer.domElement) {
          try {
            mountRef.current.removeChild(sceneRef.current.renderer.domElement);
          } catch (e) {
            // Element may already be removed
          }
        }
        
        if (sceneRef.current.renderer.dispose) {
          sceneRef.current.renderer.dispose();
        }
      }
      
      if (sceneRef.current.controls) {
        sceneRef.current.controls.dispose();
      }

      if (sceneRef.current.earth) {
        sceneRef.current.earth.geometry.dispose();
        if (sceneRef.current.earth.material) {
          (sceneRef.current.earth.material as THREE.Material).dispose();
        }
      }
    };
  }, [isClient]);

  if (!isClient) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 ${className}`}>
        <div className="text-center text-white">
          <div className="w-12 h-12 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm opacity-70">Loading WebGPU Earth Model...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 ${className}`}>
        <div className="text-center text-white max-w-md mx-auto p-8">
          <div className="text-yellow-400 mb-4">⚠️</div>
          <p className="text-sm text-slate-300 mb-4">{error}</p>
          <p className="text-xs text-slate-400">Fallback renderer will be used</p>
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