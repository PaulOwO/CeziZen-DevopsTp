import bcrypt from 'bcrypt'
import prisma from '../utils/prisma'
import { isValidEmail, isValidPassword } from '~/utils/helpers'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Vérification des champs obligatoires
 if (!body || !body.email || !body.password || !body.firstName || !body.lastName) {
    throw createError({ statusCode: 400, message: 'Tous les champs sont obligatoires' })
  }

  if (!isValidEmail(body.email)) {
    throw createError({ statusCode: 400, message: 'Format d\'email invalide' })
  }

  if (!isValidPassword(body.password)) {
    throw createError({ statusCode: 400, message: 'Le mot de passe doit contenir au moins 8 caractères' })
  }

  // Vérifier si l'email existe déjà
  const existingUser = await prisma.user.findUnique({
    where: { email: body.email }
  })

  if (existingUser) {
    throw createError({
      statusCode: 409,
      message: 'Un compte existe déjà avec cet email',
    })
  }

  // Hash du mot de passe
  const passwordHash = await bcrypt.hash(body.password, 10)

  // Création de l'utilisateur
  const user = await prisma.user.create({
    data: {
      email: body.email,
      passwordHash,
      firstName: body.firstName,
      lastName: body.lastName,
    }
  })

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    }
  }
})