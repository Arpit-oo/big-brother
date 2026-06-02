import sharp from 'sharp'
import { join } from 'path'

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <!-- Dark rounded rectangle background -->
  <rect x="8" y="8" width="240" height="240" rx="40" ry="40" fill="#1a1a2e"/>

  <!-- Outer eye shape -->
  <ellipse cx="128" cy="118" rx="80" ry="50" fill="none" stroke="#e63946" stroke-width="8"/>

  <!-- Iris -->
  <circle cx="128" cy="118" r="30" fill="#e63946"/>

  <!-- Pupil -->
  <circle cx="128" cy="118" r="14" fill="#1a1a2e"/>

  <!-- Pupil highlight -->
  <circle cx="121" cy="112" r="5" fill="#ffffff" opacity="0.6"/>

  <!-- Small bar underneath the eye -->
  <rect x="98" y="182" width="60" height="10" rx="5" ry="5" fill="#e63946"/>
</svg>`

async function main() {
  const outputPath = join(__dirname, '..', 'assets', 'icon.png')
  await sharp(Buffer.from(SVG)).resize(256, 256).png().toFile(outputPath)
  console.log(`Icon generated at ${outputPath}`)
}

main().catch((err) => {
  console.error('Failed to generate icon:', err)
  process.exit(1)
})
