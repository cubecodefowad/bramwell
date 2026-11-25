import {
  Blocks,
  CalendarDays,
  Clapperboard,
  Headset,
  PanelsTopLeft,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

export type Service = {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const services: Service[] = [
  {
    number: '01',
    title: 'AI Receptionists',
    description:
      'Always-on virtual receptionists that answer enquiries, handle customer conversations, and help businesses capture opportunities.',
    icon: Headset,
  },
  {
    number: '02',
    title: 'Websites & Digital Experiences',
    description:
      'Modern, responsive websites designed to establish credibility, showcase services, and turn visitors into customers.',
    icon: PanelsTopLeft,
  },
  {
    number: '03',
    title: 'Business Automation',
    description:
      'Intelligent workflows that reduce repetitive tasks, connect business tools, and simplify everyday operations.',
    icon: Workflow,
  },
  {
    number: '04',
    title: 'Content & Social Media Planning',
    description:
      'Structured content calendars, post ideas, and publishing plans that help businesses maintain a consistent online presence.',
    icon: CalendarDays,
  },
  {
    number: '05',
    title: 'Video Reviews & Content',
    description:
      'AI-assisted video testimonials, product reviews, promotional content, and engaging short-form media.',
    icon: Clapperboard,
  },
  {
    number: '06',
    title: 'Custom AI Solutions',
    description:
      'Tailored AI-powered tools and integrations designed around specific business challenges.',
    icon: Blocks,
  },
];

export const serviceNames = services.map((service) => service.title);

export type Step = {
  number: string;
  title: string;
  description: string;
};

export const steps: Step[] = [
  { number: '01', title: 'Discover', description: 'We learn about your business, challenges, and goals.' },
  { number: '02', title: 'Design', description: 'We identify the right tools and develop a practical solution.' },
  { number: '03', title: 'Build', description: 'We bring everything together, from design to implementation.' },
  { number: '04', title: 'Improve', description: 'We refine, optimize, and help your solution evolve.' },
];

export const principles = [
  {
    numeral: 'I',
    title: 'Thoughtfully Built',
    description: 'Solutions designed around real business needs.',
  },
  {
    numeral: 'II',
    title: 'Intelligently Powered',
    description: 'Technology that makes everyday work easier.',
  },
  {
    numeral: 'III',
    title: 'Made to Grow',
    description: 'Flexible systems that evolve alongside your business.',
  },
];
