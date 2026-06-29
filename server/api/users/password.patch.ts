import bcrypt from 'bcrypt'
import prisma from '../utils/prisma'
import { isValidPassword } from '~/utils/helpers'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const body = await readBody(event)

  if (!body.currentPassword || !body.newPassword) {
    throw createError({ statusCode: 400, message: 'Tous les champs sont obligatoires' })
  }

  if (!isValidPassword(body.newPassword)) {
      throw createError({ statusCode: 400, message: 'Le mot de passe doit contenir au moins 8 caractères' })
    }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id }
  })

  const isValid = await bcrypt.compare(body.currentPassword, dbUser!.passwordHash)

  if (!isValid) {
    throw createError({ statusCode: 401, message: 'Mot de passe actuel incorrect' })
  }

  const passwordHash = await bcrypt.hash(body.newPassword, 10)

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash }
  })

  return { success: true }
})