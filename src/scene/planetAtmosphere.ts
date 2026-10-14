export const atmosphereVertex = /* glsl */ `
  varying vec3 vWorld;
  varying vec3 vNormal;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`
export const atmosphereFragment = /* glsl */ `
  uniform float uNight;
  varying vec3 vWorld;
  varying vec3 vNormal;
  void main() {
    vec3 view = normalize(cameraPosition - vWorld);
    float rim = pow(1.0 - abs(dot(view, normalize(vNormal))), 3.5);
    vec3 color = mix(vec3(0.26, 0.7, 0.6), vec3(0.25, 0.35, 0.8), uNight);
    gl_FragColor = vec4(color, rim * 0.25);
    #include <colorspace_fragment>
  }
`
