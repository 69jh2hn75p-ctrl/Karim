"""
Episode 003 "Moon Signal" — Blender scene builder (Blender 4.0, Cycles, CPU).

Run:
  blender -b --factory-startup --python build_episode.py -- <out_dir> <timeline.json> <mode> <samples>
    mode: "test:0,130,210,300,400,460"  renders the listed frames as stills
          "full"                        renders frames 0..479 as PNG sequence

Everything is keyed from the shared timeline (projects/episode-003/timeline.json),
so the audio builder and this scene agree on every event frame.
"""
import bpy
import bmesh
import json
import math
import os
import random
import sys
import time
from mathutils import Matrix, Vector

T0 = time.time()


def stage(name):
    print(f"STAGE {name} {time.time() - T0:.1f}s", flush=True)

# --------------------------------------------------------------------------- args
ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT_DIR = ARGS[0]
TL_PATH = ARGS[1]
MODE = ARGS[2] if len(ARGS) > 2 else "test:0"
SAMPLES = int(ARGS[3]) if len(ARGS) > 3 else 24

TL = json.load(open(TL_PATH, encoding="utf-8"))
EV = TL["events"]
FPS = TL["fps"]
FRAMES = TL["frames"]
os.makedirs(OUT_DIR, exist_ok=True)
random.seed(3)

# --------------------------------------------------------------------------- scene reset / render setup
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = False  # this Blender build has no OpenImageDenoise; denoised afterwards
scene.cycles.adaptive_threshold = 0.04
scene.cycles.max_bounces = 8
scene.cycles.transmission_bounces = 12
scene.cycles.caustics_reflective = False
scene.cycles.caustics_refractive = False
scene.render.resolution_x = TL["width"]
scene.render.resolution_y = TL["height"]
scene.render.resolution_percentage = 100
scene.render.fps = FPS
scene.render.film_transparent = False
scene.frame_start = 0
scene.frame_end = FRAMES - 1
try:
    scene.view_settings.view_transform = "AgX"
except TypeError:
    scene.view_settings.view_transform = "Filmic"
scene.view_settings.look = "None"
scene.view_settings.exposure = 0.0

world = bpy.data.worlds.new("Space")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.006, 0.007, 0.014, 1.0)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0


# --------------------------------------------------------------------------- materials
def mat(name, color, rough=0.6, metal=0.0, emit=None, emit_strength=0.0, transmission=0.0, ior=1.45, sss=0.0, spec=0.5):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (color[0], color[1], color[2], 1.0)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    b.inputs["IOR"].default_value = ior
    b.inputs["Transmission Weight"].default_value = transmission
    b.inputs["Subsurface Weight"].default_value = sss
    b.inputs["Specular IOR Level"].default_value = spec
    if emit is not None:
        b.inputs["Emission Color"].default_value = (emit[0], emit[1], emit[2], 1.0)
        b.inputs["Emission Strength"].default_value = emit_strength
    return m


M = {
    "suit": mat("suit_white", (0.90, 0.92, 0.95), rough=0.45, spec=0.5),
    "orange": mat("suit_orange", (1.0, 0.42, 0.08), rough=0.4),
    "glove": mat("glove_orange", (1.0, 0.5, 0.12), rough=0.5),
    "visor": mat("visor_glass", (0.85, 0.95, 1.0), rough=0.03, transmission=0.92, ior=1.45, spec=0.8),
    "skin": mat("skin_warm", (0.92, 0.62, 0.46), rough=0.55, sss=0.25),
    "hair": mat("hair_brown", (0.16, 0.08, 0.04), rough=0.5),
    "eye": mat("eye_white", (0.95, 0.95, 0.97), rough=0.2),
    "pupil": mat("pupil", (0.03, 0.03, 0.05), rough=0.25),
    "backpack": mat("backpack_grey", (0.42, 0.44, 0.48), rough=0.6),
    "pip_body": mat("pip_body", (0.22, 0.72, 0.70), rough=0.28, metal=0.35),
    "pip_lens": mat("pip_lens", (0.1, 0.9, 1.0), rough=0.1, emit=(0.2, 0.9, 1.0), emit_strength=3.0),
    "pip_arm": mat("pip_arm", (0.80, 0.82, 0.85), rough=0.35, metal=0.5),
    "lander": mat("lander_metal", (0.78, 0.80, 0.84), rough=0.35, metal=0.6),
    "lander_dark": mat("lander_dark", (0.12, 0.13, 0.16), rough=0.5, metal=0.4),
    "moon": mat("moon_regolith", (0.36, 0.35, 0.34), rough=0.95),
    "rock": mat("rock", (0.22, 0.21, 0.20), rough=0.9),
    "crater": mat("crater", (0.03, 0.03, 0.035), rough=0.95),
    "crystal": mat("crystal", (0.35, 0.9, 1.0), rough=0.08, transmission=0.6, ior=1.5, emit=(0.3, 0.95, 1.0), emit_strength=0.0),
    "ring": mat("ring_glow", (0.4, 0.95, 1.0), rough=0.3, emit=(0.4, 0.95, 1.0), emit_strength=0.0),
    "node": mat("star_node", (0.9, 1.0, 1.0), rough=0.3, emit=(0.85, 1.0, 1.0), emit_strength=8.0),
    "edge": mat("star_edge", (0.4, 0.9, 1.0), rough=0.3, emit=(0.35, 0.85, 1.0), emit_strength=5.0),
    "earth": mat("earth", (0.10, 0.36, 0.85), rough=0.55, emit=(0.05, 0.14, 0.4), emit_strength=0.6),
    "stars": mat("stars", (1.0, 1.0, 1.0), rough=0.3, emit=(1.0, 1.0, 1.0), emit_strength=10.0),
    "text": mat("title_text", (1.0, 0.97, 0.9), rough=0.25, emit=(1.0, 0.95, 0.85), emit_strength=0.8),
    "door": mat("door_metal", (0.55, 0.58, 0.62), rough=0.4, metal=0.5),
}


