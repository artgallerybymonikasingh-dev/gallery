export type Artist = {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  email: string | null;
  whatsapp_number: string | null;
  address: string | null;
  cover_image_url: string | null;
  instagram_url: string | null;
  website_url: string | null;
  created_at: string;
};

export type Gallery = {
  id: string;
  slug: string;
  artist_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  whatsapp_number: string | null;
  created_at: string;
};

export type ArtworkStatus = "available" | "reserved" | "sold";

export type Artwork = {
  id: string;
  gallery_id: string;
  slug: string;
  title: string;
  description: string | null;
  width_cm: number | null;
  height_cm: number | null;
  price: string | null;
  image_url: string;
  storage_path: string;
  sort_order: number;
  status: ArtworkStatus;
  whatsapp_number: string | null;
  created_at: string;
};

export type Exhibition = {
  id: string;
  slug: string;
  title: string;
  location: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  cover_image_url: string | null;
  created_at: string;
};

// Exactly one of artwork_id / gallery_id / artist_id is set — an
// appreciation targets a specific painting, a gallery, or an artist.
export type Appreciation = {
  id: string;
  artwork_id: string | null;
  gallery_id: string | null;
  artist_id: string | null;
  name: string | null;
  message: string;
  approved: boolean;
  created_at: string;
};

export type GalleryWithArtist = Gallery & { artist: Artist };

export type ArtworkWithContext = Artwork & {
  gallery: Gallery & { artist: Artist };
};

// An artwork's own artist credit(s) — independent of its gallery's or any
// exhibition's artist list, since neither implies every photo in it is by
// all of those artists. Defaults to the gallery's artist at creation time
// but is editable per photo from there.
export type ArtworkWithAppreciations = Artwork & { appreciations: Appreciation[]; artists: Artist[] };

export type ExhibitionWithArtists = Exhibition & { artists: Artist[] };

export type ExhibitionWithArtworks = ExhibitionWithArtists & {
  photoCount: number;
  coverImageUrl: string | null;
};

export type AppreciationWithArtwork = Appreciation & {
  artwork: Artwork & { gallery: Gallery & { artist: Artist } };
};

export type AppreciationWithGallery = Appreciation & {
  gallery: Gallery & { artist: Artist };
};

export type AppreciationWithArtistOnly = Appreciation & {
  artist: Artist;
};
