export const solarVertex = /* glsl */ `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vPosition = position;
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = -viewPosition.xyz;
    gl_Position = projectionMatrix * viewPosition;
  }
`
export const sunFragment = /* glsl */ `
  uniform float uTime;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec3 p = normalize(vPosition);
    float flow = sin(p.x * 17.0 + sin(p.y * 14.0 + uTime * .25) * 2.0)
      * cos(p.z * 19.0 - p.y * 8.0 + uTime * .2);
    float grain = sin(p.x * 73.0 + p.z * 38.0) * cos(p.y * 87.0 - p.z * 42.0);
    float texture = .55 + flow * .24 + grain * .08;
    float facing = max(dot(normalize(vNormal), normalize(vView)), 0.0);
    vec3 color = mix(vec3(1.2, .26, .025), vec3(2.1, 1.2, .38), texture);
    color *= .72 + pow(facing, .35) * .28;
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`
export const atmosphereFragment = /* glsl */ `
  uniform vec3 uColor;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 3.0);
    gl_FragColor = vec4(uColor, rim * .5);
    #include <colorspace_fragment>
  }
`
export const ringVertex = /* glsl */ `
  varying vec3 vPosition;
  void main() {
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
export const ringFragment = /* glsl */ `
  varying vec3 vPosition;
  void main() {
    float radius = length(vPosition.xy);
    float bands = .45 + sin(radius * 91.0) * .2 + sin(radius * 173.0) * .12;
    float gap = smoothstep(.028, .06, abs(radius - 2.02));
    vec3 color = mix(vec3(.34, .28, .2), vec3(.8, .72, .52), bands);
    gl_FragColor = vec4(color, (.48 + bands * .35) * gap);
    #include <colorspace_fragment>
  }
`
