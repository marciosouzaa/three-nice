import * as THREE from 'three'

export const TUNNEL_LENGTH = 160

export function speedFromHeight(height: number) {
  return 1 - THREE.MathUtils.clamp((height - 0.16) / 0.72, 0, 1)
}

// The camera and vertex shaders follow the same continuous path. Geometry is
// recycled ahead of the camera, so the trip has no end and needs no CPU rebuild.
export function tunnelPath(distance: number, target: THREE.Vector3) {
  return target.set(
    Math.sin(distance * 0.024) * 7 + Math.sin(distance * 0.011 + 0.8) * 3,
    Math.cos(distance * 0.019 + 0.4) * 5 + Math.sin(distance * 0.008) * 2,
    -distance,
  )
}

export const tunnelFunctions = /* glsl */ `
  uniform float uTravel;
  uniform float uSpeed;
  uniform float uSteer;
  uniform float uDpr;
  vec3 curve(float distance) {
    return vec3(sin(distance * 0.024) * 7.0 + sin(distance * 0.011 + 0.8) * 3.0,
                cos(distance * 0.019 + 0.4) * 5.0 + sin(distance * 0.008) * 2.0,
                -distance);
  }
  vec3 tunnelCenter(float depth) {
    vec3 center = curve(uTravel + depth) - curve(uTravel);
    center.x += uSteer * depth * 0.12;
    return center;
  }
  vec3 tunnelPoint(float angle, float depth, float radius) {
    return tunnelCenter(depth) + vec3(cos(angle) * radius, sin(angle) * radius, 0.0);
  }
  vec3 lightColor(float angle, float depth) {
    float tint = sin(angle + depth * 0.014 + uTravel * 0.004) * 0.5 + 0.5;
    vec3 cool = vec3(0.035, 0.63, 0.92);
    vec3 warm = vec3(1.0, 0.31, 0.10);
    vec3 violet = vec3(0.48, 0.14, 0.88);
    return mix(mix(cool, warm, smoothstep(0.32, 0.92, tint)), violet, pow(1.0 - tint, 4.0) * 0.65);
  }
  float depthFade(float depth) {
    return smoothstep(2.0, 7.0, depth) * (1.0 - smoothstep(100.0, 160.0, depth));
  }
`
