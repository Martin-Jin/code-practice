export function inputValidationMessage(field) {
  const validity = field && field.validity;
  if (!validity || validity.valid) return null;

  let issue = 'is invalid.';
  if (validity.valueMissing) issue = 'is required.';
  else if (validity.badInput) issue = 'must be a valid number.';
  else if (validity.rangeUnderflow) issue = `must be at least ${field.min}.`;
  else if (validity.rangeOverflow) issue = `must be no more than ${field.max}.`;
  else if (validity.stepMismatch) issue = `must use increments of ${field.step}.`;
  else if (validity.typeMismatch) issue = `must be a valid ${field.type}.`;
  else if (validity.tooShort) issue = `must contain at least ${field.minLength} characters.`;
  else if (validity.tooLong) issue = `must contain no more than ${field.maxLength} characters.`;
  else if (validity.patternMismatch) issue = 'does not match the required format.';

  const label = field.getAttribute('aria-label')
    || [...(field.labels || [])].map((item) => item.textContent.trim()).filter(Boolean).join(' ')
    || 'This field';
  return `${label} ${issue}`;
}
