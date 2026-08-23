import { EarthWebGPU } from '@/components/3d/EarthWebGPU';

export default function EarthDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="relative z-10 pt-20 pb-12 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            WebGPU Earth with TSL
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-8">
            Advanced Three.js visualization using WebGPU Shading Language
          </p>
          <div className="text-sm text-slate-400 space-y-2">
            <p>🌍 Real-time day/night texture blending with TSL nodes</p>
            <p>🎮 Interactive controls: drag to rotate, scroll to zoom</p>
            <p>⚡ WebGPU renderer with advanced material shading</p>
          </div>
        </div>
      </div>

      {/* Earth Model Container */}
      <div className="relative">
        <div className="max-w-6xl mx-auto px-4 pb-20">
          <div className="bg-black/20 backdrop-blur-sm rounded-3xl border border-emerald-500/20 p-8 shadow-2xl shadow-emerald-500/10">
            <div className="aspect-video w-full bg-slate-900/50 rounded-2xl overflow-hidden">
              <EarthWebGPU className="rounded-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Technical Info */}
      <div className="relative z-10 py-12 bg-black/30">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-6">Technical Implementation</h2>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-emerald-500/20">
              <h3 className="text-lg font-semibold text-emerald-400 mb-3">WebGPU & TSL Features</h3>
              <ul className="text-slate-300 space-y-2 text-sm">
                <li>✓ THREE.WebGPURenderer with GPU acceleration</li>
                <li>✓ MeshStandardNodeMaterial for TSL nodes</li>
                <li>✓ Dynamic day/night blending with mix() node</li>
                <li>✓ Normal-based lighting with dot() calculations</li>
                <li>✓ Smooth transitions using smoothstep() function</li>
                <li>✓ DirectionalLight at (5, 3, 5) simulating sun</li>
              </ul>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-500/20">
              <h3 className="text-lg font-semibold text-blue-400 mb-3">Rendering Details</h3>
              <ul className="text-slate-300 space-y-2 text-sm">
                <li>✓ SphereGeometry(1, 64, 64) high-poly mesh</li>
                <li>✓ PerspectiveCamera at (4.5, 2, 3) position</li>
                <li>✓ OrbitControls with smooth damping</li>
                <li>✓ Continuous rotation (0.002 rad/frame)</li>
                <li>✓ Procedural texture generation fallback</li>
                <li>✓ Automatic WebGL fallback support</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-slate-300 mb-3">TSL Node Graph</h3>
            <div className="text-left text-xs font-mono text-slate-400 space-y-1">
              <p>sunDirection = vec3(5, 3, 5).normalize()</p>
              <p>lightingFactor = dot(normalWorld, sunDirection)</p>
              <p>dayNightMix = smoothstep(-0.2, 0.2, lightingFactor)</p>
              <p>colorNode = mix(nightTexture, dayTexture, dayNightMix)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}