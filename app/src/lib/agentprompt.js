// The one prompt a user copies into an AI agent to have it interview them, build the practice PDF in the layout the app reads and
// walk them through importing it. It is the file docs/practice-pdf-agent-prompt.md, bundled as text (a test checks that it carries
// the layout in docs/practice-pdf-prompt.md).
import prompt from '../../../docs/practice-pdf-agent-prompt.md?raw';

export default prompt.trim();
export { copyText } from './clipboard.js';
