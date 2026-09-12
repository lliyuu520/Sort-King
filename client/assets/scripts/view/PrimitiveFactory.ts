import { Color, Layers, Material, Mesh, MeshRenderer, Node, primitives, utils } from "cc";

const meshCache: Record<string, Mesh> = {};
const matCache: Record<string, Material> = {};

export function hexColor(hex: string): Color {
  const h = hex.replace("#", "");
  return new Color(parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 255);
}

export function colorMat(color: Color, unlit = false): Material {
  const key = `${unlit ? "u" : "s"}_${color.r}_${color.g}_${color.b}_${color.a}`;
  if (matCache[key]) return matCache[key];
  const mat = new Material();
  if (unlit) {
    mat.initialize({ effectName: "builtin-unlit", technique: 0 });
    mat.setProperty("mainColor", color);
  } else {
    mat.initialize({ effectName: "builtin-standard" });
    mat.setProperty("mainColor", color);
    try {
      mat.setProperty("roughness", 0.42);
      mat.setProperty("metallic", 0.08);
    } catch (_) {}
  }
  matCache[key] = mat;
  return mat;
}

function meshOf(key: string, geo: Parameters<typeof utils.MeshUtils.createMesh>[0]): Mesh {
  if (!meshCache[key]) meshCache[key] = utils.MeshUtils.createMesh(geo)!;
  return meshCache[key];
}

export function boxMesh(w: number, h: number, d: number): Mesh {
  return meshOf(`box_${w}_${h}_${d}`, primitives.box({ width: w, height: h, length: d }));
}

export function sphereMesh(r: number): Mesh {
  return meshOf(`sph_${r}`, primitives.sphere(r, { segments: 16 }));
}

export function cylinderMesh(rTop: number, rBot: number, h: number): Mesh {
  return meshOf(`cyl_${rTop}_${rBot}_${h}`, primitives.cylinder(rTop, rBot, h, { radialSegments: 16 }));
}

export function capsuleMesh(r: number, h: number): Mesh {
  try {
    const cap = (primitives as { capsule?: (a: number, b: number, c: number, d?: object) => unknown }).capsule;
    if (typeof cap === "function") {
      return meshOf(`cap_${r}_${h}`, cap(r, r, h, { sides: 12 }) as Parameters<typeof utils.MeshUtils.createMesh>[0]);
    }
  } catch (_) {}
  return cylinderMesh(r, r, h);
}

export function planeMesh(w: number, l: number): Mesh {
  return meshOf(`pl_${w}_${l}`, primitives.plane({ width: w, length: l, widthSegments: 1, lengthSegments: 1 }));
}

export function addMesh(parent: Node, name: string, mesh: Mesh, color: Color, unlit = false): Node {
  const n = new Node(name);
  n.layer = parent.layer || Layers.Enum.DEFAULT;
  parent.addChild(n);
  const mr = n.addComponent(MeshRenderer);
  mr.mesh = mesh;
  try {
    mr.material = colorMat(color, true);
  } catch (_) {
    try {
      mr.material = colorMat(color, unlit);
    } catch (__) {}
  }
  return n;
}

export function setMeshColor(node: Node, color: Color, unlit = false): void {
  const mr = node.getComponent(MeshRenderer);
  if (!mr) return;
  try {
    mr.material = colorMat(color, true);
  } catch (_) {
    try {
      mr.material = colorMat(color, unlit);
    } catch (__) {}
  }
}
