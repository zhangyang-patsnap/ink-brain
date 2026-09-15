import records from './skills.json';
export interface Skill {
  slug: string;
  name: string;
  summary: string;
  category: 'development' | 'documents' | 'design' | 'data' | 'operations' | 'other';
  origin: 'original' | 'reference';
  sourceUrl: string;
  monogram: string;
  version: string;
  documentation: string;
  featured: boolean;
  order: number;
  demo: boolean;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  checksum: string;
}
export const skills: Skill[] = records as Skill[];
