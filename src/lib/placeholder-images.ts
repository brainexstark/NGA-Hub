
import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  ageGroup?: 'under-10' | '10-16' | '16-plus';
  description: string;
  imageUrl: string;
  imageHint: string;
  url?: string;
};

export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages as ImagePlaceholder[];