# --------------------------------------------------------------------------- bmesh helpers
def bm_sphere(bm, center, r, scale=(1.0, 1.0, 1.0), u=28, v=18):
    m = Matrix.Translation(Vector(center)) @ Matrix.Diagonal((scale[0], scale[1], scale[2], 1.0))
    bmesh.ops.create_uvsphere(bm, u_segments=u, v_segments=v, radius=r, matrix=m, calc_uvs=False)


def bm_capsule(bm, p0, p1, r, seg=22):
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    length = d.length
    bm_sphere(bm, p0, r)
    bm_sphere(bm, p1, r)
    rot = Vector((0.0, 0.0, 1.0)).rotation_difference(d).to_matrix().to_4x4()
    m = Matrix.Translation((p0 + p1) / 2) @ rot
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=r, depth=length, matrix=m)


def bm_box(bm, center, size, rot=None):
    base = Matrix.Translation(Vector(center))
    if rot is not None:
        base = base @ rot.to_matrix().to_4x4()
    m = base @ Matrix.Diagonal((size[0], size[1], size[2], 1.0))
    bmesh.ops.create_cube(bm, size=1.0, matrix=m)


def make_obj(name, bm, material, collection=None):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    me.materials.append(material)
    ob = bpy.data.objects.new(name, me)
    scene.collection.objects.link(ob)
    return ob


def part(name, material, builder):
    bm = bmesh.new()
    builder(bm)
    return make_obj(name, bm, material)


def bind(ob, rig, bone):
    """Rigid skinning: every vertex follows one bone. Keeps each part's shape exactly."""
    vg = ob.vertex_groups.new(name=bone)
    vg.add(list(range(len(ob.data.vertices))), 1.0, "REPLACE")
    mod = ob.modifiers.new("Rig", "ARMATURE")
    mod.object = rig
    ob.parent = rig


# --------------------------------------------------------------------------- armature helper
def make_rig(name, bones):
    arm = bpy.data.armatures.new(name + "_arm")
    obj = bpy.data.objects.new(name, arm)
    scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    for bname, head, tail, parent in bones:
        eb = arm.edit_bones.new(bname)
        eb.head = Vector(head)
        eb.tail = Vector(tail)
        if parent:
            eb.parent = arm.edit_bones[parent]
    bpy.ops.object.mode_set(mode="OBJECT")
    return obj


def key_bone(rig, bone, f, rot=None, loc=None):
    pb = rig.pose.bones[bone]
    pb.rotation_mode = "XYZ"
    if rot is not None:
        pb.rotation_euler = rot
        pb.keyframe_insert("rotation_euler", frame=f)
    if loc is not None:
        pb.location = loc
        pb.keyframe_insert("location", frame=f)


def key_obj(ob, f, loc=None, rot=None, scale=None):
    if loc is not None:
        ob.location = loc
        ob.keyframe_insert("location", frame=f)
    if rot is not None:
        ob.rotation_euler = rot
        ob.keyframe_insert("rotation_euler", frame=f)
    if scale is not None:
        ob.scale = scale
        ob.keyframe_insert("scale", frame=f)


def key_hide(ob, f, hidden):
    ob.hide_render = hidden
    ob.hide_viewport = hidden
    ob.keyframe_insert("hide_render", frame=f)
    ob.keyframe_insert("hide_viewport", frame=f)


def key_mat_strength(material, f, strength):
    node = material.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"]
    node.default_value = strength
    node.keyframe_insert("default_value", frame=f)


def damped(f, t0, amp, period=9.0, freq=0.8):
    if f < t0:
        return 0.0
    dt = f - t0
    return amp * math.exp(-dt / period) * math.sin(dt * freq)


def ease(a, b, t):
    t = max(0.0, min(1.0, t))
    s = t * t * (3 - 2 * t)
    return a + (b - a) * s


