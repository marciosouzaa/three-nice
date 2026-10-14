export const marsSkyVertex = /* glsl */ `
  varying vec3 vDirection;
  void main() {
    vDirection = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
export const marsSkyFragment = /* glsl */ `
  uniform vec3 uSun;
  varying vec3 vDirection;
  void main() {
    vec3 direction = normalize(vDirection);
    float height = max(direction.y, 0.0);
    vec3 horizon = vec3(0.66, 0.39, 0.26);
    vec3 zenith = vec3(0.22, 0.19, 0.22);
    vec3 color = mix(horizon, zenith, pow(height, 0.55));
    float sunDistance = length(direction - uSun);
    float halo = exp(-sunDistance * sunDistance * 18.0);
    color = mix(color, vec3(0.66, 0.66, 0.70), halo * 0.7);
    color += vec3(1.0, 0.83, 0.61) * exp(-sunDistance * sunDistance * 190.0) * .2;
    float disc = 1.0 - smoothstep(.007, .0095, sunDistance);
    color = mix(color, vec3(2.4, 2.3, 2.1), disc);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

// Layered mineral grain and wind ripples, shaded by the standard PBR lights.
export const marsSurfaceFunctions = /* glsl */ `
  varying vec3 vMarsPosition;
  float marsHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float marsNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(marsHash(i), marsHash(i + vec2(1., 0.)), f.x),
      mix(marsHash(i + vec2(0., 1.)), marsHash(i + vec2(1., 1.)), f.x), f.y);
  }
`
export const marsSurfaceColor = /* glsl */ `
  vec2 ground = vMarsPosition.xz;
  float grain = marsNoise(ground * 22.0);
  float patches = marsNoise(ground * .65);
  float ripple = sin(ground.x * 6.5 + marsNoise(ground * .1) * 12.0 + ground.y * .35);
  float rippleStrength = 1.0 - smoothstep(28.0, 85.0, length(ground));
  diffuseColor.rgb *= .78 + grain * .23 + patches * .17 + ripple * .045 * rippleStrength;
`

export const dustVertex = /* glsl */ `
  uniform float uTime;
  uniform float uDpr;
  varying float vFade;
  void main() {
    vec3 p = position;
    p.x = mod(p.x + uTime * .6 + 40.0, 80.0) - 40.0;
    p.y += sin(uTime * .25 + position.x) * .14;
    vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
    vFade = (1.0 - smoothstep(15.0, 65.0, length(p))) * .22;
    gl_PointSize = clamp(20.0 * uDpr / max(-viewPosition.z, 1.0), 1.0, 3.0 * uDpr);
    gl_Position = projectionMatrix * viewPosition;
  }
`
export const dustFragment = /* glsl */ `
  varying float vFade;
  void main() {
    float radius = length(gl_PointCoord - .5) * 2.0;
    gl_FragColor = vec4(0.95, 0.74, 0.53, exp(-radius * radius * 5.0) * vFade);
    #include <colorspace_fragment>
  }
`
