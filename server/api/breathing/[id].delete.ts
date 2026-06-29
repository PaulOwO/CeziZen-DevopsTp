import prisma from "../utils/prisma"

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Accès refusé' })
  }

  const id = parseInt(getRouterParam(event, 'id')!)

  await prisma.breathingPreset.delete({ where: { id } })

  return { success: true }
})