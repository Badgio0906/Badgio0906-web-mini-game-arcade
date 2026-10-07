import { kickPose } from './kickPose';
import { canvasSpinAngle } from './spinGuide';

type Pose = ReturnType<typeof kickPose>;
export const ANKLE_SPIN_LIMIT = .4; // Artwork only: 23 degrees each side of the neutral foot.
export function setupSwing(angle: number): number { return (angle - 5) / 80 * 1.65 - .28; }
export function attachedShoe(pose: Pose, spin: number) {
  const footAngle = pose.footAngle + canvasSpinAngle(Math.max(-1, Math.min(1, spin)) * ANKLE_SPIN_LIMIT);
  const at = (x: number) => ({ x: pose.ankle.x + Math.cos(footAngle) * x, y: pose.ankle.y + Math.sin(footAngle) * x });
  return { ankle: pose.ankle, footAngle, center: at(14), toe: at(46) };
}
/** The kick animation uses the launch angle, without changing the trajectory integrator. */
export function releasedShoe(pose: Pose, spin: number, angle: number) {
  // After release, subsequent knee motion must not drag the flying shoe's anchor.
  const attached = attachedShoe(kickPose(.63), spin), travel = pose.releaseProgress * 260, radians = angle * Math.PI / 180;
  return { x: attached.center.x + Math.cos(radians) * travel, y: attached.center.y - Math.sin(radians) * travel,
    rotation: attached.footAngle + canvasSpinAngle(spin * pose.releaseProgress * 7) };
}
