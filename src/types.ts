export interface SourceObject { id: string; name: string; }

export interface LibraryComponent {
  id: string;
  sourceId: string;
  objectId: string;
  name: string;
  markup: string;
  width: number;
  height: number;
}

export interface SceneObject {
  id: string;
  componentId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}