stage("materials")
# =========================================================================== MIRA
# Mira faces +X. Feet at z=0. Rig object origin = her root; her walk moves the whole rig.
MIRA_BONES = [
    ("hips", (0, 0, 0.84), (0, 0, 0.98), None),
    ("spine", (0, 0, 0.98), (0, 0, 1.16), "hips"),
    ("neck", (0, 0, 1.16), (0, 0, 1.25), "spine"),
    ("head", (0, 0, 1.25), (0, 0, 1.50), "neck"),
    ("ponytail", (-0.12, 0, 1.42), (-0.36, 0, 1.22), "head"),
    ("upperarm.L", (0, -0.22, 1.10), (0, -0.22, 0.82), "spine"),
    ("forearm.L", (0, -0.22, 0.82), (0.03, -0.22, 0.56), "upperarm.L"),
    ("hand.L", (0.03, -0.22, 0.56), (0.05, -0.22, 0.46), "forearm.L"),
    ("upperarm.R", (0, 0.22, 1.10), (0, 0.22, 0.82), "spine"),
    ("forearm.R", (0, 0.22, 0.82), (0.03, 0.22, 0.56), "upperarm.R"),
    ("hand.R", (0.03, 0.22, 0.56), (0.05, 0.22, 0.46), "forearm.R"),
    ("thigh.L", (0, -0.12, 0.84), (0, -0.12, 0.44), "hips"),
    ("shin.L", (0, -0.12, 0.44), (0.02, -0.12, 0.07), "thigh.L"),
    ("foot.L", (0.02, -0.12, 0.07), (0.22, -0.12, 0.04), "shin.L"),
    ("thigh.R", (0, 0.12, 0.84), (0, 0.12, 0.44), "hips"),
    ("shin.R", (0, 0.12, 0.44), (0.02, 0.12, 0.07), "thigh.R"),
    ("foot.R", (0.02, 0.12, 0.07), (0.22, 0.12, 0.04), "shin.R"),
]
mira = make_rig("Mira", MIRA_BONES)
mira_parts = []


def add_mira_part(name, material, bone, builder):
    ob = part(name, material, builder)
    bind(ob, mira, bone)
    mira_parts.append(ob)


add_mira_part("mira_pelvis", M["suit"], "hips", lambda bm: bm_sphere(bm, (0, 0, 0.88), 0.17, (1.0, 1.25, 0.8)))
add_mira_part("mira_torso", M["suit"], "spine", lambda bm: bm_capsule(bm, (0, 0, 0.98), (0, 0, 1.18), 0.21))
add_mira_part("mira_stripe", M["orange"], "spine", lambda bm: bm_capsule(bm, (0, 0, 1.02), (0, 0, 1.035), 0.186))
add_mira_part("mira_backpack", M["backpack"], "spine", lambda bm: bm_box(bm, (-0.2, 0, 1.06), (0.14, 0.26, 0.40)))
add_mira_part("mira_neck", M["suit"], "neck", lambda bm: bm_capsule(bm, (0, 0, 1.15), (0, 0, 1.26), 0.075))
add_mira_part("mira_head", M["skin"], "head", lambda bm: bm_sphere(bm, (0, 0, 1.38), 0.26, (1.0, 1.0, 1.05)))
add_mira_part("mira_hair", M["hair"], "head", lambda bm: bm_sphere(bm, (-0.04, 0, 1.46), 0.275, (1.02, 1.02, 0.85)))
add_mira_part("mira_ponytail", M["hair"], "ponytail", lambda bm: bm_capsule(bm, (-0.12, 0, 1.42), (-0.36, 0, 1.22), 0.085))
add_mira_part("mira_eye_w1", M["eye"], "head", lambda bm: bm_sphere(bm, (0.235, -0.085, 1.40), 0.085))
add_mira_part("mira_eye_w2", M["eye"], "head", lambda bm: bm_sphere(bm, (0.235, 0.085, 1.40), 0.085))
add_mira_part("mira_pupil1", M["pupil"], "head", lambda bm: bm_sphere(bm, (0.285, -0.085, 1.40), 0.05))
add_mira_part("mira_pupil2", M["pupil"], "head", lambda bm: bm_sphere(bm, (0.285, 0.085, 1.40), 0.05))
add_mira_part("mira_visor", M["visor"], "head", lambda bm: bm_sphere(bm, (0, 0, 1.38), 0.34))
for side, bone_upper, bone_fore, bone_hand, y in (("L", "upperarm.L", "forearm.L", "hand.L", -0.22), ("R", "upperarm.R", "forearm.R", "hand.R", 0.22)):
    add_mira_part(f"mira_upperarm_{side}", M["suit"], bone_upper, lambda bm, y=y: bm_capsule(bm, (0, y, 1.10), (0, y, 0.82), 0.09))
    add_mira_part(f"mira_forearm_{side}", M["suit"], bone_fore, lambda bm, y=y: bm_capsule(bm, (0, y, 0.82), (0.03, y, 0.56), 0.078))
    add_mira_part(f"mira_glove_{side}", M["glove"], bone_hand, lambda bm, y=y: bm_sphere(bm, (0.04, y, 0.50), 0.10, (1.0, 0.9, 1.1)))
