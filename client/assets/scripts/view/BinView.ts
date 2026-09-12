import { Node } from "cc";
import { addMesh, boxMesh, hexColor } from "./PrimitiveFactory";

export function makeBin(parent: Node, name: string, x: number, z: number, bodyHex: string): { root: Node; body: Node; lid: Node } {
  const root = new Node(name);
  root.layer = parent.layer;
  parent.addChild(root);
  root.setPosition(x, 0, z);
  const body = addMesh(root, "Body", boxMesh(1.7, 0.85, 1.7), hexColor(bodyHex));
  body.setPosition(0, 0.42, 0);
  const lid = addMesh(root, "Lid", boxMesh(1.78, 0.12, 1.78), hexColor("#C9C0B2"));
  lid.setPosition(0, 0.92, 0);
  return { root, body, lid };
}

export function binXs(count: number): number[] {
  if (count <= 3) return [-2.4, 0, 2.4].slice(0, count);
  return [-2.7, -0.9, 0.9, 2.7].slice(0, count);
}

export const SLOT_XS = [-2.7, -0.9, 0.9, 2.7];
