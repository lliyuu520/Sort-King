import { Camera, EventTouch, Vec3, geometry } from "cc";

/**
 * 屏幕点 → 射线 → 桌面平面。不使用物理碰撞。
 */
export class DragController {
  private plane = new geometry.Plane(0, 1, 0, 0);
  private ray = new geometry.Ray();
  private hit = new Vec3();

  constructor(private deskY = 0) {
    this.plane = new geometry.Plane(0, 1, 0, -deskY);
  }

  screenToDesk(cam: Camera, ev: EventTouch): Vec3 | null {
    const loc = ev.getLocation();
    cam.screenPointToRay(loc.x, loc.y, this.ray);
    let d = geometry.intersect.rayPlane(this.ray, this.plane);
    if (!(d > 0) || d === Infinity) {
      const ui = ev.getUILocation();
      cam.screenPointToRay(ui.x, ui.y, this.ray);
      d = geometry.intersect.rayPlane(this.ray, this.plane);
    }
    if (!(d > 0) || d === Infinity) return null;
    Vec3.scaleAndAdd(this.hit, this.ray.o, this.ray.d, d);
    return this.hit;
  }

  nearest(x: number, z: number, xs: number[], z0: number, snap: number): number | null {
    let best: number | null = null;
    let bestD = Infinity;
    for (let i = 0; i < xs.length; i++) {
      const d = Math.hypot(x - xs[i], z - z0);
      if (d < snap && d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }
}
