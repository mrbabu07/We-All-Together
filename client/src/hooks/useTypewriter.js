import { useEffect, useMemo, useState } from 'react'

const defaultTypewriterPhrases = [
  'একতায় আমরা, উন্নয়নে আমরা',
  'সেবায় নিবেদিত, সমাজের জন্য',
  'দরগাহ পাড়ার গর্ব, সবার পরিষদ',
]

export default function useTypewriter(phrases = defaultTypewriterPhrases) {
  const cleanPhrases = useMemo(() => {
    const usable = Array.isArray(phrases)
      ? phrases.map((item) => String(item).trim()).filter(Boolean)
      : []

    return usable.length ? usable.slice(0, 5) : defaultTypewriterPhrases
  }, [phrases])
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [characterIndex, setCharacterIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const currentPhrase = cleanPhrases[phraseIndex] || ''
    const complete = characterIndex === currentPhrase.length
    const empty = characterIndex === 0
    const delay = complete && !deleting ? 2000 : deleting ? 30 : 50

    const timer = window.setTimeout(() => {
      if (!deleting && complete) {
        setDeleting(true)
        return
      }

      if (deleting && empty) {
        setDeleting(false)
        setPhraseIndex((current) => (current + 1) % cleanPhrases.length)
        return
      }

      setCharacterIndex((current) => current + (deleting ? -1 : 1))
    }, delay)

    return () => window.clearTimeout(timer)
  }, [characterIndex, cleanPhrases, deleting, phraseIndex])

  return cleanPhrases[phraseIndex]?.slice(0, characterIndex) || ''
}
