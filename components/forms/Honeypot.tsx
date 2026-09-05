/**
 * Bot trap carried forward from the legacy forms (every legacy/*.html
 * form had a hidden "website" field; a real visitor never fills it in,
 * a bot usually does). The server action rejects any submission where
 * this field is non-empty. See app/actions.ts.
 */
export function Honeypot() {
  return (
    <input
      type="text"
      name="website"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
    />
  )
}
