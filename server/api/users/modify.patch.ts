import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Accès refusé' })
  }

  const body = await readBody(event)

  if (typeof body.id !== 'number' || typeof body.isActive !== 'boolean') {
    throw createError({ statusCode: 400, message: 'Identifiant invalide ou valeur isActive manquante' })
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: body.id }
  })

  if (!dbUser) {
    throw createError({ statusCode: 404, message: 'Utilisateur introuvable' })
  }

  const updatedUser = await prisma.user.update({
    where: { id: body.id },
    data: { isActive: body.isActive }
  })

  return {
    success: true,
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    }
  }
})