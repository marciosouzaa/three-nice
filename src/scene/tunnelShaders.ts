import { tunnelFunctions } from './tunnelPath'

export const ringVertex = /* glsl */ `
  ${tunnelFunctions}
  varying float vEdge;
  varying float vFade;
  varying vec3 vColor;
  void main() {
    float depth = mod(position.z - uTravel, 160.0) + 1.0;
    float angle = position.x + sin(depth * 0.035 + uTravel * 0.01) * 0.03;
    float radius = 4.8 + position.y * 0.075;
    vec3 p = tunnelPoint(angle, depth, radius);
    vColor = lightColor(angle, depth);
    vEdge = position.y;
    vFade = depthFade(depth);
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  }
`
export const ringFragment = /* glsl */ `
  uniform float uSpeed;
  varying float vEdge;
  varying float vFade;
  varying vec3 vColor;
  void main() {
    float glow = exp(-vEdge * vEdge * 4.0);
    float core = pow(max(1.0 - abs(vEdge), 0.0), 5.0);
    gl_FragColor = vec4(vColor + core * 0.35, (glow * 0.48 + core * 0.35) * vFade * (0.65 + uSpeed * 0.35));
    #include <colorspace_fragment>
  }
`
export const strandVertex = /* glsl */ `
  ${tunnelFunctions}
  varying float vEdge;
  varying float vFade;
  varying vec3 vColor;
  void main() {
    float depth = position.z;
    float angle = position.x + depth * 0.013 + uTravel * 0.004 + position.y * 0.005;
    vec3 p = tunnelPoint(angle, depth, 4.88);
    vColor = lightColor(angle, depth);
    vEdge = position.y;
    vFade = depthFade(depth) * (0.28 + pow(sin(depth * 0.06 - uTravel * 0.04) * 0.5 + 0.5, 3.0) * 0.4);
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  }
`
export const sparkVertex = /* glsl */ `
  ${tunnelFunctions}
  attribute float aSeed;
  varying vec3 vColor;
  varying float vFade;
  void main() {
    float depth = mod(position.z - uTravel * (0.85 + aSeed * 0.3), 160.0) + 1.0;
    float angle = position.x + uTravel * 0.003;
    vec3 p = tunnelPoint(angle, depth, position.y);
    vec4 viewPosition = viewMatrix * vec4(p, 1.0);
    vColor = lightColor(angle, depth);
    vFade = depthFade(depth) * (0.45 + aSeed * 0.5);
    gl_PointSize = clamp((1.0 + aSeed * 1.5) * uDpr * 85.0 / max(-viewPosition.z, 1.0), 1.0, 10.0 * uDpr);
    gl_Position = projectionMatrix * viewPosition;
  }
`
export const sparkFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vFade;
  void main() {
    float radius = length(gl_PointCoord - 0.5) * 2.0;
    if (radius > 1.0) discard;
    float glow = exp(-radius * radius * 5.0);
    gl_FragColor = vec4(vColor + vec3(0.2), glow * vFade);
    #include <colorspace_fragment>
  }
`
export const streakVertex = /* glsl */ `
  ${tunnelFunctions}
  attribute float aEnd;
  attribute float aSeed;
  varying float vEdge;
  varying float vTail;
  varying float vFade;
  varying vec3 vColor;
  void main() {
    float headDepth = mod(position.z - uTravel * (1.0 + aSeed * 0.25), 160.0) + 1.0;
    float depth = headDepth + aEnd * (0.2 + uSpeed * uSpeed * (1.8 + aSeed * 3.0));
    float angle = position.x + uTravel * 0.003 + position.y * 0.003;
    vec3 p = tunnelPoint(angle, depth, 3.4 + aSeed * 1.2);
    vColor = lightColor(angle, depth);
    vEdge = position.y;
    vTail = aEnd;
    vFade = depthFade(headDepth);
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  }
`
export const streakFragment = /* glsl */ `
  uniform float uSpeed;
  varying float vEdge;
  varying float vTail;
  varying float vFade;
  varying vec3 vColor;
  void main() {
    float glow = exp(-vEdge * vEdge * 4.0);
    float alpha = glow * (1.0 - vTail * 0.85) * vFade * (0.2 + uSpeed * 0.75);
    gl_FragColor = vec4(vColor + vec3(0.25), alpha);
    #include <colorspace_fragment>
  }
`
export const glowVertex = /* glsl */ `
  ${tunnelFunctions}
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = tunnelCenter(155.0) + vec3(position.xy, 0.0);
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  }
`
export const glowFragment = /* glsl */ `
  uniform float uSpeed;
  varying vec2 vUv;
  void main() {
    float radius = length(vUv - 0.5) * 2.0;
    float glow = exp(-radius * radius * 7.0);
    vec3 color = mix(vec3(0.22, 0.19, 0.6), vec3(0.55, 0.18, 0.32), uSpeed);
    gl_FragColor = vec4(color, glow * 0.24);
    #include <colorspace_fragment>
  }
`
