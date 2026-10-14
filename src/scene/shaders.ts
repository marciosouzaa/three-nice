// All light, clouds and waves are procedural: the scene needs no external textures.
export const skyFunctions = /* glsl */ `
  uniform float uTime;
  uniform float uLight;
  uniform float uWind;
  uniform vec3 uSun;
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 s = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), s.x),
               mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), s.x), s.y);
  }
  float fbm(vec2 p) {
    float n = noise(p) * 0.5;
    n += noise(p * 2.02 + 13.0) * 0.25;
    n += noise(p * 4.03 + 27.0) * 0.125;
    n += noise(p * 8.01 + 41.0) * 0.0625;
    return n;
  }
  vec3 skyColor(vec3 direction, bool showSun) {
    vec3 d = normalize(direction);
    float height = max(d.y, 0.0);
    float dusk = smoothstep(0.35, 1.0, uLight);
    vec3 horizon = mix(vec3(1.0, 0.34, 0.14), vec3(0.62, 0.19, 0.29), dusk);
    vec3 middle = mix(vec3(0.46, 0.29, 0.43), vec3(0.24, 0.13, 0.36), dusk);
    vec3 top = mix(vec3(0.10, 0.20, 0.38), vec3(0.055, 0.075, 0.19), dusk);
    vec3 color = mix(horizon, middle, smoothstep(0.0, 0.29, height));
    color = mix(color, top, smoothstep(0.13, 0.85, height));
    float sunDot = max(dot(d, uSun), 0.0);
    vec3 glow = mix(vec3(1.0, 0.54, 0.18), vec3(0.85, 0.28, 0.30), dusk);
    color += glow * pow(sunDot, 14.0) * 0.28;
    color += vec3(1.0, 0.71, 0.42) * pow(sunDot, 130.0) * 0.25 * (1.0 - dusk * 0.5);
    vec2 cloudUV = d.xz / max(d.y + 0.16, 0.08);
    cloudUV = cloudUV * vec2(0.8, 3.1) + vec2(uTime * 0.004, 0.0);
    float clouds = fbm(cloudUV);
    float cloudMask = smoothstep(0.49, 0.72, clouds) * smoothstep(0.015, 0.12, height);
    color = mix(color, mix(vec3(0.86, 0.68, 0.69), vec3(0.38, 0.32, 0.47), dusk), cloudMask * 0.43);
    if (showSun) {
      float disc = smoothstep(0.99970, 0.99977, sunDot);
      vec3 sunColor = mix(vec3(1.0, 0.73, 0.37), vec3(1.0, 0.43, 0.24), dusk);
      color = mix(color, sunColor * 1.65, disc * smoothstep(-0.022, 0.012, d.y));
    }
    return color;
  }
`

export const skyVertex = /* glsl */ `
  varying vec3 vDirection;
  void main() {
    vDirection = position;
    vec4 clip = projectionMatrix * mat4(mat3(viewMatrix)) * vec4(position, 1.0);
    gl_Position = clip.xyww;
  }
`
export const skyFragment = /* glsl */ `
  varying vec3 vDirection;
  ${skyFunctions}
  void main() {
    gl_FragColor = vec4(skyColor(vDirection, true), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export const oceanVertex = /* glsl */ `
  uniform float uTime;
  uniform float uWind;
  varying vec3 vWorld;
  varying vec3 vNormal;
  void swell(vec2 p, vec2 direction, float frequency, float amplitude, float speed, inout float h, inout vec2 gradient) {
    float phase = dot(p, direction) * frequency + uTime * speed;
    h += sin(phase) * amplitude;
    gradient += cos(phase) * amplitude * frequency * direction;
  }
  void main() {
    vec3 p = position;
    float height = 0.0;
    vec2 gradient = vec2(0.0);
    float strength = uWind * 1.77;
    swell(p.xz, normalize(vec2(1.0, 0.35)), 0.52, 0.24 * strength, 0.72, height, gradient);
    swell(p.xz, normalize(vec2(-0.6, 1.0)), 0.83, 0.14 * strength, 0.92, height, gradient);
    swell(p.xz, normalize(vec2(0.2, 1.0)), 1.47, 0.075 * strength, 1.2, height, gradient);
    swell(p.xz, normalize(vec2(1.0, -0.5)), 2.3, 0.035 * strength, 1.53, height, gradient);
    p.y += height;
    vWorld = p;
    vNormal = normalize(vec3(-gradient.x, 1.0, -gradient.y));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`
export const oceanFragment = /* glsl */ `
  varying vec3 vWorld;
  varying vec3 vNormal;
  ${skyFunctions}
  vec2 ripples(vec2 p, float distanceToEye) {
    vec2 gradient = vec2(0.0);
    float frequency = 2.8;
    float amplitude = 0.04;
    float angle = 0.0;
    for (int i = 0; i < 7; i++) {
      vec2 direction = vec2(cos(angle), sin(angle));
      float phase = dot(p, direction) * frequency + uTime * (1.3 + float(i) * 0.19);
      float footprint = max(fwidth(phase), 0.001);
      float rippleFilter = 1.0 - smoothstep(0.5, 2.8, footprint);
      gradient += direction * cos(phase + sin(phase * 0.56) * 0.75) * amplitude * frequency * rippleFilter;
      frequency *= 1.52;
      amplitude *= 0.57;
      angle += 2.39996;
    }
    return gradient * (uWind * 1.3) * (1.0 - smoothstep(90.0, 1200.0, distanceToEye) * 0.75);
  }
  void main() {
    vec3 toEye = cameraPosition - vWorld;
    float distanceToEye = length(toEye);
    vec3 view = normalize(toEye);
    vec2 ripple = ripples(vWorld.xz, distanceToEye);
    vec3 normal = normalize(vNormal + vec3(-ripple.x, 0.0, -ripple.y));
    vec3 reflection = reflect(-view, normal);
    reflection.y = max(reflection.y, 0.002);
    float fresnel = 0.04 + 0.96 * pow(1.0 - max(dot(normal, view), 0.0), 4.0);
    float dusk = smoothstep(0.35, 1.0, uLight);
    vec3 deep = mix(vec3(0.035, 0.13, 0.17), vec3(0.025, 0.065, 0.12), dusk);
    vec3 reflectedSky = skyColor(reflection, false);
    vec3 color = mix(deep, reflectedSky * 0.77, fresnel);
    vec3 halfway = normalize(view + uSun);
    float specularAngle = max(dot(normal, halfway), 0.0);
    float broad = pow(specularAngle, 95.0) * 0.36;
    float sharp = pow(specularAngle, 850.0) * 2.9;
    vec3 sunlight = mix(vec3(1.0, 0.42, 0.14), vec3(1.0, 0.22, 0.16), dusk);
    float sunVisibility = smoothstep(-0.015, 0.035, uSun.y);
    color += sunlight * (broad + sharp) * sunVisibility;
    float crest = smoothstep(0.15, 0.58, vWorld.y) * max(dot(normal, uSun), 0.0);
    color += vec3(0.10, 0.19, 0.19) * crest * (1.0 - fresnel);
    float haze = 1.0 - exp(-distanceToEye * 0.00085);
    vec3 horizon = skyColor(normalize(vec3(-view.x, 0.003, -view.z)), false);
    color = mix(color, horizon, haze);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`
