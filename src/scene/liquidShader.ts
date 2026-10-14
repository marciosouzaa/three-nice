// Deform the positions and their surface normals together. The PBR material
// keeps handling real lighting and reflections on the resulting fluid surface.
export const liquidVertexFunctions = /* glsl */ `
  uniform float uTime;
  uniform float uDeform;
  uniform vec3 uPointer;
  uniform float uInteraction;

  vec3 liquidPosition(vec3 p) {
    vec3 n = normalize(p);
    float time = uTime * 0.55;
    float flow = sin(n.x * 2.7 + time) * cos(n.y * 3.0 - time * 0.65);
    flow += sin(n.z * 3.1 + n.y * 1.5 + time * 0.8) * 0.58;
    flow += cos(n.x * 5.0 - n.z * 3.4 - time * 0.6) * 0.22;
    float radius = length(p) * (1.0 + flow * uDeform * 0.27);
    vec3 deformed = n * radius;
    deformed.y *= 1.07;
    deformed.x += sin(n.y * 2.3 + time) * uDeform * 0.19;
    vec2 distanceToPointer = p.xy - uPointer.xy;
    float influence = exp(-dot(distanceToPointer, distanceToPointer) * 1.3) * uInteraction;
    deformed += normalize(vec3(uPointer.xy, 0.6) + vec3(0.001)) * influence * 0.32;
    return deformed;
  }

  vec3 liquidNormal(vec3 p) {
    vec3 n = normalize(p);
    vec3 axis = abs(n.y) > 0.9 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
    vec3 tangent = normalize(cross(axis, n));
    vec3 bitangent = cross(n, tangent);
    float epsilon = 0.008;
    vec3 center = liquidPosition(p);
    vec3 alongTangent = liquidPosition(normalize(p + tangent * epsilon) * length(p)) - center;
    vec3 alongBitangent = liquidPosition(normalize(p + bitangent * epsilon) * length(p)) - center;
    return normalize(cross(alongTangent, alongBitangent));
  }
`