for side, y in (("L", -0.12), ("R", 0.12)):
    add_mira_part(f"mira_thigh_{side}", M["suit"], f"thigh.{side}", lambda bm, y=y: bm_capsule(bm, (0, y, 0.84), (0, y, 0.44), 0.115))
    add_mira_part(f"mira_shin_{side}", M["suit"], f"shin.{side}", lambda bm, y=y: bm_capsule(bm, (0, y, 0.44), (0.02, y, 0.08), 0.10))
    add_mira_part(f"mira_boot_{side}", M["orange"], f"foot.{side}", lambda bm, y=y: bm_sphere(bm, (0.08, y, 0.07), 0.105, (2.0, 1.0, 0.75)))

# Mira's root path: (frame, x, z). Hops, slip, climb and the ledge are all here.
MIRA_ROOT = [
    (0, -0.5, 0.0), (62, -0.5, 0.0), (72, 0.5, 0.0), (80, 0.9, 0.0), (90, 1.25, 0.35), (100, 1.6, 0.0),
    (150, 2.0, 0.0), (200, 4.1, 0.0), (206, 4.15, 0.0), (212, 3.7, 0.0), (218, 3.75, 0.0),
    (234, 4.25, 0.0), (244, 4.7, 0.4), (262, 5.9, 0.4), (300, 7.4, 0.4), (320, 7.85, 0.4),
    (480, 7.9, 0.4),
]
for f, x, z in MIRA_ROOT:
    key_obj(mira, f, loc=(x, 0.0, z))
# Mira is inside the lander until the hatch opens.
for ob in [mira] + mira_parts:
    key_hide(ob, 0, True)
    key_hide(ob, EV["hatchOpen"] + 6, False)


def gait(f0, f1, amp=0.45, knee=0.7, period=24.0):
    for f in range(f0, f1 + 1, 2):
        ph = 2 * math.pi * (f - f0) / period
        s, c = math.sin(ph), math.cos(ph)
        key_bone(mira, "thigh.L", f, rot=(0, -amp * s, 0))
        key_bone(mira, "thigh.R", f, rot=(0, amp * s, 0))
        key_bone(mira, "shin.L", f, rot=(0, knee * max(0.0, c) + 0.05, 0))
        key_bone(mira, "shin.R", f, rot=(0, knee * max(0.0, -c) + 0.05, 0))
        key_bone(mira, "upperarm.L", f, rot=(0, 0.35 * s, 0))
        key_bone(mira, "upperarm.R", f, rot=(0, -0.35 * s, 0))


def reset_legs(f):
    for b in ("thigh.L", "thigh.R", "shin.L", "shin.R", "upperarm.L", "upperarm.R"):
        key_bone(mira, b, f, rot=(0, 0, 0))


for f0, f1 in ((150, 205), (234, 262), (262, 320)):
    gait(f0, f1)
    reset_legs(f1 + 2)

# Hop: knees tuck, then land.
key_bone(mira, "thigh.L", 80, rot=(0, 0, 0)); key_bone(mira, "thigh.R", 80, rot=(0, 0, 0))
key_bone(mira, "thigh.L", 88, rot=(0, -0.9, 0)); key_bone(mira, "thigh.R", 88, rot=(0, -0.9, 0))
key_bone(mira, "shin.L", 88, rot=(0, 1.2, 0)); key_bone(mira, "shin.R", 88, rot=(0, 1.2, 0))
key_bone(mira, "thigh.L", 102, rot=(0, 0, 0)); key_bone(mira, "thigh.R", 102, rot=(0, 0, 0))
key_bone(mira, "shin.L", 102, rot=(0, 0, 0)); key_bone(mira, "shin.R", 102, rot=(0, 0, 0))

# Spine: idle breathing everywhere, plus the backward lean when she slips at the ledge.
def slip_lean(f):
    return piecewise(f, [200, 208, 218, 234], [0.0, -0.75, -0.45, 0.0])


def piecewise(x, xs, ys):
    if x <= xs[0]:
        return ys[0]
    for i in range(1, len(xs)):
        if x <= xs[i]:
            t = (x - xs[i - 1]) / (xs[i] - xs[i - 1])
            return ys[i - 1] + (ys[i] - ys[i - 1]) * t
    return ys[-1]


spine_frames = sorted(set(range(0, FRAMES, 6)) | set(range(198, 240, 2)))
for f in spine_frames:
    key_bone(mira, "spine", f, rot=(0.025 * math.sin(2 * math.pi * f / 72.0), slip_lean(f), 0))

# Arms flail back during the slip, then come down.
for side in ("L", "R"):
    key_bone(mira, f"upperarm.{side}", 207, rot=(0, 1.6, 0))
    key_bone(mira, f"upperarm.{side}", 222, rot=(0, 0, 0))

