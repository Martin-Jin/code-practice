export const DEFAULT_AGENT_URL = 'https://claude.ai/new';

export function normaliseAgentUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

function answerText(part, value) {
  if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) return '';
  if (part.type === 'mcq') {
    return (Array.isArray(value) ? value : []).map((i) => part.options[i]).filter(Boolean).join('; ');
  }
  if (part.type === 'self') return value === 'right' ? 'I got it' : value === 'wrong' ? 'Not quite' : '';
  return `${value}${part.unit ? ` ${part.unit}` : ''}`;
}

export function formatSolvePrompt({ set, question, answers = {}, notes = '' }) {
  const lines = [
    'Act as a patient tutor. Help me understand this question using my own working.',
    'Do not reveal a complete solution or jump straight to the final answer. Give one small hint or ask one focused question at a time, and explain the reasoning only as we work through it.',
    'If I have not included any working steps (even if I have entered a final answer), first ask me to share my working before giving a hint or solving it.',
    '',
    `Set: ${set.title}`,
    `Question: ${question.title}`,
  ];
  if (question.source) lines.push(`Source: ${question.source}`);
  if (question.marks !== null && question.marks !== undefined) lines.push(`Marks: ${question.marks}`);
  lines.push('', 'Question wording:');
  lines.push(question.stem.text || '(See the attached question image.)');

  if (question.parts.length) {
    lines.push('', 'Parts and my current answers:');
    for (const [index, part] of question.parts.entries()) {
      const name = part.label ? `Part ${part.label}` : `Part ${index + 1}`;
      lines.push(`- ${name}${part.prompt ? `: ${part.prompt}` : ''}`);
      if (part.type === 'mcq') lines.push(`  Options: ${part.options.map((option, i) => `${i + 1}. ${option}`).join(' | ')}`);
      const response = answerText(part, answers[part.label]);
      if (response) lines.push(`  My current answer: ${response}`);
    }
  }

  lines.push('', 'My working / notes:');
  lines.push(notes.trim() || '(No working or notes provided.)');
  lines.push('', 'The question image is included on the clipboard when this browser supports copying it. If you cannot see it, ask me to attach it.');
  return lines.join('\n');
}
