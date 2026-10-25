// The greeting on the landing page: a hello that follows the time of day, and a line picked at random.
// Pure, so it is tested without a browser.
export const partOfDay = (hour) => (hour >= 5 && hour < 12 ? 'morning' : hour >= 12 && hour < 17 ? 'afternoon' : hour >= 17 && hour < 22 ? 'evening' : 'night');

export const HELLOS = {
  morning: ['Good morning', 'Morning', 'Kia ora'],
  afternoon: ['Good afternoon', 'Afternoon', 'Kia ora'],
  evening: ['Good evening', 'Evening', 'Kia ora'],
  night: ['Still up?', 'Late one', 'Kia ora'],
};

export const MESSAGES = [
  'Ready for a few questions?',
  'One question at a time.',
  "Let's find out what you already know.",
  'Mistakes are just data. Collect some.',
  'A little practice now saves a lot of panic later.',
  'Pick a topic and get stuck in.',
  'The hard ones are the ones worth doing.',
  'Ten good questions beat an hour of rereading.',
  'Show the working, then check it.',
  'Start with the one you have been avoiding.',
  'Slow is smooth, and smooth is fast.',
  'Which topic is weakest today?',
  'Warm up on something easy, then go after something hard.',
  'Every wrong answer is a free lesson.',
  'Think first, check second.',
  'Small steps, solid marks.',
];

// -> { hello, message }. `date` is the user's local time; rng gives numbers in [0, 1).
export function pickGreeting(date = new Date(), rng = Math.random) {
  const hellos = HELLOS[partOfDay(date.getHours())];
  return { hello: hellos[Math.floor(rng() * hellos.length)], message: MESSAGES[Math.floor(rng() * MESSAGES.length)] };
}
