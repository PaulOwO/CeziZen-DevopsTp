import bcrypt from 'bcrypt'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Vérification des champs obligatoires
  if (!body.email || !body.password) {
    throw createError({
      statusCode: 400,
      message: 'Email et mot de passe obligatoires',
    })
  }

  // Chercher l'utilisateur en DB
  const user = await prisma.user.findUnique({
    where: { email: body.email }
  })

  // Utilisateur introuvable ou inactif
  if (!user || !user.isActive) {
    throw createError({
      statusCode: 401,
      message: 'Email ou mot de passe incorrect',
    })
  }

  // Vérification du mot de passe
  const isValid = await bcrypt.compare(body.password, user.passwordHash)

  if (!isValid) {
    throw createError({
      statusCode: 401,
      message: 'Email ou mot de passe incorrect',
    })
  }

  // Création de la session
  await setUserSession(event, {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    }
  })

  return { success: true }
})