# Looking up at Earth: head tilts back, right hand shades the eyes.
key_bone(mira, "head", 100, rot=(0, 0, 0))
key_bone(mira, "head", 118, rot=(0, -0.55, -0.75))
key_bone(mira, "head", 146, rot=(0, -0.55, -0.75))
key_bone(mira, "head", 160, rot=(0, 0, 0))
key_bone(mira, "upperarm.R", 116, rot=(0, 0, 0))
key_bone(mira, "upperarm.R", 124, rot=(0, -2.4, 0))
key_bone(mira, "forearm.R", 124, rot=(0, -0.7, 0))
key_bone(mira, "upperarm.R", 150, rot=(0, -2.4, 0))
key_bone(mira, "upperarm.R", 162, rot=(0, 0, 0))
key_bone(mira, "forearm.R", 162, rot=(0, 0, 0))

# Cheer once the star map is shown.
for side in ("L", "R"):
    key_bone(mira, f"upperarm.{side}", EV["cheer"] - 6, rot=(0, 0, 0))
    key_bone(mira, f"upperarm.{side}", EV["cheer"] + 12, rot=(0, -2.8, 0))
    key_bone(mira, f"forearm.{side}", EV["cheer"] + 12, rot=(0, 0, 0))
    key_bone(mira, f"upperarm.{side}", EV["cheer"] + 40, rot=(0, -2.6, 0))
    key_bone(mira, f"upperarm.{side}", EV["cheer"] + 60, rot=(0, 0, 0))

# Ponytail follow-through: damped swings after each big motion.
for f in range(0, FRAMES, 2):
    val = (damped(f, EV["hatchOpen"] + 12, 0.6) + damped(f, EV["hop"], 0.5) + damped(f, EV["hopLand"], 0.5)
           + damped(f, EV["slip"], 0.9) + damped(f, EV["pullUp"], 0.5) + damped(f, EV["touch"], 0.4))
    key_bone(mira, "ponytail", f, rot=(0, val, 0))

# Hover bob while standing and walking is already in the root keys; add a breath lift.
stage("mira")
# ================================================================================= PIP
PIP_BONES = [
    ("root", (0, 0, 0), (0, 0, 0.2), None),
    ("body", (0, 0, 0.2), (0, 0, 0.5), "root"),
    ("antenna", (0, 0, 0.66), (0, 0, 0.92), "body"),
    ("arm.L", (0.05, -0.30, 0.42), (0.10, -0.62, 0.50), "body"),
    ("arm.R", (0.05, 0.30, 0.42), (0.10, 0.62, 0.50), "body"),
]
pip = make_rig("Pip", PIP_BONES)
pip_parts = []


def add_pip_part(name, material, bone, builder):
    ob = part(name, material, builder)
    bind(ob, pip, bone)
    pip_parts.append(ob)


add_pip_part("pip_body", M["pip_body"], "body", lambda bm: bm_sphere(bm, (0, 0, 0.42), 0.36))
add_pip_part("pip_lens", M["pip_lens"], "body", lambda bm: bm_sphere(bm, (0.33, 0, 0.44), 0.11))
add_pip_part("pip_antenna", M["pip_arm"], "antenna", lambda bm: bm_capsule(bm, (0, 0, 0.66), (0, 0, 0.92), 0.018))
add_pip_part("pip_bulb", M["pip_lens"], "antenna", lambda bm: bm_sphere(bm, (0, 0, 0.98), 0.055))
add_pip_part("pip_arm_L", M["pip_arm"], "arm.L", lambda bm: bm_capsule(bm, (0.05, -0.30, 0.42), (0.10, -0.62, 0.50), 0.042))
add_pip_part("pip_arm_R", M["pip_arm"], "arm.R", lambda bm: bm_capsule(bm, (0.05, 0.30, 0.42), (0.10, 0.62, 0.50), 0.042))
add_pip_part("pip_hand_L", M["pip_arm"], "arm.L", lambda bm: bm_sphere(bm, (0.10, -0.64, 0.50), 0.06))
add_pip_part("pip_hand_R", M["pip_arm"], "arm.R", lambda bm: bm_sphere(bm, (0.10, 0.64, 0.50), 0.06))

PIP_ROOT = [
    (0, 0.4, -0.35, 0.3), (116, 0.9, -0.3, 0.4), (130, 1.2, 0.5, 1.0), (150, 1.75, 0.45, 0.95),
    (200, 3.0, 0.3, 0.95), (226, 3.8, 0.2, 1.05), (244, 4.5, 0.1, 1.25), (262, 5.1, 0.25, 1.25),
    (300, 6.6, 0.35, 1.25), (320, 7.0, 0.35, 1.2), (480, 7.05, 0.35, 1.2),
]
for f, x, y, z in PIP_ROOT:
    key_obj(pip, f, loc=(x, y, z))
for ob in [pip] + pip_parts:
    key_hide(ob, 0, True)
    key_hide(ob, EV["pipEmerge"], False)
