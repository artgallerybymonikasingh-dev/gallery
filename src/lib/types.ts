export type Artist = {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  email: string | null;
  whatsapp_number: string | null;
  address: string | null;
  cover_image_url: string | null;
  created_at: string;
};

export type Gallery = {
  id: string;
  artist_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  whatsapp_number: string | null;
  created_at: string;
};

export type Artwork = {
  id: string;
  gallery_id: string;
  title: string;
  description: string | null;
  width_cm: number | null;
  height_cm: number | null;
  image_url: string;
  storage_path: string;
  sort_order: number;
  created_at: string;
};

export type Exhibition = {
  id: string;
  title: string;
  artist_id: string | null;
  location: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

// Exactly one of artwork_id / gallery_id is set — an appreciation targets
// either a specific painting or a gallery as a whole.
export type Appreciation = {
  id: string;
  artwork_id: string | null;
  gallery_id: string | null;
  name: string | null;
  message: string;
  approved: boolean;
  created_at: string;
};

export type GalleryWithArtist = Gallery & { artist: Artist };

export type ArtworkWithContext = Artwork & {
  gallery: Gallery & { artist: Artist };
};

export type ArtworkWithAppreciations = Artwork & { appreciations: Appreciation[] };

export type ExhibitionWithArtist = Exhibition & { artist: Artist | null };

export type AppreciationWithArtwork = Appreciation & {
  artwork: Artwork & { gallery: Gallery & { artist: Artist } };
};

export type AppreciationWithGallery = Appreciation & {
  gallery: Gallery & { artist: Artist };
};
