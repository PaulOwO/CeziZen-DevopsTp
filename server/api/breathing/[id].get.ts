import prisma from "../utils/prisma"

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id')!)

  const preset = await prisma.breathingPreset.findUnique({
    where: { id, isActive: true }
  })

  if (!preset) {
    throw createError({ statusCode: 404, message: 'Preset introuvable' })
  }

  return preset
})