# One happy spin when he comes out.
key_obj(pip, EV["pipSpin"] - 4, rot=(0, 0, 0))
key_obj(pip, EV["pipSpin"] + 18, rot=(0, 0, 2 * math.pi))
# Arms reach forward to catch Mira, then relax.
for side in ("L", "R"):
    key_bone(pip, f"arm.{side}", EV["slip"] + 1, rot=(0, 0, 0))
    key_bone(pip, f"arm.{side}", EV["catch"] - 4, rot=(0, 0, 1.35))
    key_bone(pip, f"arm.{side}", EV["catch"] + 14, rot=(0, 0, 1.2))
    key_bone(pip, f"arm.{side}", EV["catch"] + 28, rot=(0, 0, 0.1))
# Antenna sways; it flares during the crystal scene.
for f in range(0, FRAMES, 4):
    amp = 0.45 if EV["crystalRise"] <= f <= EV["touch"] + 10 else 0.18
    key_bone(pip, "antenna", f, rot=(amp * math.sin(f * 0.45), 0, 0))
# Lens brightness: surprise at the slip, excitement at the crystal.
key_mat_strength(M["pip_lens"], 0, 3.0)
key_mat_strength(M["pip_lens"], EV["slip"], 10.0)
key_mat_strength(M["pip_lens"], EV["slip"] + 20, 3.0)
key_mat_strength(M["pip_lens"], EV["crystalRise"], 5.0)
key_mat_strength(M["pip_lens"], EV["touch"], 9.0)
key_mat_strength(M["pip_lens"], EV["cheer"], 6.0)

stage("pip")
# ================================================================================= LANDER (static)
lander = bpy.data.objects.new("Lander", None)
scene.collection.objects.link(lander)
lander.empty_display_size = 0.5
lander.location = (0, 0, 3.2)
key_obj(lander, 0, loc=(0, 0, 3.2))
key_obj(lander, EV["touchdown"], loc=(0, 0, 0.0))
key_obj(lander, EV["touchdown"] + 3, loc=(0, 0, 0.05))
key_obj(lander, EV["touchdown"] + 8, loc=(0, 0, 0.0))
lander_parts = []


def lander_part(name, material, builder):
    ob = part(name, material, builder)
    ob.parent = lander
    lander_parts.append(ob)
    return ob


lander_part("lander_body", M["lander"], lambda bm: bm_capsule(bm, (0, 0, 1.0), (0, 0, 2.0), 0.9, seg=32))
lander_part("lander_top", M["lander"], lambda bm: bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=32, radius1=0.9, radius2=0.22, depth=0.9, matrix=Matrix.Translation((0, 0, 2.45))))
lander_part("lander_band", M["lander_dark"], lambda bm: bm_capsule(bm, (0, 0, 1.45), (0, 0, 1.52), 0.92, seg=32))
lander_part("lander_window", M["visor"], lambda bm: bm_sphere(bm, (0.8, 0, 1.9), 0.18, (0.3, 1.0, 1.0)))
for i, ang in enumerate((0.8, 2.36, 3.93, 5.5)):
    x, y = 0.75 * math.cos(ang), 0.75 * math.sin(ang)
    lander_part(f"lander_leg_{i}", M["lander_dark"], lambda bm, x=x, y=y: bm_capsule(bm, (x * 0.6, y * 0.6, 1.05), (x * 1.9, y * 1.9, 0.05), 0.07))
    lander_part(f"lander_foot_{i}", M["lander_dark"], lambda bm, x=x, y=y: bm_sphere(bm, (x * 1.95, y * 1.95, 0.05), 0.14, (1.0, 1.0, 0.45)))
door = part("lander_door", M["door"], lambda bm: bm_box(bm, (0.02, 0, 0.65), (0.04, 0.72, 1.30)))
door.location = (0.9, 0, 0.0)
door.parent = lander
door_keys = [(EV["hatchOpen"] - 12, 0.0), (EV["hatchOpen"], math.pi / 2)]
for f, a in door_keys:
    key_obj(door, f, rot=(0, a, 0))
lander_parts.append(door)

stage("lander")
# ================================================================================= MOON, ROCKS, CRATER
bm = bmesh.new()
bm_box(bm, (60.0, 0, -0.1), (260, 260, 0.2))
make_obj("moon_ground", bm, M["moon"])
bm = bmesh.new()
bm_box(bm, (22.2, 0, 0.2), (35.6, 120, 0.4))
make_obj("moon_plateau", bm, M["moon"])  # plateau top at z = 0.4, starts at x = 4.4
bm = bmesh.new()
bmesh.ops.create_circle(bm, cap_ends=True, radius=1.25, segments=40, matrix=Matrix.Translation((8.4, 0, 0.402)))
make_obj("crater", bm, M["crater"])
for i in range(60):
    x = random.uniform(-14, 40)
    y = random.uniform(-30, 25)
    if -3.5 < x < 12 and -3.0 < y < 3.0:
        continue
    if x > 4.2 and y > -10:
        z = 0.4
    else:
        z = 0.0
    r = random.uniform(0.12, 0.7)
    bm = bmesh.new()
    bm_sphere(bm, (x, y, z + r * 0.35), r, (1.0, 1.0, random.uniform(0.5, 0.8)), u=14, v=9)
    make_obj(f"rock_{i}", bm, M["rock"])

