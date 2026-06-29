import prisma from "../utils/prisma"

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Accès refusé' })
  }

  const id = parseInt(getRouterParam(event, 'id')!)
  const body = await readBody(event)

  const preset = await prisma.breathingPreset.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      inhaleDuration: body.inhaleDuration,
      holdDuration: body.holdDuration,
      exhaleDuration: body.exhaleDuration,
      cycles: body.cycles,
      isActive: body.isActive,
    }
  })

  return preset
})