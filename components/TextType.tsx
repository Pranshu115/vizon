'use client'

import React, { useState, useEffect } from 'react'

interface TextTypeProps {
  text: string[]
  typingSpeed?: number
  pauseDuration?: number
  showCursor?: boolean
  cursorCharacter?: string
  className?: string
}

export default function TextType({
  text,
  typingSpeed = 75,
  pauseDuration = 1500,
  showCursor = true,
  cursorCharacter = '|',
  className = ''
}: TextTypeProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [displayText, setDisplayText] = useState('')
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const currentFullText = text[currentTextIndex]

    const handleTyping = () => {
      if (isPaused) {
        return
      }

      if (!isDeleting) {
        // Typing forward
        if (currentCharIndex < currentFullText.length) {
          setDisplayText(currentFullText.substring(0, currentCharIndex + 1))
          setCurrentCharIndex(currentCharIndex + 1)
        } else {
          // Finished typing, pause before deleting
          setIsPaused(true)
          setTimeout(() => {
            setIsPaused(false)
            setIsDeleting(true)
          }, pauseDuration)
        }
      } else {
        // Deleting backward
        if (currentCharIndex > 0) {
          setDisplayText(currentFullText.substring(0, currentCharIndex - 1))
          setCurrentCharIndex(currentCharIndex - 1)
        } else {
          // Finished deleting, move to next text
          setIsDeleting(false)
          setCurrentTextIndex((currentTextIndex + 1) % text.length)
        }
      }
    }

    const timeout = setTimeout(
      handleTyping,
      isDeleting ? typingSpeed / 2 : typingSpeed
    )

    return () => clearTimeout(timeout)
  }, [
    currentCharIndex,
    currentTextIndex,
    isDeleting,
    isPaused,
    text,
    typingSpeed,
    pauseDuration
  ])

  return (
    <span className={className}>
      {displayText}
      {showCursor && (
        <span className="animate-blink inline-block">{cursorCharacter}</span>
      )}
    </span>
  )
}
