"""Verify that the distributable GLB cannot reference source branding textures/variants."""
import json, struct
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'public/models/concept.glb'
b=p.read_bytes()
assert b[:4]==b'glTF'
size=struct.unpack_from('<I',b,12)[0]
j=json.loads(b[20:20+size])
assert not j.get('images'), 'Unexpected images: re-audit branding'
assert not j.get('textures'), 'Unexpected textures: re-audit branding'
assert 'KHR_materials_variants' not in j.get('extensionsUsed',[]), 'Source variants restored'
for n in j.get('nodes',[]):
 assert not any(s in n.get('name','').lower() for s in ['license','emblem','khronos','commerce'])
allowed={'Unmarked dark trim','Original graphite finish','Opaque smoked glazing','White light lens','Red light lens','Unmarked alloy','Unmarked rubber'}
assert all(m.get('name') in allowed for m in j['materials']), 'Unexpected source materials'
assert len(b)<8_000_000, 'Desktop model exceeds initial transfer budget'
assert (root/'public/licenses/carconcept-CC-BY-4.0.txt').is_file()
print(f'PASS: {len(b):,} bytes, {len(j["materials"])} replacement materials, no images/textures/variants or named branding nodes. License present.')
