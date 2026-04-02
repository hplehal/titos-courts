export default function SectionHeading({ label, title, description, center = true }) {
  return (
    <div className={center ? 'text-center' : ''}>
      {label && (
        <span className="text-titos-gold text-xs font-bold uppercase tracking-[0.2em] mb-3 block">
          {label}
        </span>
      )}
      <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-titos-white mb-4 leading-none tracking-tight">
        {title}
      </h2>
      {description && (
        <p className={`text-base sm:text-lg text-titos-gray-300 max-w-2xl leading-relaxed ${center ? 'mx-auto' : ''}`}>
          {description}
        </p>
      )}
    </div>
  )
}
