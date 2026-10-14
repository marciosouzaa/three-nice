export const particleVertex = /* glsl */ `
  attribute vec3 aGalaxy;
  attribute vec3 aWave;
  attribute float aSeed;
  attribute float aSize;
  uniform float uTime;
  uniform float uMorph;
  uniform float uDpr;
  uniform vec3 uPointer;
  uniform float uInteraction;
  varying vec3 vColor;
  varying float vAlpha;

  vec3 rotateY(vec3 p, float angle) {
    float c = cos(angle), s = sin(angle);
    return vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
  }
  void main() {
    vec3 sphere = rotateY(position, uTime * 0.065);
    sphere *= 1.0 + sin(uTime * 0.6 + aSeed * 6.28) * 0.025;
    vec3 galaxy = aGalaxy;
    float angle = uTime * 0.055;
    galaxy.xy = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * galaxy.xy;
    vec3 wave = aWave;
    wave.z = sin(wave.x * 1.4 + uTime * 0.7) * 0.38 + cos(wave.y * 2.1 + uTime * 0.5) * 0.3;
    wave.y += sin(wave.x * 1.2 + wave.y * 1.8 + uTime * 0.55) * 0.26;
    vec3 p = mix(sphere, galaxy, smoothstep(0.0, 1.0, uMorph));
    p = mix(p, wave, smoothstep(1.0, 2.0, uMorph));

    vec3 away = p - uPointer;
    float distanceToPointer = length(away.xy);
    float influence = exp(-distanceToPointer * distanceToPointer * 1.7) * uInteraction;
    p += normalize(vec3(away.xy, 0.15) + vec3(0.001)) * influence * 1.15;
    p += vec3(sin(aSeed * 31.0 + uTime * 0.4), cos(aSeed * 27.0 + uTime * 0.35), 0.0) * 0.015;

    vec3 cyan = vec3(0.15, 0.78, 0.85);
    vec3 violet = vec3(0.47, 0.16, 0.82);
    vec3 rose = vec3(0.95, 0.32, 0.57);
    float tint = smoothstep(-2.2, 2.2, p.y + sin(aSeed * 6.28) * 0.7);
    vColor = mix(cyan, violet, tint);
    vColor = mix(vColor, rose, smoothstep(0.0, 1.0, uMorph) * (1.0 - smoothstep(1.0, 2.0, uMorph)) * aSeed * 0.4);
    vColor += influence * vec3(0.2, 0.35, 0.25);
    vAlpha = 0.64 + sin(uTime * 0.65 + aSeed * 50.0) * 0.1;
    float waveEdge = (1.0 - smoothstep(2.6, 3.5, abs(aWave.x))) * (1.0 - smoothstep(1.1, 1.75, abs(aWave.y)));
    vAlpha *= mix(1.0, waveEdge, smoothstep(1.0, 2.0, uMorph));
    vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = clamp(aSize * uDpr * (30.0 / -viewPosition.z), 1.0, 12.0 * uDpr);
    gl_Position = projectionMatrix * viewPosition;
  }
`

export const particleFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float radius = length(gl_PointCoord - vec2(0.5)) * 2.0;
    if (radius > 1.0) discard;
    float glow = exp(-radius * radius * 5.0);
    float core = pow(max(1.0 - radius, 0.0), 9.0);
    gl_FragColor = vec4(vColor + core * 0.5, (glow * 0.6 + core * 0.4) * vAlpha);
    #include <colorspace_fragment>
  }
`
