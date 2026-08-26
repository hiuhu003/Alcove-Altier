export type Testimonial = {
  name: string;
  location: string;
  text: string;
  rating: number;
  product: string;
};

/**
 * Placeholder testimonials in the client's voice — replace with real reviews
 * (they can be managed later from /admin or a reviews integration).
 */
export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Wanjiru M.",
    location: "Kilimani, Nairobi",
    rating: 5,
    product: "Arch Atelier Mirror",
    text: "My arched mirror is the first thing everyone notices now. The finish is flawless and it was made exactly to my measurements. Worth every shilling.",
  },
  {
    name: "Aisha K.",
    location: "Nyali, Mombasa",
    rating: 5,
    product: "Bouclé Weave Throw",
    text: "So soft and beautifully made. The colour matched my sofa perfectly. Alcove kept me updated the whole way — proper service.",
  },
  {
    name: "Brian O.",
    location: "Lavington, Nairobi",
    rating: 5,
    product: "Velvet Piped Cushion Cover",
    text: "Ordered a full set of custom cushion covers. The tailoring is neat and the velvet feels premium. Delivery was quick too.",
  },
  {
    name: "Naomi W.",
    location: "Karen, Nairobi",
    rating: 5,
    product: "Standing Towel Rack",
    text: "Elegant and sturdy — it completely lifted our bathroom. You can tell each piece is finished by hand.",
  },
  {
    name: "Faith C.",
    location: "Westlands, Nairobi",
    rating: 5,
    product: "Berber Line Rug",
    text: "The rug tied our whole living room together. Great quality for the price and the team helped me choose the right size.",
  },
];
