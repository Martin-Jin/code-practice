// A shortcut drawn as key caps: "Ctrl+Shift+Enter" -> [Ctrl] + [Shift] + [Enter].
export default function Keys({ combo }) {
  return combo.split('+').map((k, i) => (
    <span key={i}>{i > 0 && ' + '}<span className="kbd">{k}</span></span>
  ));
}
