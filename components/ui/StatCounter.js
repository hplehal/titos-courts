'use client'

import { useState, useEffect, useRef } from 'react'

export default function StatCounter({ value, label, suffix = '', icon: Icon }) {
  const [count, setCount] = useState(0)
  const [isInView, setIsInView] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '-50px' }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isInView) return
    const target = parseInt(value, 10)
    const duration = 1500
    const steps = 40
    const increment = target / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [isInView, value])

  return (
    <div ref={ref} className="text-center px-4 py-3">
      {Icon && <Icon className="w-6 h-6 text-titos-gold mx-auto mb-2" />}
      <div className="font-display text-3xl sm:text-4xl font-bold text-titos-white mb-1">
        {count}{suffix}
      </div>
      <div className="text-titos-gray-400 text-sm font-medium uppercase tracking-wider">
        {label}
      </div>
    </div>
  )
}
