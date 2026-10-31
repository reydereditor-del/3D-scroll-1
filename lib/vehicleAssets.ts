import { Box3, Mesh, Texture, Vector3, type Group, type Material } from 'three';
const disposed = new WeakSet<Group>();

export function normalizeVehicle(group: Group, orientation: number) {
  group.rotation.y = orientation;
  group.updateMatrixWorld(true);
  const initial = new Box3().setFromObject(group, true);
  const size = initial.getSize(new Vector3());
  const length = Math.max(size.x, size.z);
  if (!Number.isFinite(length) || length <= 0) throw new Error('Vehicle has no valid geometry.');
  group.scale.multiplyScalar(4.8 / length);
  group.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(group, true);
  const center = bounds.getCenter(new Vector3());
  group.position.x -= center.x;
  group.position.y -= bounds.min.y;
  group.position.z -= center.z;
  group.updateMatrixWorld(true);
}

export function disposeVehicle(group: Group) {
  if (disposed.has(group)) return;
  disposed.add(group);
  const geometries = new Set<Mesh['geometry']>();
  const materials = new Set<Material>();
  const textures = new Set<Texture>();
  group.traverse(object => {
    if (!(object instanceof Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      Object.values(material).forEach(value => { if (value instanceof Texture) textures.add(value); });
    }
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
  textures.forEach(texture => texture.dispose());
}
