export type Artist = {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  email: string | null;
  whatsapp_number: string | null;
  address: string | null;
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

export type GalleryWithArtist = Gallery & { artist: Artist };

export type ArtworkWithContext = Artwork & {
  gallery: Gallery & { artist: Artist };
};

export type ExhibitionWithArtist = Exhibition & { artist: Artist | null };
