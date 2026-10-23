import { createImageUrlBuilder } from '@sanity/image-url';

import { sanityDataset, sanityProjectId } from './config';
import type { StayImage } from './types';

export type ImageSize = {
  width: number;
  height: number;
};

export const CARD_IMAGE_SIZE: ImageSize = { width: 800, height: 600 };
export const DETAIL_IMAGE_SIZE: ImageSize = { width: 1200, height: 900 };

const builder =
  sanityProjectId && sanityDataset
    ? createImageUrlBuilder({ projectId: sanityProjectId, dataset: sanityDataset })
    : null;

export type ImageRow =
  | {
      ref?: string | null;
      alt?: string | null;
    }
  | null
  | undefined;

export function imageUrl(ref: string | null | undefined, size: ImageSize): string | null {
  if (!builder || !ref) {
    return null;
  }

  try {
    return builder
      .image({ _ref: ref })
      .width(size.width)
      .height(size.height)
      .fit('crop')
      .auto('format')
      .url();
  } catch {
    return null;
  }
}

export function toStayImage(row: ImageRow, size: ImageSize): StayImage | null {
  if (!row) {
    return null;
  }

  return {
    url: imageUrl(row.ref, size),
    alt: row.alt ?? '',
  };
}
