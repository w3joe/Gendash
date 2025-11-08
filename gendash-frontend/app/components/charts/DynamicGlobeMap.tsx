"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import * as d3 from "d3";

interface GlobeDataPoint {
  lat: number;  // Latitude
  lon: number;  // Longitude
  value: number;  // Value for the point
  label?: string;  // Optional label
}

interface DynamicGlobeMapProps {
  data: GlobeDataPoint[];
  title?: string;
  width?: number;
  height?: number;
  autoRotate?: boolean;
  rotationSpeed?: number;
  worldMapTexture?: string; // URL or path to world map texture (equirectangular projection)
  isDarkMode?: boolean;
  maxPoints?: number;  // Maximum data points to display (default: 500 for performance)
}

export default function DynamicGlobeMap({
  data,
  title,
  width,
  height = 500,
  autoRotate = true,
  rotationSpeed = 0.5,
  worldMapTexture,
  isDarkMode = true,
  maxPoints = 500
}: DynamicGlobeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const chartWidth = width || container.clientWidth;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      chartWidth / height,
      0.1,
      1000
    );
    camera.position.z = 300;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(chartWidth, height);
    // Set background color based on dark mode
    const backgroundColor = isDarkMode ? 0x000000 : 0xffffff;
    renderer.setClearColor(backgroundColor, isDarkMode ? 0 : 0.05);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Globe group
    const globeGroup = new THREE.Group();
    globeRef.current = globeGroup;
    scene.add(globeGroup);

    // Create sphere geometry for globe
    const radius = 100;
    const segments = 64;
    const geometry = new THREE.SphereGeometry(radius, segments, segments);

    // Fallback function to create a simple texture if image fails
    const createFallbackTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;

      // Draw ocean gradient - lighter in light mode
      const gradient = ctx.createLinearGradient(0, 0, 0, 512);
      if (isDarkMode) {
        gradient.addColorStop(0, '#1e3a8a');
        gradient.addColorStop(0.5, '#3b82f6');
        gradient.addColorStop(1, '#1e3a8a');
      } else {
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(0.5, '#60a5fa');
        gradient.addColorStop(1, '#3b82f6');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1024, 512);

      // Add grid lines - lighter color in light mode
      ctx.strokeStyle = isDarkMode ? '#60a5fa' : '#93c5fd';
      ctx.lineWidth = 1;
      ctx.globalAlpha = isDarkMode ? 0.3 : 0.4;

      // Latitude lines
      for (let i = 0; i <= 12; i++) {
        const y = (i / 12) * 512;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1024, y);
        ctx.stroke();
      }

      // Longitude lines
      for (let i = 0; i <= 24; i++) {
        const x = (i / 24) * 1024;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 512);
        ctx.stroke();
      }

      return new THREE.CanvasTexture(canvas);
    };

    // Load world map texture
    const textureLoader = new THREE.TextureLoader();
    
    // Default world map texture URL (equirectangular projection)
    // You can replace this with your own texture or use a local file
    const defaultTextureUrl = worldMapTexture || 
      'https://raw.githubusercontent.com/turban/webgl-earth/master/images/2_no_clouds_4k.jpg';
    
    // Alternative free textures you can use:
    // - 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg'
    // - Or place a local file in /public/earth-texture.jpg and use '/earth-texture.jpg'
    
    // Start with fallback texture, then try to load world map
    let texture = createFallbackTexture();

    // Adjust material properties based on dark mode
    const material = new THREE.MeshPhongMaterial({
      map: texture,
      transparent: false,
      shininess: isDarkMode ? 30 : 50,
      specular: isDarkMode ? 0x111111 : 0x222222,
    });
    
    // Try to load world map texture
    textureLoader.load(
      defaultTextureUrl,
      // onLoad callback
      (loadedTexture) => {
        loadedTexture.wrapS = THREE.RepeatWrapping;
        loadedTexture.wrapT = THREE.RepeatWrapping;
        // Update material with loaded texture
        material.map = loadedTexture;
        material.needsUpdate = true;
      },
      // onProgress callback (optional)
      undefined,
      // onError callback
      (error) => {
        console.warn('Failed to load world map texture, using fallback:', error);
        // Fallback texture is already set
      }
    );

    const globe = new THREE.Mesh(geometry, material);
    globeGroup.add(globe);

    // Add atmosphere glow - adjust color and opacity based on dark mode
    const glowGeometry = new THREE.SphereGeometry(radius + 2, segments, segments);
    const glowColor = isDarkMode ? 0x60a5fa : 0x93c5fd; // Lighter blue in light mode
    const glowOpacity = isDarkMode ? 0.2 : 0.15; // Slightly less visible in light mode
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: glowColor,
      transparent: true,
      opacity: glowOpacity,
      side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    globeGroup.add(glow);

    // Lighting - adjust intensity based on dark mode
    const ambientIntensity = isDarkMode ? 0.6 : 3.0; // Brighter ambient in light mode
    const pointIntensity = isDarkMode ? 0.8 : 3.0; // Brighter point light in light mode
    
    const ambientLight = new THREE.AmbientLight(0xffffff, ambientIntensity);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, pointIntensity);
    pointLight.position.set(200, 200, 200);
    scene.add(pointLight);
    
    // Add additional light in light mode for better visibility
    if (!isDarkMode) {
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
      fillLight.position.set(-200, 100, -200);
      scene.add(fillLight);
    }

    // Add data points
    if (data && data.length > 0) {
      // Limit and sort data by value to show most important points
      const processedData = data.length > maxPoints
        ? [...data]
            .sort((a, b) => b.value - a.value)
            .slice(0, maxPoints)
        : data;

      const maxValue = d3.max(processedData, d => d.value) || 1;

      processedData.forEach(point => {
        // Convert lat/lon to 3D coordinates
        const phi = (90 - point.lat) * (Math.PI / 180);
        const theta = (point.lon + 180) * (Math.PI / 180);

        const x = -(radius + 1) * Math.sin(phi) * Math.cos(theta);
        const y = (radius + 1) * Math.cos(phi);
        const z = (radius + 1) * Math.sin(phi) * Math.sin(theta);

        // Create marker
        const markerSize = 2 + (point.value / maxValue) * 3;
        const markerGeometry = new THREE.SphereGeometry(markerSize, 16, 16);
        const markerMaterial = new THREE.MeshBasicMaterial({
          color: point.value > maxValue / 2 ? 0xec4899 : 0xfbbf24,
          transparent: true,
          opacity: 0.8,
        });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.set(x, y, z);
        globeGroup.add(marker);

        // Add pulsing animation
        const scale = 1;
        marker.userData.animate = () => {
          const time = Date.now() * 0.001;
          marker.scale.set(
            scale + Math.sin(time * 2) * 0.2,
            scale + Math.sin(time * 2) * 0.2,
            scale + Math.sin(time * 2) * 0.2
          );
        };

        // Add glow effect
        const glowGeo = new THREE.SphereGeometry(markerSize * 1.5, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({
          color: point.value > maxValue / 2 ? 0xec4899 : 0xfbbf24,
          transparent: true,
          opacity: 0.3,
        });
        const markerGlow = new THREE.Mesh(glowGeo, glowMat);
        markerGlow.position.set(x, y, z);
        globeGroup.add(markerGlow);
      });
    }

    // Mouse interaction
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let isZoomed = false;
    const defaultCameraZ = 300;
    const zoomedCameraZ = 150;
    let targetCameraZ = defaultCameraZ;
    let currentCameraZ = defaultCameraZ;
    let isAnimating = false;

    // Smooth camera animation
    const animateCamera = () => {
      if (Math.abs(currentCameraZ - targetCameraZ) > 0.1) {
        currentCameraZ += (targetCameraZ - currentCameraZ) * 0.1;
        camera.position.z = currentCameraZ;
        isAnimating = true;
      } else {
        camera.position.z = targetCameraZ;
        currentCameraZ = targetCameraZ;
        isAnimating = false;
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = {
        x: e.clientX,
        y: e.clientY
      };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !globeGroup) return;

      const deltaMove = {
        x: e.clientX - previousMousePosition.x,
        y: e.clientY - previousMousePosition.y
      };

      globeGroup.rotation.y += deltaMove.x * 0.01;
      globeGroup.rotation.x += deltaMove.y * 0.01;

      previousMousePosition = {
        x: e.clientX,
        y: e.clientY
      };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    // Double-click to zoom
    let clickTimeout: NodeJS.Timeout | null = null;
    const onDoubleClick = (e: MouseEvent) => {
      e.preventDefault();
      
      if (isZoomed) {
        // Zoom out
        targetCameraZ = defaultCameraZ;
        isZoomed = false;
      } else {
        // Zoom in towards the clicked point
        const rect = container.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        // Use raycaster to find the point on the globe
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
        
        // Check intersection with the globe (accounting for group rotation)
        const intersects = raycaster.intersectObjects(globeGroup.children, true);
        if (intersects.length > 0) {
          // Find the globe mesh (not markers or glow)
          const globeIntersect = intersects.find(intersect => intersect.object === globe);
          if (globeIntersect) {
            const point = globeIntersect.point;
            // Transform point to local space of globeGroup
            const localPoint = new THREE.Vector3();
            localPoint.copy(point);
            globeGroup.worldToLocal(localPoint);
            
            // Calculate rotation to face the clicked point
            // Convert 3D point to spherical coordinates
            const angleY = Math.atan2(localPoint.x, localPoint.z);
            const angleX = -Math.asin(Math.max(-1, Math.min(1, localPoint.y / radius)));
            
            // Smoothly rotate globe to face clicked point
            const targetRotationY = angleY;
            const targetRotationX = angleX;
            
            // Animate rotation
            const rotateToPoint = () => {
              const currentY = globeGroup.rotation.y;
              const currentX = globeGroup.rotation.x;
              let diffY = targetRotationY - currentY;
              let diffX = targetRotationX - currentX;
              
              // Normalize angle difference for Y rotation
              while (diffY > Math.PI) diffY -= Math.PI * 2;
              while (diffY < -Math.PI) diffY += Math.PI * 2;
              
              // Clamp X rotation
              const newX = currentX + diffX * 0.1;
              const clampedX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, newX));
              
              if (Math.abs(diffY) > 0.01 || Math.abs(diffX) > 0.01) {
                globeGroup.rotation.y += diffY * 0.1;
                globeGroup.rotation.x = clampedX;
                requestAnimationFrame(rotateToPoint);
              }
            };
            rotateToPoint();
          }
        }
        
        targetCameraZ = zoomedCameraZ;
        isZoomed = true;
      }
    };

    // Handle single vs double click
    const onClick = (e: MouseEvent) => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
        clickTimeout = null;
        onDoubleClick(e);
      } else {
        clickTimeout = setTimeout(() => {
          clickTimeout = null;
        }, 300);
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mouseleave', onMouseUp);
    container.addEventListener('click', onClick);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Animate camera zoom
      if (isAnimating || Math.abs(currentCameraZ - targetCameraZ) > 0.1) {
        animateCamera();
      }

      if (autoRotate && !isDragging && globeGroup && !isZoomed) {
        globeGroup.rotation.y += rotationSpeed * 0.001;
      }

      // Animate markers
      globeGroup?.children.forEach(child => {
        if (child.userData.animate) {
          child.userData.animate();
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mouseleave', onMouseUp);
      container.removeEventListener('click', onClick);
      if (clickTimeout) clearTimeout(clickTimeout);

      // Dispose of textures
      if (texture) texture.dispose();
      if (material.map) material.map.dispose();
      
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [data, width, height, autoRotate, rotationSpeed, worldMapTexture, isDarkMode]);

  return (
    <div className="w-full">
      {title && <h3 className={`text-base sm:text-lg font-semibold mb-4 ${isDarkMode ? 'text-zinc-100' : 'text-gray-900'}`}>{title}</h3>}
      <div
        ref={containerRef}
        className="relative w-full flex items-center justify-center"
        style={{
          height: typeof window !== 'undefined' && window.innerWidth < 640
            ? Math.min(height, 300)
            : height
        }}
      />
      <div className={`mt-4 text-center text-xs sm:text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
        <span className="hidden sm:inline">Drag to rotate • Double-click to zoom • </span>
        <span>
          {data.length > maxPoints
            ? `Displaying top ${maxPoints} of ${data.length} data points`
            : `${data.length} data points`}
        </span>
      </div>
    </div>
  );
}
