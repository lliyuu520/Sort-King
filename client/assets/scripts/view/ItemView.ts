import { Color, Node } from "cc";
import { itemDef } from "../game/catalog";
import { addMesh, boxMesh, capsuleMesh, cylinderMesh, hexColor, sphereMesh } from "./PrimitiveFactory";

/** 临时 Primitive 物品。切片 9 件按形状区分，其余走分类兜底。 */
export function makeItemToy(key: string, parent: Node): Node {
  const it = itemDef(key);
  const color = hexColor(it ? it.color : "#888888");
  const root = new Node("Toy_" + key);
  root.layer = parent.layer;
  parent.addChild(root);

  switch (key) {
    case "apple":
    case "basketball":
    case "badminton": {
      addMesh(root, "b", sphereMesh(0.36), color).setPosition(0, 0.36, 0);
      break;
    }
    case "watermelon": {
      addMesh(root, "b", sphereMesh(0.42), color).setPosition(0, 0.42, 0);
      break;
    }
    case "banana":
    case "football": {
      const body = addMesh(root, "b", capsuleMesh(0.16, 0.72), color);
      body.setPosition(0, 0.16, 0);
      body.setRotationFromEuler(0, 0, 90);
      break;
    }
    case "car": {
      addMesh(root, "b", boxMesh(0.72, 0.28, 0.4), color).setPosition(0, 0.2, 0);
      break;
    }
    case "bus": {
      addMesh(root, "b", boxMesh(0.92, 0.38, 0.44), color).setPosition(0, 0.26, 0);
      break;
    }
    case "bike": {
      const w1 = addMesh(root, "w1", cylinderMesh(0.16, 0.16, 0.06), hexColor("#333333"));
      w1.setPosition(-0.22, 0.16, 0);
      w1.setRotationFromEuler(90, 0, 0);
      const w2 = addMesh(root, "w2", cylinderMesh(0.16, 0.16, 0.06), hexColor("#333333"));
      w2.setPosition(0.22, 0.16, 0);
      w2.setRotationFromEuler(90, 0, 0);
      addMesh(root, "f", boxMesh(0.42, 0.08, 0.08), color).setPosition(0, 0.28, 0);
      break;
    }
    default: {
      const cat = it ? it.category : "toy";
      if (cat === "drink") {
        addMesh(root, "b", cylinderMesh(0.22, 0.24, 0.7), color).setPosition(0, 0.35, 0);
        addMesh(root, "c", cylinderMesh(0.16, 0.16, 0.1), hexColor("#ECF0F1")).setPosition(0, 0.74, 0);
      } else if (cat === "fruit" || cat === "veg") {
        addMesh(root, "b", sphereMesh(0.38), color).setPosition(0, 0.38, 0);
      } else if (cat === "snack") {
        addMesh(root, "b", boxMesh(0.7, 0.22, 0.5), color).setPosition(0, 0.16, 0);
      } else {
        addMesh(root, "b", boxMesh(0.55, 0.55, 0.55), color).setPosition(0, 0.28, 0);
      }
    }
  }

  addMesh(root, "shadow", cylinderMesh(0.32, 0.32, 0.02), new Color(0, 0, 0, 50), true).setPosition(0, 0.02, 0);
  return root;
}
