// Types purs — aucune dépendance Node.js.
// Ce fichier est importable par les Client Components (navigateur).

export type SizeKey = "A6" | "A5" | "A4" | "A3" | "A2" | "A1" | "A0";
export const ALL_SIZES: SizeKey[] = ["A6", "A5", "A4", "A3", "A2", "A1", "A0"];

export type SizePricing = {
  A6: { enabled: boolean; price: number };
  A5: { enabled: boolean; price: number };
  A4: { enabled: boolean; price: number };
  A3: { enabled: boolean; price: number };
  A2: { enabled: boolean; price: number };
  A1: { enabled: boolean; price: number };
  A0: { enabled: boolean; price: number };
};

export type DeliveryOptions = {
  email: { enabled: boolean; price: number };
  print: { enabled: boolean; sizes: SizePricing };
  canvas: { enabled: boolean; sizes: SizePricing }; // version toile
  original: { enabled: boolean; price: number };
  printEmail: { enabled: boolean; sizes: SizePricing };
  originalEmail: { enabled: boolean; price: number };
  originalPrint: { enabled: boolean; sizes: SizePricing };
  originalPrintEmail: { enabled: boolean; sizes: SizePricing };
};

export function emptyDeliveryOptions(): DeliveryOptions {
  const emptySizes: SizePricing = {
    A6: { enabled: false, price: 0 },
    A5: { enabled: false, price: 0 },
    A4: { enabled: false, price: 0 },
    A3: { enabled: false, price: 0 },
    A2: { enabled: false, price: 0 },
    A1: { enabled: false, price: 0 },
    A0: { enabled: false, price: 0 },
  };
  return {
    email: { enabled: false, price: 0 },
    print: { enabled: false, sizes: structuredClone(emptySizes) },
    canvas: { enabled: false, sizes: structuredClone(emptySizes) },
    original: { enabled: false, price: 0 },
    printEmail: { enabled: false, sizes: structuredClone(emptySizes) },
    originalEmail: { enabled: false, price: 0 },
    originalPrint: { enabled: false, sizes: structuredClone(emptySizes) },
    originalPrintEmail: { enabled: false, sizes: structuredClone(emptySizes) },
  };
}

export type Product = {
  id: string;
  title: string;
  type: "print" | "original" | "bd" | "autre";
  medium: string;
  size: string;
  edition: string;
  price: number;
  description: string;
  images: string[];        // photos générales (fallback)
  imagesOriginal?: string[]; // photos spécifiques à l'œuvre originale
  imagesPrint?: string[];    // photos spécifiques aux prints
  photoTags?: Record<string, "original" | "print">; // tag par URL de photo
  allowDedication: boolean;
  active: boolean;
  featured: boolean;
  wallPreviewEnabled: boolean;
  editionTotal: number;
  editionSold: number;
  delivery: DeliveryOptions;
  linkedProductId?: string;
  temporaryUntil?: string;
  retireAt?: string; // retrait définitif du catalogue à cette date
  isNew?: boolean;
  createdAt: string;
};