stage("moon")
# ================================================================================= BEACON, RING, STARS
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.5, location=(8.4, 0, -0.8))
crystal = bpy.context.object
crystal.name = "crystal"
crystal.scale = (1.0, 1.0, 1.4)
crystal.data.materials.append(M["crystal"])
for p in crystal.data.polygons:
    p.use_smooth = False
key_obj(crystal, EV["crystalRise"] - 3, loc=(8.4, 0, -0.8))
key_obj(crystal, EV["crystalRiseEnd"], loc=(8.4, 0, 1.25))
key_mat_strength(M["crystal"], EV["crystalRise"] - 3, 0.0)
key_mat_strength(M["crystal"], EV["crystalRiseEnd"], 2.5)
key_mat_strength(M["crystal"], EV["ring"], 4.0)
key_mat_strength(M["crystal"], EV["ring"] + 28, 1.2)
key_mat_strength(M["crystal"], EV["cheer"], 1.5)

bpy.ops.mesh.primitive_torus_add(major_radius=1.0, minor_radius=0.035, location=(8.4, 0, 1.25), rotation=(math.radians(90), 0, 0))
ring = bpy.context.object
ring.name = "ring"
ring.data.materials.append(M["ring"])
key_obj(ring, EV["ring"] - 1, scale=(0.02, 0.02, 0.02))
key_obj(ring, EV["ring"] + 28, scale=(5.0, 5.0, 5.0))
key_mat_strength(M["ring"], EV["ring"] - 1, 0.0)
key_mat_strength(M["ring"], EV["ring"] + 4, 5.0)
key_mat_strength(M["ring"], EV["ring"] + 28, 0.0)

# Star map: ten nodes on an arc in front of the crystal, joined by edges.
NODE_COUNT = EV["starNodeCount"]
nodes = []
for i in range(NODE_COUNT):
    th = -1.2 + 2.4 * i / (NODE_COUNT - 1)
    pos = Vector((8.4 + 1.5 * math.sin(th), -0.55, 1.25 + 1.05 * math.cos(th)))
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.07, location=pos)
    node = bpy.context.object
    node.name = f"node_{i}"
    node.data.materials.append(M["node"])
    f_on = EV["starNodesFrom"] + i * EV["starNodesStep"]
    node.scale = (0.001, 0.001, 0.001)
    key_obj(node, f_on - 4, scale=(0.001, 0.001, 0.001))
    key_obj(node, f_on, scale=(1.0, 1.0, 1.0))
    nodes.append((node, pos))
for i in range(NODE_COUNT - 1):
    a, b = nodes[i][1], nodes[i + 1][1]
    d = b - a
    mid = (a + b) / 2
    bpy.ops.mesh.primitive_cylinder_add(radius=0.012, depth=1.0, location=mid)
    edge = bpy.context.object
    edge.name = f"edge_{i}"
    edge.rotation_mode = "QUATERNION"
    edge.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d)
    edge.data.materials.append(M["edge"])
    L = d.length
    f_grow = EV["starNodesFrom"] + (i + 1) * EV["starNodesStep"] + 2
    edge.scale = (1.0, 1.0, 0.001)
    key_obj(edge, f_grow - 1, scale=(1.0, 1.0, 0.001))
    key_obj(edge, f_grow + 6, scale=(1.0, 1.0, L))

# Earth: big blue world in the sky, slowly turning.
bpy.ops.mesh.primitive_uv_sphere_add(radius=13.0, location=(10.0, 110.0, 24.0), segments=64, ring_count=32)
earth = bpy.context.object
earth.name = "earth"
earth.data.materials.append(M["earth"])
for p in earth.data.polygons:
    p.use_smooth = True
key_obj(earth, 0, rot=(0, 0, 0))
key_obj(earth, TL["frames"] - 1, rot=(0, 0, 0.5))

# Stars: many tiny emissive points on the upper sky.
bm = bmesh.new()
for _ in range(700):
    v = Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(0.02, 1.0))).normalized()
    bm_sphere(bm, v * 240.0, random.uniform(0.25, 0.6), u=6, v=4)
make_obj("stars", bm, M["stars"])

# Title text: 3D, facing the camera at the end.
tc = bpy.data.curves.new("title", type="FONT")
tc.body = "MOON SIGNAL"
tc.extrude = 0.03
tc.align_x = "CENTER"
title = bpy.data.objects.new("title", tc)
scene.collection.objects.link(title)
title.data.materials.append(M["text"])
title.location = (7.6, -0.6, 2.2)
title.rotation_euler = (math.radians(90), 0, 0)
title.scale = (0.0001, 0.0001, 0.0001)
key_obj(title, EV["titleFrom"], scale=(0.0001, 0.0001, 0.0001), loc=(7.6, -0.6, 2.2))
key_obj(title, EV["titleFrom"] + 16, scale=(0.9, 0.9, 0.9), loc=(7.6, -0.6, 2.5))
key_obj(title, EV["titleTo"] + 4, scale=(0.9, 0.9, 0.9), loc=(7.6, -0.6, 2.5))

