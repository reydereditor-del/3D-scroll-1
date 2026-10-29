"""Run: blender -b --python scripts/prepare-car.py -- /path/to/original.glb
Source must already have its CC-BY-4.0 provenance verified. No network operations.
"""
import bpy, sys, math, os
from mathutils import Vector
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=sys.argv[sys.argv.index('--')+1])
# Remove dedicated branding geometry; discard every original texture/material.
removed=[]
for obj in list(bpy.data.objects):
 if any(s in obj.name.lower() for s in ['license','emblem']):
  removed.append(obj.name); bpy.data.objects.remove(obj,do_unlink=True)
def material(name,color,metal=0,rough=.3):
 m=bpy.data.materials.new(name); m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1); p.inputs['Metallic'].default_value=metal; p.inputs['Roughness'].default_value=rough
 return m
paint=material('Original graphite finish',(.115,.125,.14),.78,.24)
black=material('Unmarked dark trim',(.012,.014,.018),.3,.32)
rubber=material('Unmarked rubber',(.009,.01,.012),0,.62)
metal=material('Unmarked alloy',(.3,.32,.35),.9,.23)
glass=material('Opaque smoked glazing',(.018,.03,.04),.65,.16)
red=material('Red light lens',(.5,.008,.012),.35,.24)
white=material('White light lens',(.7,.78,.82),.4,.18)
for m in [red,white]:
 p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Emission Color'].default_value=p.inputs['Base Color'].default_value; p.inputs['Emission Strength'].default_value=2
meshes=[o for o in bpy.data.objects if o.type=='MESH']
for o in meshes:
 n=o.name.lower(); mat=paint
 if 'window' in n or 'windshield' in n: mat=glass
 elif 'rim' in n or 'disc' in n: mat=metal
 elif 'wheel' in n and 'steering' not in n: mat=rubber
 elif 'taillight' in n or 'turnsignal' in n or 'brakepad' in n: mat=red
 elif 'headlight' in n: mat=white
 elif any(s in n for s in ['interior','underside','grill','gasket','wiper','engine','axle']): mat=black
 o.data.materials.clear(); o.data.materials.append(mat)
# Erase imported variant bindings, which otherwise restore original materials during export.
for scene_ in bpy.data.scenes:
 if hasattr(scene_, 'gltf2_KHR_materials_variants_variants'): scene_.gltf2_KHR_materials_variants_variants.clear()
for o in meshes:
 for attr in ['gltf2_variant_mesh_data','gltf2_variant_default_materials']:
  if hasattr(o.data,attr): getattr(o.data,attr).clear()
 for poly in o.data.polygons: poly.material_index=0
# World-space bounds; center and normalize to 4.8 units across longest axis.
bpy.context.view_layer.update()
pts=[o.matrix_world@Vector(v) for o in meshes for v in o.bound_box]
lo=Vector(tuple(min(v[i] for v in pts) for i in range(3))); hi=Vector(tuple(max(v[i] for v in pts) for i in range(3)))
center=(lo+hi)/2; scale=4.8/max(hi-lo)
# A parent keeps original hierarchy intact.
parent=bpy.data.objects.new('Unbranded concept',None); bpy.context.collection.objects.link(parent)
for o in list(bpy.context.scene.objects):
 if o!=parent and o.parent is None: o.parent=parent
parent.scale=(scale,)*3; parent.location=(-center.x*scale,-center.y*scale,-lo.z*scale)
bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.context.scene.objects: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=root+'/public/models/concept.glb',export_format='GLB',use_selection=True,export_materials='EXPORT',export_animations=False,export_cameras=False,export_lights=False)
if '--skip-renders' in sys.argv: sys.exit(0)
# Blender Z-up. Export is glTF Y-up. Studio stills use exactly this derivative.
scene=bpy.context.scene; scene.render.engine='CYCLES'; scene.cycles.samples=48; scene.cycles.use_denoising=False
scene.render.resolution_x=1500; scene.render.resolution_y=900; scene.render.resolution_percentage=100
scene.world.color=(.12,.12,.12)
# Dark floor and broad studio strips.
floor=material('Studio floor',(.012,.014,.018),.22,.33)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.02)); bpy.context.object.data.materials.append(floor)
def area(name,pos,power,size,color):
 bpy.ops.object.light_add(type='AREA',location=pos); o=bpy.context.object; o.name=name; o.data.energy=power; o.data.shape='DISK'; o.data.size=size; o.data.color=color; o.rotation_euler=(Vector((0,0,.5))-o.location).to_track_quat('-Z','Y').to_euler()
area('Soft key',(1,-3,6),850,6,(.85,.9,1)); area('White rim',(-4,2,4),1000,5,(1,.95,.9)); area('Red edge',(3,4,2),100,4,(1,.045,.025))
bpy.ops.object.camera_add(); camera=bpy.context.object; scene.camera=camera; camera.data.lens=48
# Car is long along Blender Y; adjust after bound inspection if needed.
print('BOUNDS',tuple(lo),tuple(hi),'REMOVED',removed,flush=True)
views=[('hero',(6,-7,3),(0,0,.55)),('design',(7,-.8,2.3),(0,0,.55)),('performance',(-5,6,2.7),(0,0,.5)),('details',(3,-4,1.6),(0,-1,.6))]
for name,pos,target in views:
 camera.location=pos; camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=root+'/public/images/'+name+'.webp'; scene.render.image_settings.file_format='WEBP'; scene.render.image_settings.quality=88
 bpy.ops.render.render(write_still=True)
print('DONE',flush=True)
