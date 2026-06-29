export interface SceneryPromptVariant {
  key: string;
  scene: string;
  mood: string;
  details: string;
}

export const SCENERY_PROMPT_VARIANTS: SceneryPromptVariant[] = [
  {
    key: 'night-window',
    scene: 'View through an airplane cabin window on a quiet night flight',
    mood: 'deep midnight navy sky, soft starlight, and gentle moonlit mist',
    details: 'rolling hills, coastline, or valley silhouettes',
  },
  {
    key: 'sunrise-clouds',
    scene: 'Early dawn view from an airplane window above layered clouds',
    mood: 'warm golden sunrise, pale blue horizon, and soft sleepy haze',
    details: 'cloud oceans opening toward the terrain below',
  },
  {
    key: 'city-lights',
    scene: 'High altitude airplane window view of a city at night',
    mood: 'glowing amber street grids, quiet neighborhoods, and distant runway lights',
    details: 'urban lights shaped by local geography, not a famous landmark',
  },
  {
    key: 'coastal-approach',
    scene: 'Airplane descent view toward a coastline near the destination',
    mood: 'silver water, soft clouds, and a calm cinematic approach',
    details: 'shorelines, harbors, small islands, or sea mist',
  },
  {
    key: 'mountain-valley',
    scene: 'Airplane window view over mountains and valleys near landing',
    mood: 'blue shadows, thin clouds, and a peaceful half-awake atmosphere',
    details: 'ridges, rivers, valleys, and layered terrain',
  },
  {
    key: 'rainy-window',
    scene: 'Rain-speckled airplane cabin window looking out during descent',
    mood: 'soft reflections, blurred landscape lights, and a quiet rainy arrival',
    details: 'diffused city edges, wet glass, and moody local terrain',
  },
  {
    key: 'rural-patchwork',
    scene: 'Gentle airplane window view over countryside near the destination',
    mood: 'muted morning light, soft atmospheric perspective, and calm fields',
    details: 'farmland patterns, rivers, villages, or wooded hills',
  },
];

export function pickSceneryVariantIndex(seed: string, count = SCENERY_PROMPT_VARIANTS.length): number {
  if (count <= 0) return 0;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % count;
}

export function buildSceneryPrompt(
  city: string,
  country: string,
  displayName: string,
  variantIndex = Math.floor(Math.random() * SCENERY_PROMPT_VARIANTS.length)
): string {
  const place = displayName || `${city}, ${country}`;
  const variant = SCENERY_PROMPT_VARIANTS[
    ((variantIndex % SCENERY_PROMPT_VARIANTS.length) + SCENERY_PROMPT_VARIANTS.length)
    % SCENERY_PROMPT_VARIANTS.length
  ];

  return [
    `${variant.scene},`,
    `gazing at the landscape near ${place}.`,
    `Mood: ${variant.mood}.`,
    `Show scenery typical of ${country}: ${variant.details}.`,
    `Dreamy and poetic, like a half-awake memory after a long Sleep Airline flight.`,
    `Avoid tourist postcard composition and avoid famous monuments unless they naturally appear far in the distance.`,
    `Cinematic composition, no people, no text, no watermark, no logos.`,
  ].join(' ');
}
