# Game018 independent source observations — before visual review

Read-only review; no product files edited. Scope: current ShoeBoard anatomy, not an actual animation or human playtest verdict.

Baseline ShoeBoard SHA256: `6d0d854f7f0ad9ad353365730e6291a3c6f7ae111b30a0635420c086139e6521`.

## Direct observations

Ankle follows radius149 via sine/cosine; knee is a fractional affine point of ankle, rather than a child rotation of fixed-length thigh/shin. Hip is (15,−2), knee (.48fx−11,.46fy+9). Before release the swing has a sine subtraction. At kick>0.48 the swing immediately becomes1.58+progress*.22. Foot angle changes from −spin*.55 to −.75 at the same boundary. Supporting leg is fixed-point geometry.

Direct numerical reproduction at pose angles5/25/45/65/85: thigh length89.46/80.66/70.49/60.00/50.52; shin69.12/73.87/78.71/83.19/87.21. At45° kick progress0.48→0.480001, ankle moves from(−.58,149.00) to(148.99,−1.37), approximately212 pixels; thigh83.77→46.68. Signed thigh/shin cross remains negative throughout examined range: the source does not actually alternate an IK branch. Wrong-side sagittal flexion, nonconstant lengths and the discontinuity are separate concerns.

## Proposed correction and review protocol

Use fixed-length parent bones: hip→knee→ankle; right-facing sagittal knee remains anterior to heel. With angles measured from down, shin angle=thigh angle−nonnegative bend. Ease joint angles, never interpolate ankle and stretch bones. Keep support ankle grounded and choose one continuous support IK branch if hip moves. Ankle rotation remains anatomical; true spin is carried by shoe preview and signed arrow.

Eight authored poses: stand; backswing; swing-return; under-body; forward-extension; release; follow-through; recovery. Review contact sheet with labels plus at least16 intermediary samples. Capture actual drawing normal600ms and slow2.4s sequences. Check both extremes5/85°, midpoint45°, both spin signs, title and result. Verify same joint-length invariants and branch across every sampled frame. No score or visual PASS is assigned before viewing actual images/animation.

Acceptance: independent actual PC, portrait390, narrow320 and landscape844 snapshots; shoe-release silhouette separated; support planted; no clip; primary distance readable over sky/space/cut-ins; UFO duration exactly old+0.5s and unchanged physical result; native input, pause/hidden, mute/BEST reload, practice isolation. Technical/model/read-only fixtures and native play are recorded separately. Human enjoyment, actual device ergonomics/FPS and listening remain unassessed.
