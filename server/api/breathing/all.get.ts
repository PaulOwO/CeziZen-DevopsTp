import prisma from "../utils/prisma"

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Accès refusé' })
  }

  const presets = await prisma.breathingPreset.findMany({
    orderBy: { name: 'asc' },
  })
  return presets
})