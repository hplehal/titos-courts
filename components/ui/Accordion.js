'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export function Accordion({ items }) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <AccordionItem key={i} title={item.title} content={item.content} />
      ))}
    </div>
  )
}

function AccordionItem({ title, content }) {
  const [open, setOpen] = useState(false)
  const contentRef = useRef(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight)
    }
  }, [open, content])

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-titos-white/5 transition-colors"
      >
        <span className="font-display font-semibold text-titos-white pr-4">{title}</span>
        <ChevronDown
          className={`w-5 h-5 text-titos-gray-400 flex-shrink-0 transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        ref={contentRef}
        style={{ maxHeight: open ? `${height}px` : '0px' }}
        className="overflow-hidden transition-all duration-300 ease-in-out"
      >
        <div className="px-5 pb-4 text-titos-gray-300 leading-relaxed">
          {content}
        </div>
      </div>
    </div>
  )
}
