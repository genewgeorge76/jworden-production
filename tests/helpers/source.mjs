import { readFileSync } from 'node:fs'

/**
 * Read a source file with its comments removed.
 *
 * Three separate tests in this suite asserted "this string does not appear in
 * this file", and all three failed on the file's own doc comment — the place
 * where the string is explained rather than used:
 *
 *   DocumentedRecord       flagged the figures its header quotes in order to
 *                          explain why hard-coded figures are forbidden
 *   build-county-landmarks flagged the API key names it mentions in order to
 *                          explain why it needs none
 *   CountyServicePage      flagged "no landmarks", the phrase describing what
 *                          happens when a county has none
 *
 * A test that cannot tell a use from an explanation punishes the documentation
 * that makes its own rule survivable, and it teaches whoever hits it to delete
 * one or the other. Use this for any "must not contain" assertion.
 */
export function sourceWithoutComments(path) {
  return readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

/**
 * The same idea for Python, whose comments this does not resemble at all.
 *
 * The fourth instance of the bug above: a test asserted that
 * state_51_compliance_engine.py no longer contains "Hardcoded database" or
 * "Reverting to Federal default guidelines", and it failed on the module
 * docstring — the paragraph explaining that those phrases are what the file
 * used to say and why they were wrong.
 *
 * Stripping the JS way finds nothing to strip in a .py file, so the file's own
 * account of its history reads as the history repeating.
 *
 * Triple-quoted strings go first, so a `#` inside one is not treated as the
 * start of a comment, and a quoted string on a code line keeps its `#`.
 */
export function pythonSourceWithoutComments(path) {
  return readFileSync(path, 'utf8')
    .replace(/"""[\s\S]*?"""/g, '')
    .replace(/'''[\s\S]*?'''/g, '')
    .replace(/(^|[^'"])#.*$/gm, '$1')
}
