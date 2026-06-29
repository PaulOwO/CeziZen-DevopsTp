import prisma from "../utils/prisma"

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Accès refusé' })
  }

  const body = await readBody(event)

  if (!body || !body.name || !body.inhaleDuration || !body.exhaleDuration) {
    throw createError({ statusCode: 400, message: 'Nom, inspiration et expiration obligatoires' })
  }

  const preset = await prisma.breathingPreset.create({
    data: {
      name: body.name,
      description: body.description ?? null,
      inhaleDuration: body.inhaleDuration,
      holdDuration: body.holdDuration ?? 0,
      exhaleDuration: body.exhaleDuration,
      cycles: body.cycles ?? 5,
      isActive: body.isActive ?? true,
    }
  })

  return preset
})