stage("beacon_stars")
# ================================================================================= LIGHTS
bpy.ops.object.light_add(type="SUN", location=(0, 0, 10))
sun = bpy.context.object
sun.data.energy = 4.2
sun.data.angle = math.radians(0.9)
sun.rotation_euler = (math.radians(52), math.radians(8), math.radians(-35))
sun.data.color = (1.0, 0.94, 0.86)

bpy.ops.object.light_add(type="AREA", location=(2.5, -12.0, 6.0))
fill = bpy.context.object
fill.data.energy = 220
fill.data.size = 7.0
fill.rotation_euler = (math.radians(60), 0, math.radians(15))
fill.data.color = (0.82, 0.9, 1.0)

bpy.ops.object.light_add(type="AREA", location=(6.0, 3.0, 2.2))
rim = bpy.context.object
rim.data.energy = 160
rim.data.size = 3.0
rim.rotation_euler = (math.radians(90), 0, math.radians(-40))
rim.data.color = (0.75, 0.9, 1.0)

# Crystal glow lights the ledge once it rises.
bpy.ops.object.light_add(type="POINT", location=(8.4, -0.5, 1.4))
glow = bpy.context.object
glow.data.energy = 0.0
glow.data.color = (0.35, 0.95, 1.0)
glow.data.shadow_soft_size = 0.4
glow.data.keyframe_insert("energy", frame=EV["crystalRise"])
glow.data.energy = 0.0
glow.data.keyframe_insert("energy", frame=EV["crystalRise"])
glow.data.energy = 40.0
glow.data.keyframe_insert("energy", frame=EV["crystalRiseEnd"])
glow.data.energy = 25.0
glow.data.keyframe_insert("energy", frame=EV["cheer"])

stage("lights")
# ================================================================================= CAMERA
cam_data = bpy.data.cameras.new("Cam")
cam_data.lens = 35.0
cam_data.dof.use_dof = True
cam_data.dof.aperture_fstop = 3.2
cam = bpy.data.objects.new("Cam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
target = bpy.data.objects.new("CamTarget", None)
scene.collection.objects.link(target)
target.empty_display_size = 0.3
cam_data.dof.focus_object = target
con = cam.constraints.new("TRACK_TO")
con.target = target
con.track_axis = "TRACK_NEGATIVE_Z"
con.up_axis = "UP_Y"

TARGET_KEYS = [
    (0, (-0.5, 0, 0.9)), (48, (0.6, 0, 0.9)), (104, (1.3, 0, 1.7)), (150, (2.4, 0, 1.7)),
    (200, (3.7, 0, 1.2)), (262, (7.0, 0, 1.0)), (300, (8.0, 0, 1.0)), (340, (8.1, 0, 1.0)),
    (420, (8.1, 0, 1.0)), (440, (7.9, 0, 1.2)), (480, (7.6, 0, 1.6)),
]
for f, p in TARGET_KEYS:
    key_obj(target, f, loc=p)

CAM_KEYS = [
    (0, (-6.5, -17.0, 3.8)), (48, (-1.0, -9.0, 2.2)), (104, (0.4, -7.2, 1.6)), (150, (1.6, -6.8, 1.6)),
    (200, (2.8, -6.2, 1.5)), (262, (5.6, -5.2, 1.6)), (300, (6.2, -4.2, 1.9)),
]
for f, p in CAM_KEYS:
    key_obj(cam, f, loc=p)
# Orbit around the crystal from 340 to 420, staying in front of it.
for f, p in ((340, (4.2, -5.2, 1.8)), (380, (6.4, -5.6, 1.9)), (420, (10.2, -5.0, 1.8))):
    key_obj(cam, f, loc=p)
key_obj(cam, 440, loc=(7.0, -6.0, 2.6))
key_obj(cam, 480, loc=(4.5, -16.0, 4.5))

stage("camera")
# ================================================================================= RENDER
stage("render")
if MODE.startswith("test:"):
    frames = [int(x) for x in MODE.split(":", 1)[1].split(",") if x.strip()]
    for f in frames:
        scene.frame_set(f)
        print("DEBUG_SPINE", f, [round(v, 3) for v in mira.pose.bones["spine"].rotation_euler], "head", [round(v, 3) for v in mira.pose.bones["head"].rotation_euler], flush=True)
        scene.render.filepath = os.path.join(OUT_DIR, f"test_{f:04d}.png")
        scene.render.image_settings.file_format = "PNG"
        bpy.ops.render.render(write_still=True)
        print("TEST_FRAME", f, flush=True)
elif MODE == "full":
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = os.path.join(OUT_DIR, "f_")
    bpy.ops.render.render(animation=True)
    print("FULL_DONE", flush=True)
else:
    raise SystemExit(f"unknown mode {MODE}")
