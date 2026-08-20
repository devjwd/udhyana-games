export interface Product {
  id: string;
  title: string;
  price: string;
  description: string;
  image: string;
  category: string;
  featured: boolean;
}

export const products: Product[] = [
  {
    id: "pulse-3d-wireless",
    title: "Pulse 3D Wireless",
    price: "$99.99",
    description: "Experience ultra-low latency and crystal clear voice chat. The official headset for serious competitors. Tuned for 3D Audio on PS5 consoles. Enjoy comfortable gaming with refined earpads and headband strap. Play in style with a sleek design that complements the console. Up to 12 hours of wireless play with the built-in rechargeable battery.",
    image: "/images/products/headphones.png",
    category: "Audio",
    featured: true,
  },
  {
    id: "elite-pro-controller",
    title: "Elite Pro Controller",
    price: "$149.99",
    description: "Customizable paddles, adjustable thumbstick tension, and a rubberized wrap-around grip. Get a competitive edge with personalized control profiles and interchangeable components. Built for high-performance gaming with ultra-responsive triggers and tactile button feedback.",
    image: "/images/products/controller.png",
    category: "Controllers",
    featured: false,
  },
  {
    id: "mech-v2-keyboard",
    title: "Mech V2 Keyboard",
    price: "$129.99",
    description: "Tenkeyless mechanical keyboard with custom linear switches and dynamic per-key RGB backlighting. Features aircraft-grade aluminum construction, detached USB-C cable for portability, and on-board memory for your custom lighting profiles. Anti-ghosting and N-key rollover ensure every keystroke is registered.",
    image: "/images/products/keyboard.png",
    category: "Keyboards",
    featured: false,
  }
];
