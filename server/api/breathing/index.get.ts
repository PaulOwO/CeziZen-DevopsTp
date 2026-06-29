import prisma from "../utils/prisma"

export default defineEventHandler(async () => {
  const presets = await prisma.breathingPreset.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })
  return presets
})